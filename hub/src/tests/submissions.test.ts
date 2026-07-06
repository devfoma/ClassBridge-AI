import request from 'supertest';
import { createApp } from '../app';
import { closeDb } from '../db';
import { Quiz } from '../types/quiz';

const app = createApp();

afterAll(() => closeDb());

async function setupClassWithAssignment() {
  await request(app)
    .post('/users/upsert')
    .send({ id: 'teacher_001', name: 'Teacher A', role: 'teacher' });

  const cls = await request(app)
    .post('/classrooms')
    .send({ teacherId: 'teacher_001', name: 'JSS2 Basic Science' });

  const quiz: Quiz = {
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        question: 'What gas do plants release?',
        options: ['Oxygen', 'Nitrogen', 'Helium', 'Argon'],
        answer: 'Oxygen',
        marks: 1,
      },
      {
        id: 'q2',
        type: 'short_answer',
        question: 'Explain photosynthesis in one sentence.',
        options: [],
        answer: 'Plants use sunlight, water and carbon dioxide to make food and release oxygen.',
        marks: 2,
      },
    ],
  };

  const asg = await request(app).post('/assignments').send({
    classroomId: cls.body.id,
    title: 'Photosynthesis Quiz',
    instructions: 'Read and answer.',
    resourceIds: [],
    quiz,
    publish: true,
  });

  return { classroomId: cls.body.id, classCode: cls.body.classCode, assignmentId: asg.body.assignment.id };
}

describe('assignments, sync and grading', () => {
  it('teacher creates assignment and student can pull it', async () => {
    const { classroomId, classCode, assignmentId } = await setupClassWithAssignment();

    await request(app)
      .post('/classrooms/join')
      .send({ classCode, student: { id: 'student_001', name: 'Ada', deviceId: 'android_abc' } });

    const pull = await request(app)
      .get('/sync/pull')
      .query({ studentId: 'student_001', classroomId });

    expect(pull.status).toBe(200);
    expect(pull.body.assignments.length).toBe(1);
    expect(pull.body.assignments[0].id).toBe(assignmentId);
    expect(pull.body.assignments[0].quiz.questions.length).toBe(2);
  });

  it('student push creates a graded submission with score and feedback', async () => {
    const { classroomId, classCode, assignmentId } = await setupClassWithAssignment();
    await request(app)
      .post('/classrooms/join')
      .send({ classCode, student: { id: 'student_002', name: 'Bola', deviceId: 'dev2' } });

    const push = await request(app)
      .post('/sync/push')
      .send({
        studentId: 'student_002',
        deviceId: 'dev2',
        submissions: [
          {
            id: 'sub_001',
            assignmentId,
            answers: [
              { questionId: 'q1', answer: 'Oxygen' },
              {
                questionId: 'q2',
                answer: 'Plants use sunlight water and carbon dioxide to make food and release oxygen.',
              },
            ],
            submittedAt: new Date().toISOString(),
          },
        ],
      });

    expect(push.status).toBe(200);
    expect(push.body.status).toBe('ok');
    expect(push.body.syncedSubmissionIds).toContain('sub_001');
    const fb = push.body.feedback[0];
    expect(fb.maxScore).toBe(3);
    // MC answer is correct -> at least 1 mark.
    expect(fb.score).toBeGreaterThanOrEqual(1);

    // Teacher can see the submission.
    const list = await request(app).get('/submissions').query({ classroomId });
    expect(list.status).toBe(200);
    expect(list.body.submissions.length).toBe(1);
    expect(list.body.submissions[0].studentName).toBe('Bola');
    expect(list.body.submissions[0].score).toBeGreaterThanOrEqual(1);
  });

  it('returns a valid class insight after submissions', async () => {
    const { classroomId, classCode, assignmentId } = await setupClassWithAssignment();
    await request(app)
      .post('/classrooms/join')
      .send({ classCode, student: { id: 'student_003', name: 'Chidi', deviceId: 'dev3' } });
    await request(app)
      .post('/sync/push')
      .send({
        studentId: 'student_003',
        deviceId: 'dev3',
        submissions: [
          { id: 'sub_x', assignmentId, answers: [{ questionId: 'q1', answer: 'Oxygen' }] },
        ],
      });

    const insight = await request(app).get(`/insights/classroom/${classroomId}`);
    expect(insight.status).toBe(200);
    expect(typeof insight.body.summary).toBe('string');
    expect(Array.isArray(insight.body.commonMisconceptions)).toBe(true);
    expect(typeof insight.body.recommendedRevision).toBe('string');
    expect(typeof insight.body.nextActivity).toBe('string');
  });
});
