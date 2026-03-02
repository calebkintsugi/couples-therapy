import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database schema
export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      category TEXT,
      unfaithful_partner TEXT CHECK (unfaithful_partner IN ('A', 'B')),
      partner_a_name TEXT,
      partner_b_name TEXT,
      partner_a_completed BOOLEAN DEFAULT FALSE,
      partner_b_completed BOOLEAN DEFAULT FALSE,
      partner_a_advice TEXT,
      partner_b_advice TEXT
    );

    CREATE TABLE IF NOT EXISTS responses (
      id SERIAL PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES sessions(id),
      partner TEXT NOT NULL CHECK (partner IN ('A', 'B')),
      question_id TEXT NOT NULL,
      question_type TEXT NOT NULL CHECK (question_type IN ('scale', 'text')),
      answer TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(session_id, partner, question_id)
    );
  `);

  // Add columns if they don't exist (for existing databases)
  try {
    await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS partner_a_name TEXT`);
    await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS partner_b_name TEXT`);
    await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS category TEXT`);
    await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS intake_type TEXT DEFAULT 'long'`);
  } catch (e) {
    // Columns may already exist
  }
}

export default pool;
