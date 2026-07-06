import request from 'supertest';
import { createApp } from '../app';
import { closeDb } from '../db';

const app = createApp();

afterAll(() => closeDb());

describe('sync pull/push end-to-end (offline-first flow)', () => {
  it('supports the full teacher->student->sync loop', async () => {
    // Teacher + classroom
    await request(app).post('/users/upsert').send({ id: 't1', name: 'T', role: 'teacher' });
    const cls = await request(app).post('/classrooms').send({ teacherId: 't1', name: 'Science' });

    // Import pack + summarize + generate quiz via mock Gemma
    const path = require('path');
    const packPath = path.resolve(__dirname, '..', '..', '..', 'sample-packs', 'photosynthesis-pack');
    const imp = await request(app).post('/resources/import-pack').send({ packPath });
    const resourceId = imp.body.resources[0].id;

    const summary = await request(app).post('/gemma/summarize').send({ resourceId });
    expect(summary.status).toBe(200);
    expect(summary.body.summary.length).toBeGreaterThan(0);

    const quizRes = await request(app)
      .post('/gemma/generate-quiz')
      .send({ resourceId, questionCount: 5, level: 'JSS2' });
    expect(quizRes.status).toBe(200);
    expect(quizRes.body.questions.length).toBeGreaterThan(0);

    // Publish assignment
    const asg = await request(app).post('/assignments').send({
      classroomId: cls.body.id,
      title: 'Photosynthesis Quiz',
      instructions: 'Read and answer.',
      resourceIds: [resourceId],
      quiz: { questions: quizRes.body.questions },
      publish: true,
    });
    const assignmentId = asg.body.assignment.id;

    // Student joins + pulls
    await request(app)
      .post('/classrooms/join')
      .send({ classCode: cls.body.classCode, student: { id: 's1', name: 'Ada', deviceId: 'dev' } });

    const pull = await request(app).get('/sync/pull').query({ studentId: 's1', classroomId: cls.body.id });
    expect(pull.body.assignments.length).toBe(1);
    // Resource text must be included so the student can read offline.
    expect(pull.body.resources.length).toBe(1);
    expect(pull.body.resources[0].textContent).toContain('Photosynthesis');

    // Student pushes an offline submission
    const firstQ = pull.body.assignments[0].quiz.questions[0];
    const push = await request(app)
      .post('/sync/push')
      .send({
        studentId: 's1',
        deviceId: 'dev',
        submissions: [
          {
            id: 'sub_sync_1',
            assignmentId,
            answers: [{ questionId: firstQ.id, answer: firstQ.type === 'multiple_choice' ? firstQ.options[0] : 'A short answer.' }],
          },
        ],
      });

    expect(push.body.syncedSubmissionIds).toContain('sub_sync_1');
    expect(push.body.feedback[0].maxScore).toBeGreaterThan(0);
  });

  it('pull requires studentId', async () => {
    const res = await request(app).get('/sync/pull');
    expect(res.status).toBe(400);
  });
});
