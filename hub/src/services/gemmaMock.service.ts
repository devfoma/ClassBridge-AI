/**
 * Deterministic mock Gemma provider.
 *
 * This is a DEMO / TEST FALLBACK only. It lets the whole app run without
 * Ollama installed. It inspects the prompt to decide which JSON shape to
 * return, then produces stable, valid JSON derived from the prompt text.
 *
 * It never replaces the real Gemma path - see gemma.service.ts.
 */

type MockKind = 'summary' | 'quiz' | 'grade' | 'insight' | 'hint' | 'unknown';

function detectKind(prompt: string): MockKind {
  const p = prompt.toLowerCase();
  if (p.includes('"suggestedactivity"') || p.includes('analyze this lesson resource')) return 'summary';
  if (p.includes('create an offline quiz') || p.includes('"marks"')) return 'quiz';
  if (p.includes('grade the answer') || p.includes('marking guide')) return 'grade';
  if (p.includes('commonmisconceptions') || p.includes('analyze the class submissions')) return 'insight';
  if (p.includes('offline classroom tutor') || p.includes('"hint"')) return 'hint';
  return 'unknown';
}

/** Pull the lesson/resource body out of the prompt so the mock feels grounded. */
function extractResourceText(prompt: string): string {
  const markers = ['Resource:', 'Lesson:'];
  for (const m of markers) {
    const idx = prompt.indexOf(m);
    if (idx !== -1) return prompt.slice(idx + m.length).trim();
  }
  return prompt;
}

function firstSentences(text: string, count: number): string {
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 0);
  return sentences.slice(0, count).join(' ').trim();
}

function keywords(text: string, count: number): string[] {
  const stop = new Set([
    'the', 'and', 'for', 'are', 'this', 'that', 'with', 'from', 'they', 'them', 'their', 'have',
    'what', 'when', 'which', 'into', 'because', 'called', 'these', 'plants', 'plant', 'more', 'than',
    'some', 'each', 'other', 'about', 'notes', 'level', 'subject',
  ]);
  const counts = new Map<string, number>();
  for (const w of text.toLowerCase().match(/[a-z]{4,}/g) || []) {
    if (stop.has(w)) continue;
    counts.set(w, (counts.get(w) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([w]) => w.charAt(0).toUpperCase() + w.slice(1));
}

function extractLevel(prompt: string): string {
  const m = prompt.match(/level\s+"?([A-Za-z0-9]+)"?/i);
  return m ? m[1] : 'JSS2';
}

export function mockGemma(prompt: string): string {
  const kind = detectKind(prompt);
  const resourceText = extractResourceText(prompt);
  const level = extractLevel(prompt);

  switch (kind) {
    case 'summary': {
      const topics = keywords(resourceText, 4);
      return JSON.stringify({
        title: firstSentences(resourceText, 1).slice(0, 60) || 'Lesson Summary',
        subject: 'Basic Science',
        level,
        topics: topics.length ? topics : ['Key ideas'],
        summary:
          firstSentences(resourceText, 3) ||
          'This lesson introduces the core ideas of the topic in simple terms.',
        prerequisites: ['Basic reading', 'Curiosity'],
        suggestedActivity: 'Ask students to explain the main idea in their own words.',
      });
    }
    case 'quiz': {
      const topics = keywords(resourceText, 5);
      const t = topics.length ? topics : ['Topic'];
      const questions = [
        {
          id: 'q1',
          type: 'multiple_choice',
          question: `Which of the following is most related to ${t[0]}?`,
          options: [t[0], t[1] || 'Water', t[2] || 'Air', 'None of these'],
          answer: t[0],
          marks: 1,
        },
        {
          id: 'q2',
          type: 'multiple_choice',
          question: `The lesson mainly explains ${t[0]}. What is the best description?`,
          options: [
            `A process involving ${t[0]}`,
            'A type of animal',
            'A kind of rock',
            'A musical instrument',
          ],
          answer: `A process involving ${t[0]}`,
          marks: 1,
        },
        {
          id: 'q3',
          type: 'short_answer',
          question: `In one sentence, explain the main idea of this lesson.`,
          options: [],
          answer: firstSentences(resourceText, 1) || 'The main idea of the lesson.',
          marks: 2,
        },
        {
          id: 'q4',
          type: 'short_answer',
          question: `List two key terms from this lesson.`,
          options: [],
          answer: `${t[0]} and ${t[1] || t[0]}`,
          marks: 1,
        },
        {
          id: 'q5',
          type: 'multiple_choice',
          question: `Why is this topic important?`,
          options: [
            'It helps us understand the world',
            'It has no use',
            'It is only for exams',
            'It is a secret',
          ],
          answer: 'It helps us understand the world',
          marks: 1,
        },
      ];
      return JSON.stringify({ questions });
    }
    case 'grade': {
      const expected = between(prompt, 'Expected Answer:', 'Student Answer:').toLowerCase();
      const student = after(prompt, 'Student Answer:').toLowerCase();
      const maxScore = numberAfter(prompt, /maximum score for this question is\s+(\d+(?:\.\d+)?)/i) || 1;
      const overlap = wordOverlap(expected, student);
      const score = student.trim().length === 0 ? 0 : Math.round(overlap * maxScore * 10) / 10;
      const good = overlap >= 0.5;
      return JSON.stringify({
        score: Math.max(0, Math.min(score, maxScore)),
        maxScore,
        feedback: good
          ? 'Good answer that captures the key idea.'
          : 'Partly correct. Review the lesson and include the key terms.',
        misconception: good ? '' : 'Missing or mixing up the main terms from the lesson.',
      });
    }
    case 'insight': {
      return JSON.stringify({
        summary:
          'Most students grasped the basic idea, but a few need help with the key terms and definitions.',
        commonMisconceptions: [
          'Confusing the main terms in the lesson',
          'Giving incomplete explanations',
        ],
        recommendedRevision: 'Revisit the key terms and do a short recap with examples.',
        nextActivity: 'Run a quick group activity where students explain the topic to a partner.',
      });
    }
    case 'hint': {
      return JSON.stringify({
        hint: 'Think about the key terms in the lesson and how they connect.',
        relatedTopic: keywords(resourceText, 1)[0] || 'the main idea',
      });
    }
    default:
      return JSON.stringify({ note: 'mock', text: firstSentences(resourceText, 2) });
  }
}

// --- small helpers ---
function between(text: string, a: string, b: string): string {
  const i = text.indexOf(a);
  const j = text.indexOf(b);
  if (i === -1) return '';
  const start = i + a.length;
  const end = j === -1 ? text.length : j;
  return text.slice(start, end).trim();
}
function after(text: string, a: string): string {
  const i = text.indexOf(a);
  return i === -1 ? '' : text.slice(i + a.length).trim();
}
function numberAfter(text: string, re: RegExp): number | null {
  const m = text.match(re);
  return m ? parseFloat(m[1]) : null;
}
function wordOverlap(expected: string, student: string): number {
  const e = new Set((expected.match(/[a-z]{3,}/g) || []).filter((w) => w.length > 2));
  const s = new Set(student.match(/[a-z]{3,}/g) || []);
  if (e.size === 0) return s.size > 0 ? 0.6 : 0;
  let hit = 0;
  for (const w of e) if (s.has(w)) hit++;
  return hit / e.size;
}
