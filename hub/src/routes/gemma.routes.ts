import { Router } from 'express';
import { z } from 'zod';
import { getResourceOrThrow, updateResourceSummary } from '../services/resource.service';
import { gradeAnswer } from '../services/grading.service';
import { summarizeResourcePrompt } from '../prompts/summarizeResource.prompt';
import { generateQuizPrompt } from '../prompts/generateQuiz.prompt';
import {
  askGemmaForJson,
  summarySchema,
  quizSchema,
  normalizeQuiz,
} from '../services/jsonRepair.service';
import { ResourceSummary, Quiz } from '../types/quiz';
import { GemmaUnavailableError } from '../types/gemma';
import { badRequest, serviceUnavailable } from '../utils/errors';

export const gemmaRouter = Router();

function handleGemmaError(err: unknown): never {
  if (err instanceof GemmaUnavailableError) {
    throw serviceUnavailable(
      'Gemma is currently unavailable. Start Ollama and pull the model, or enable GEMMA_ALLOW_MOCK_FALLBACK / GEMMA_PROVIDER=mock.',
      { reason: err.message }
    );
  }
  throw err;
}

const summarizeSchema = z.object({ resourceId: z.string().min(1) });

gemmaRouter.post('/gemma/summarize', async (req, res, next) => {
  try {
    const parsed = summarizeSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('resourceId is required', parsed.error.flatten());

    const resource = getResourceOrThrow(parsed.data.resourceId);
    const text = resource.text_content ?? '';
    if (!text.trim()) throw badRequest('Resource has no text content to summarize');

    const prompt = summarizeResourcePrompt(
      text,
      resource.subject ?? 'General',
      resource.level ?? 'JSS2'
    );

    let result: Awaited<ReturnType<typeof askGemmaForJson<ResourceSummary>>>;
    try {
      // One retry with a corrective follow-up prompt if the first draw isn't valid JSON.
      result = await askGemmaForJson<ResourceSummary>(prompt, summarySchema, 1);
    } catch (err) {
      handleGemmaError(err);
    }

    if (!result!.ok || !result!.data) {
      throw serviceUnavailable('Gemma returned malformed JSON for the summary.', { error: result!.error });
    }

    // Persist the summary so the teacher's library reflects it.
    updateResourceSummary(resource.id, result!.data.summary, {
      topics: result!.data.topics,
      prerequisites: result!.data.prerequisites,
      suggestedActivity: result!.data.suggestedActivity,
    });

    res.json({
      summary: result!.data.summary,
      topics: result!.data.topics,
      level: result!.data.level,
      title: result!.data.title,
      subject: result!.data.subject,
      prerequisites: result!.data.prerequisites,
      suggestedActivity: result!.data.suggestedActivity,
    });
  } catch (err) {
    next(err);
  }
});

const quizSchemaReq = z.object({
  resourceId: z.string().min(1),
  questionCount: z.number().int().min(1).max(10).optional(),
  level: z.string().optional(),
});

gemmaRouter.post('/gemma/generate-quiz', async (req, res, next) => {
  try {
    const parsed = quizSchemaReq.safeParse(req.body);
    if (!parsed.success) throw badRequest('resourceId is required', parsed.error.flatten());

    const resource = getResourceOrThrow(parsed.data.resourceId);
    const text = resource.text_content ?? '';
    if (!text.trim()) throw badRequest('Resource has no text content to build a quiz from');

    const questionCount = parsed.data.questionCount ?? 5;
    const level = parsed.data.level ?? resource.level ?? 'JSS2';
    const prompt = generateQuizPrompt(text, questionCount, level);

    let result: Awaited<ReturnType<typeof askGemmaForJson<Quiz>>>;
    try {
      // One retry with a corrective follow-up prompt if the first draw isn't valid JSON.
      result = await askGemmaForJson<Quiz>(prompt, quizSchema, 1);
    } catch (err) {
      handleGemmaError(err);
    }

    if (!result!.ok || !result!.data) {
      throw serviceUnavailable('Gemma returned malformed JSON for the quiz.', { error: result!.error });
    }

    const quiz = normalizeQuiz(result!.data);
    res.json({ questions: quiz.questions });
  } catch (err) {
    next(err);
  }
});

const gradeSchemaReq = z.object({
  question: z.string().min(1),
  expectedAnswer: z.string().default(''),
  studentAnswer: z.string().default(''),
  maxScore: z.number().default(1),
});

gemmaRouter.post('/gemma/grade-answer', async (req, res, next) => {
  try {
    const parsed = gradeSchemaReq.safeParse(req.body);
    if (!parsed.success) throw badRequest('question is required', parsed.error.flatten());

    let result;
    try {
      result = await gradeAnswer(parsed.data);
    } catch (err) {
      handleGemmaError(err);
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
});
