/**
 * Thin adapter over Node's built-in `node:sqlite` (DatabaseSync) that exposes a
 * small better-sqlite3-compatible API (prepare/exec/pragma/transaction/close).
 *
 * Why not better-sqlite3? It requires native compilation (Visual Studio C++
 * build tools) which is not always available on demo/school machines. Node 22+
 * ships a built-in SQLite engine that needs zero native builds, so the hub runs
 * anywhere Node runs. This is the one small environment adjustment noted in the
 * README. The rest of the app is written against this API and never notices.
 */
import { DatabaseSync, StatementSync } from 'node:sqlite';

export interface Statement {
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
  run(...params: unknown[]): { changes: number | bigint; lastInsertRowid: number | bigint };
}

class StatementWrapper implements Statement {
  constructor(private stmt: StatementSync) {}

  get(...params: unknown[]): unknown {
    return this.stmt.get(...(params as never[]));
  }

  all(...params: unknown[]): unknown[] {
    return this.stmt.all(...(params as never[]));
  }

  run(...params: unknown[]): { changes: number | bigint; lastInsertRowid: number | bigint } {
    const info = this.stmt.run(...(params as never[]));
    return { changes: info.changes, lastInsertRowid: info.lastInsertRowid };
  }
}

export class SqliteDatabase {
  private db: DatabaseSync;

  constructor(location: string) {
    this.db = new DatabaseSync(location);
  }

  prepare(sql: string): Statement {
    return new StatementWrapper(this.db.prepare(sql));
  }

  exec(sql: string): void {
    this.db.exec(sql);
  }

  /** better-sqlite3-style pragma helper implemented via exec. */
  pragma(statement: string): void {
    this.db.exec(`PRAGMA ${statement};`);
  }

  /** Returns a function that runs `fn` inside a BEGIN/COMMIT transaction. */
  transaction<T extends (...args: unknown[]) => unknown>(fn: T): T {
    const wrapped = (...args: unknown[]) => {
      this.db.exec('BEGIN');
      try {
        const result = fn(...args);
        this.db.exec('COMMIT');
        return result;
      } catch (err) {
        this.db.exec('ROLLBACK');
        throw err;
      }
    };
    return wrapped as T;
  }

  close(): void {
    this.db.close();
  }
}
