import { askGemma } from './gemma.service';
import { classInsightPrompt } from '../prompts/classInsight.prompt';
import { parseAndValidate, insightSchema } from './jsonRepair.service';
import { listSubmissionsByClassroom } from './submission.service';
import { getClassroom } from './classroom.service';
import { notFound } from '../utils/errors';

export interface ClassInsight {
  summary: string;
  commonMisconceptions: string[];
  recommendedRevision: string;
  nextActivity: string;
}

export async function getClassroomInsight(classroomId: string): Promise<ClassInsight> {
  const classroom = getClassroom(classroomId);
  if (!classroom) throw notFound('Classroom not found');

  const submissions = listSubmissionsByClassroom(classroomId);

  if (submissions.length === 0) {
    return {
      summary: 'No submissions yet. Once students submit work, insights will appear here.',
      commonMisconceptions: [],
      recommendedRevision: 'Publish an assignment and ask students to complete it.',
      nextActivity: 'Introduce the topic and set the first quiz.',
    };
  }

  // Compact payload for the model: only what it needs.
  const payload = submissions.map((s) => ({
    assignment: s.assignmentTitle,
    student: s.studentName,
    score: s.score,
    maxScore: s.maxScore,
    feedback: s.feedback.map((f) => ({
      feedback: f.feedback,
      misconception: f.misconception,
    })),
  }));

  const prompt = classInsightPrompt(JSON.stringify(payload));
  const { raw } = await askGemma(prompt);
  const result = parseAndValidate<ClassInsight>(raw, insightSchema);

  if (!result.ok || !result.data) {
    return computeFallbackInsight(payload);
  }
  return result.data;
}

/** Deterministic fallback if AI JSON is malformed (rule 20). */
function computeFallbackInsight(
  payload: Array<{ score: number | null; maxScore: number | null; feedback: Array<{ misconception: string }> }>
): ClassInsight {
  const misconceptions = new Map<string, number>();
  let totalPct = 0;
  let counted = 0;
  for (const s of payload) {
    if (s.score != null && s.maxScore) {
      totalPct += s.score / s.maxScore;
      counted++;
    }
    for (const f of s.feedback) {
      if (f.misconception && f.misconception.trim()) {
        misconceptions.set(f.misconception, (misconceptions.get(f.misconception) || 0) + 1);
      }
    }
  }
  const avg = counted ? Math.round((totalPct / counted) * 100) : 0;
  const top = [...misconceptions.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([m]) => m);
  return {
    summary: `Class average is about ${avg}% across ${payload.length} submission(s).`,
    commonMisconceptions: top,
    recommendedRevision: top.length
      ? 'Revisit the topics students struggled with and reteach the key terms.'
      : 'Students are doing well. Extend with a slightly harder activity.',
    nextActivity: 'Run a short recap quiz to check improvement.',
  };
}
