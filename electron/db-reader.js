import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

const dbPath = path.join(os.homedir(), '.gemini', 'antigravity', 'conversation_summaries.db');

export function queryTasks() {
  if (!fs.existsSync(dbPath)) {
    return [];
  }

  const db = new DatabaseSync(dbPath, { open: true, readOnly: true });
  try {
    const stmt = db.prepare(`
      SELECT conversation_id, title, status, source, not_fully_idle, killed, last_modified_time
      FROM conversation_summaries
      ORDER BY last_modified_time DESC
    `);
    return stmt.all();
  } finally {
    db.close();
  }
}

// CLI direct run
if (process.argv[1] && process.argv[1].endsWith('db-reader.js')) {
  try {
    const data = queryTasks();
    process.stdout.write(JSON.stringify(data));
  } catch (err) {
    process.stderr.write(String(err));
    process.exit(1);
  }
}
