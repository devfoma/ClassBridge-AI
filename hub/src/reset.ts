import fs from 'fs';
import { config } from './config';
import { clearAllTables, closeDb } from './db';

/**
 * Reset the hub: wipe all rows and delete the SQLite file so the next run
 * starts fresh. Useful between demos.
 */
function reset() {
  try {
    clearAllTables();
  } catch {
    /* db may not exist yet */
  }
  closeDb();

  for (const suffix of ['', '-wal', '-shm']) {
    const file = config.dbPath + suffix;
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`Removed ${file}`);
    }
  }
  console.log('Hub reset complete. Run `npm run seed` to reseed demo data.');
}

reset();
