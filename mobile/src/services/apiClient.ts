import { PullResponse, PushResponse, PushSubmissionInput } from '../types/sync';
import { AssignmentPublic } from '../types/assignment';
import { Quiz, QuizQuestion } from '../types/quiz';
import { ResourcePublic } from '../types/resource';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const DEFAULT_TIMEOUT = 20000;

function normalizeBase(hubUrl: string): string {
  return hubUrl.replace(/\/+$/, '');
}

async function request<T>(
  hubUrl: string,
  path: string,
  options: { method?: string; body?: unknown; timeoutMs?: number } = {}
): Promise<T> {
  if (!hubUrl) throw new ApiError(0, 'No hub URL set. Add it in Settings.');
  const url = `${normalizeBase(hubUrl)}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT);

  try {
    const res = await fetch(url, {
      method: options.method ?? 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: options.body != null ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    const text = await res.text();
    const data = text ? safeJson(text) : null;

    if (!res.ok) {
      const errObj = data as { error?: { message?: string } } | null;
      const message = errObj?.error?.message || `Request failed (${res.status})`;
      throw new ApiError(res.status, message);
    }
    return data as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if ((err as Error).name === 'AbortError') {
      throw new ApiError(0, `Could not reach the hub at ${hubUrl} (timed out). Check the URL and Wi-Fi.`);
    }
    throw new ApiError(0, `Could not reach the hub at ${hubUrl}. Check the URL and Wi-Fi.`);
  } finally {
    clearTimeout(timer);
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export interface HubHealth {
  status: string;
  hubName: string;
  version: string;
  time: string;
}

export const api = {
  // --- Health ---
  health(hubUrl: string): Promise<HubHealth> {
    return request<HubHealth>(hubUrl, '/health', { timeoutMs: 6000 });
  },

  gemmaStatus(hubUrl: string): Promise<{ gemma: { provider: string; model: string; reachable: boolean; detail: string } }> {
    return request(hubUrl, '/health/gemma', { timeoutMs: 8000 });
  },

  // --- Users ---
  upsertUser(hubUrl: string, user: { id: string; email?: string | null; passwordHash?: string | null; name: string; role: string; deviceId: string | null }) {
    return request(hubUrl, '/users/upsert', { method: 'POST', body: user });
  },

  login(hubUrl: string, email: string, passwordHash: string): Promise<{ user: { id: string; name: string; role: string; device_id: string | null; email?: string | null } }> {
    return request(hubUrl, '/users/login', { method: 'POST', body: { email, passwordHash } });
  },

  // --- Classrooms ---
  createClassroom(hubUrl: string, teacherId: string, name: string): Promise<{ id: string; name: string; classCode: string }> {
    return request(hubUrl, '/classrooms', { method: 'POST', body: { teacherId, name } });
  },

  listClassrooms(hubUrl: string, teacherId: string): Promise<{ classrooms: Array<{ id: string; name: string; class_code: string }> }> {
    return request(hubUrl, `/classrooms?teacherId=${encodeURIComponent(teacherId)}`);
  },

  getClassroom(hubUrl: string, id: string): Promise<{ classroom: { id: string; name: string; class_code: string; members: unknown[]; assignmentsCount: number; pendingSubmissionsCount: number } }> {
    return request(hubUrl, `/classrooms/${id}`);
  },

  joinClass(
    hubUrl: string,
    classCode: string,
    student: { id: string; name: string; deviceId: string }
  ): Promise<{ classroom: { id: string; name: string; class_code: string }; student: unknown; member: unknown }> {
    return request(hubUrl, '/classrooms/join', { method: 'POST', body: { classCode, student } });
  },

  // --- Resources ---
  listResources(hubUrl: string): Promise<{ resources: ResourcePublic[] }> {
    return request(hubUrl, '/resources');
  },

  getResource(hubUrl: string, id: string): Promise<{ resource: ResourcePublic }> {
    return request(hubUrl, `/resources/${id}`);
  },

  importPack(hubUrl: string, packPath: string): Promise<{ resources: ResourcePublic[] }> {
    return request(hubUrl, '/resources/import-pack', { method: 'POST', body: { packPath } });
  },

  // --- Gemma ---
  summarize(hubUrl: string, resourceId: string): Promise<{ summary: string; topics: string[]; level: string }> {
    return request(hubUrl, '/gemma/summarize', { method: 'POST', body: { resourceId }, timeoutMs: 90000 });
  },

  generateQuiz(
    hubUrl: string,
    resourceId: string,
    questionCount: number,
    level?: string
  ): Promise<{ questions: QuizQuestion[] }> {
    return request(hubUrl, '/gemma/generate-quiz', {
      method: 'POST',
      body: { resourceId, questionCount, level },
      timeoutMs: 90000,
    });
  },

  // --- Assignments ---
  createAssignment(
    hubUrl: string,
    payload: {
      classroomId: string;
      title: string;
      instructions?: string;
      resourceIds: string[];
      quiz: Quiz;
      publish: boolean;
    }
  ): Promise<{ assignment: AssignmentPublic }> {
    return request(hubUrl, '/assignments', { method: 'POST', body: payload });
  },

  listAssignments(hubUrl: string, classroomId: string): Promise<{ assignments: AssignmentPublic[] }> {
    return request(hubUrl, `/assignments?classroomId=${encodeURIComponent(classroomId)}`);
  },

  // --- Submissions ---
  listSubmissions(hubUrl: string, classroomId: string): Promise<{ submissions: unknown[] }> {
    return request(hubUrl, `/submissions?classroomId=${encodeURIComponent(classroomId)}`);
  },

  // --- Insights ---
  classroomInsight(hubUrl: string, classroomId: string): Promise<{
    summary: string;
    commonMisconceptions: string[];
    recommendedRevision: string;
    nextActivity: string;
  }> {
    return request(hubUrl, `/insights/classroom/${classroomId}`, { timeoutMs: 90000 });
  },

  // --- Sync ---
  pull(hubUrl: string, studentId: string, classroomId?: string, since?: string): Promise<PullResponse> {
    const params = new URLSearchParams({ studentId });
    if (classroomId) params.set('classroomId', classroomId);
    if (since) params.set('since', since);
    return request(hubUrl, `/sync/pull?${params.toString()}`);
  },

  push(
    hubUrl: string,
    studentId: string,
    deviceId: string,
    submissions: PushSubmissionInput[]
  ): Promise<PushResponse> {
    return request(hubUrl, '/sync/push', {
      method: 'POST',
      body: { studentId, deviceId, submissions },
      timeoutMs: 90000,
    });
  },
};
