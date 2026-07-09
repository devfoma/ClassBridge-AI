import request from 'supertest';
import path from 'path';
import { createApp } from '../app';
import { closeDb } from '../db';

const app = createApp();

afterAll(() => closeDb());

describe('classrooms + pack import', () => {
  it('creates a classroom with a class code', async () => {
    await request(app)
      .post('/users/upsert')
      .send({ id: 'teacher_001', name: 'Teacher A', role: 'teacher', deviceId: 'd1' });

    const res = await request(app)
      .post('/classrooms')
      .send({ teacherId: 'teacher_001', name: 'JSS2 Basic Science' });

    expect(res.status).toBe(200);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe('JSS2 Basic Science');
    expect(res.body.classCode).toMatch(/^[A-Z0-9]{1,4}-\d{4}$/);
  });

  it('lets a student join by class code', async () => {
    const create = await request(app)
      .post('/classrooms')
      .send({ teacherId: 'teacher_001', name: 'JSS2 Maths' });
    const classCode = create.body.classCode;

    const join = await request(app)
      .post('/classrooms/join')
      .send({
        classCode,
        student: { id: 'student_001', name: 'Ada', deviceId: 'android_abc' },
      });

    expect(join.status).toBe(200);
    expect(join.body.classroom.class_code).toBe(classCode);
    expect(join.body.student.id).toBe('student_001');
    expect(join.body.member.classroom_id).toBe(create.body.id);
  });

  it('rejects joining with an unknown class code', async () => {
    const res = await request(app)
      .post('/classrooms/join')
      .send({ classCode: 'NOPE-0000', student: { id: 's2', name: 'Bob' } });
    expect(res.status).toBe(404);
    expect(res.body.error.message).toContain('NOPE-0000');
  });

  it('imports the photosynthesis sample pack as resources', async () => {
    const packPath = path.resolve(__dirname, '..', '..', '..', 'sample-packs', 'photosynthesis-pack');
    const res = await request(app).post('/resources/import-pack').send({ packPath });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.resources)).toBe(true);
    expect(res.body.resources.length).toBeGreaterThan(0);
    expect(res.body.resources[0].title).toBe('Photosynthesis Notes');
    expect(res.body.resources[0].type).toBe('text');
    expect(res.body.importedCount).toBe(res.body.resources.length);
    expect(res.body.skippedCount).toBe(0);
  });

  it('does not duplicate resources when the same pack is imported again', async () => {
    const packPath = path.resolve(__dirname, '..', '..', '..', 'sample-packs', 'math-fractions-pack');

    const first = await request(app).post('/resources/import-pack').send({ packPath });
    expect(first.status).toBe(200);
    expect(first.body.importedCount).toBe(1);
    expect(first.body.skippedCount).toBe(0);
    const firstId = first.body.resources[0].id;

    const second = await request(app).post('/resources/import-pack').send({ packPath });
    expect(second.status).toBe(200);
    expect(second.body.importedCount).toBe(0);
    expect(second.body.skippedCount).toBe(1);
    expect(second.body.resources[0].id).toBe(firstId);

    const list = await request(app).get('/resources');
    const matching = list.body.resources.filter((r: { title: string }) => r.title === 'Comparing Fractions Notes');
    expect(matching.length).toBe(1);
  });
});
