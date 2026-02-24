import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'therapy.db'));

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    partner_a_completed INTEGER DEFAULT 0,
    partner_b_completed INTEGER DEFAULT 0,
    partner_a_advice TEXT,
    partner_b_advice TEXT
  );

  CREATE TABLE IF NOT EXISTS responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    partner TEXT NOT NULL CHECK (partner IN ('A', 'B')),
    question_id TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('scale', 'text')),
    answer TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id),
    UNIQUE(session_id, partner, question_id)
  );
`);

export default db;
