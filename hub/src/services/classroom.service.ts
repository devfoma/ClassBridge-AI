import { getDb } from '../db';
import { newId, generateClassCode } from '../utils/ids';
import { nowIso } from '../utils/dates';
import { badRequest, notFound } from '../utils/errors';
import { Classroom, ClassroomDetail, ClassroomMember, User, UserRole } from '../types/classroom';

export function upsertUser(input: {
  id: string;
  name: string;
  role: UserRole;
  deviceId?: string | null;
}): User {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(input.id) as User | undefined;
  if (existing) {
    db.prepare('UPDATE users SET name = ?, role = ?, device_id = ? WHERE id = ?').run(
      input.name,
      input.role,
      input.deviceId ?? existing.device_id,
      input.id
    );
  } else {
    db.prepare(
      'INSERT INTO users (id, name, role, device_id, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(input.id, input.name, input.role, input.deviceId ?? null, nowIso());
  }
  return db.prepare('SELECT * FROM users WHERE id = ?').get(input.id) as User;
}

export function createClassroom(input: { teacherId: string; name: string }): Classroom {
  const db = getDb();
  if (!input.name?.trim()) throw badRequest('Classroom name is required');

  // Ensure the class code is unique.
  let code = generateClassCode(input.name);
  for (let i = 0; i < 10; i++) {
    const clash = db.prepare('SELECT 1 FROM classrooms WHERE class_code = ?').get(code);
    if (!clash) break;
    code = generateClassCode(input.name);
  }

  const classroom: Classroom = {
    id: newId('class'),
    name: input.name.trim(),
    teacher_id: input.teacherId,
    class_code: code,
    created_at: nowIso(),
  };
  db.prepare(
    'INSERT INTO classrooms (id, name, teacher_id, class_code, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(classroom.id, classroom.name, classroom.teacher_id, classroom.class_code, classroom.created_at);
  return classroom;
}

export function getClassroom(id: string): Classroom | undefined {
  return getDb().prepare('SELECT * FROM classrooms WHERE id = ?').get(id) as Classroom | undefined;
}

export function getClassroomByCode(code: string): Classroom | undefined {
  return getDb()
    .prepare('SELECT * FROM classrooms WHERE class_code = ?')
    .get(code) as Classroom | undefined;
}

export function listClassroomsForTeacher(teacherId: string): Classroom[] {
  return getDb()
    .prepare('SELECT * FROM classrooms WHERE teacher_id = ? ORDER BY created_at DESC')
    .all(teacherId) as Classroom[];
}

export function getClassroomDetail(id: string): ClassroomDetail {
  const db = getDb();
  const classroom = getClassroom(id);
  if (!classroom) throw notFound('Classroom not found');

  const members = db
    .prepare(
      `SELECT m.student_id as studentId, u.name as name, m.joined_at as joinedAt
       FROM classroom_members m
       LEFT JOIN users u ON u.id = m.student_id
       WHERE m.classroom_id = ?
       ORDER BY m.joined_at ASC`
    )
    .all(id) as Array<{ studentId: string; name: string; joinedAt: string }>;

  const assignmentsCount = (
    db.prepare('SELECT COUNT(*) as c FROM assignments WHERE classroom_id = ?').get(id) as { c: number }
  ).c;

  const pendingSubmissionsCount = (
    db
      .prepare(
        `SELECT COUNT(*) as c FROM submissions s
         JOIN assignments a ON a.id = s.assignment_id
         WHERE a.classroom_id = ? AND s.score IS NULL`
      )
      .get(id) as { c: number }
  ).c;

  return {
    ...classroom,
    members: members.map((m) => ({ ...m, name: m.name || 'Student' })),
    assignmentsCount,
    pendingSubmissionsCount,
  };
}

export function joinClassroom(input: {
  classCode: string;
  student: { id: string; name: string; deviceId?: string };
}): { classroom: Classroom; student: User; member: ClassroomMember } {
  const db = getDb();
  const classroom = getClassroomByCode(input.classCode);
  if (!classroom) throw notFound(`No classroom found for code "${input.classCode}"`);

  const student = upsertUser({
    id: input.student.id,
    name: input.student.name,
    role: 'student',
    deviceId: input.student.deviceId,
  });

  let member = db
    .prepare('SELECT * FROM classroom_members WHERE classroom_id = ? AND student_id = ?')
    .get(classroom.id, student.id) as ClassroomMember | undefined;

  if (!member) {
    member = {
      id: newId('member'),
      classroom_id: classroom.id,
      student_id: student.id,
      joined_at: nowIso(),
    };
    db.prepare(
      'INSERT INTO classroom_members (id, classroom_id, student_id, joined_at) VALUES (?, ?, ?, ?)'
    ).run(member.id, member.classroom_id, member.student_id, member.joined_at);
  }

  return { classroom, student, member };
}

export function listClassroomsForStudent(studentId: string): Classroom[] {
  return getDb()
    .prepare(
      `SELECT c.* FROM classrooms c
       JOIN classroom_members m ON m.classroom_id = c.id
       WHERE m.student_id = ?
       ORDER BY c.created_at DESC`
    )
    .all(studentId) as Classroom[];
}
