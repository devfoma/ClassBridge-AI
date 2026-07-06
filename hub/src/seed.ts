import path from 'path';
import { getDb } from './db';
import { upsertUser, createClassroom } from './services/classroom.service';
import { importPackFromFolder } from './services/pack.service';

/**
 * Seed a demo teacher, a classroom and the Photosynthesis sample pack so the
 * hub is instantly demo-ready. Safe to run multiple times.
 */
function seed() {
  getDb();

  const teacher = upsertUser({
    id: 'teacher_001',
    name: 'Teacher A',
    role: 'teacher',
    deviceId: 'seed_device',
  });
  console.log(`Seeded teacher: ${teacher.name} (${teacher.id})`);

  const classroom = createClassroom({ teacherId: teacher.id, name: 'JSS2 Basic Science' });
  console.log(`Seeded classroom: ${classroom.name} -> class code ${classroom.class_code}`);

  const packPath = path.resolve(__dirname, '..', '..', 'sample-packs', 'photosynthesis-pack');
  try {
    const resources = importPackFromFolder(packPath);
    console.log(`Imported ${resources.length} resource(s) from Photosynthesis pack:`);
    for (const r of resources) console.log(`  - ${r.title} (${r.id})`);
  } catch (err) {
    console.warn(`Could not import sample pack from ${packPath}: ${(err as Error).message}`);
  }

  console.log('\nSeed complete. Start the hub with `npm run dev` and join with the class code above.');
}

seed();
