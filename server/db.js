import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database schema
export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS couples (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      partner_a_name TEXT,
      partner_b_name TEXT,
      memory TEXT DEFAULT '',
      last_memory_update TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      couple_code TEXT,
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
    await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS partner_a_token TEXT`);
    await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS partner_b_token TEXT`);
    await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS couple_code TEXT`);
    await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS partner_a_pin TEXT`);
    await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS partner_b_pin TEXT`);
    await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS ai_model TEXT DEFAULT 'gemini'`);
    await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS couple_advice TEXT`);

    // Create followup_questions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS followup_questions (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id),
        question_number INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        created_by TEXT NOT NULL CHECK (created_by IN ('AI', 'A', 'B')),
        partner_a_answer TEXT,
        partner_b_answer TEXT,
        ai_response TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(session_id, question_number)
      )
    `);

    // Create partner_questions table for direct partner-to-partner questions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS partner_questions (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id),
        from_partner TEXT NOT NULL CHECK (from_partner IN ('A', 'B')),
        to_partner TEXT NOT NULL CHECK (to_partner IN ('A', 'B')),
        question_text TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (e) {
    // Columns may already exist
  }

  // Create couples table if it doesn't exist
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS couples (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        partner_a_name TEXT,
        partner_b_name TEXT,
        memory TEXT DEFAULT '',
        last_memory_update TIMESTAMP
      )
    `);
    await pool.query(`ALTER TABLE couples ADD COLUMN IF NOT EXISTS memory TEXT DEFAULT ''`);
    await pool.query(`ALTER TABLE couples ADD COLUMN IF NOT EXISTS last_memory_update TIMESTAMP`);
  } catch (e) {
    // Table may already exist
  }

  // Create journals table
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS journals (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        partner_a_name TEXT,
        partner_b_name TEXT,
        partner_a_token TEXT,
        partner_b_token TEXT,
        partner_a_word_count INTEGER DEFAULT 0,
        partner_b_word_count INTEGER DEFAULT 0,
        ai_activated BOOLEAN DEFAULT FALSE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id SERIAL PRIMARY KEY,
        journal_id TEXT NOT NULL REFERENCES journals(id),
        partner TEXT NOT NULL CHECK (partner IN ('A', 'B')),
        content TEXT NOT NULL,
        prompt TEXT,
        ai_response TEXT,
        word_count INTEGER DEFAULT 0,
        started_at TIMESTAMP,
        ended_at TIMESTAMP,
        summary TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add columns if they don't exist
    await pool.query(`ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS started_at TIMESTAMP`);
    await pool.query(`ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP`);
    await pool.query(`ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS summary TEXT`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS journal_questions (
        id SERIAL PRIMARY KEY,
        journal_id TEXT NOT NULL REFERENCES journals(id),
        from_partner TEXT NOT NULL CHECK (from_partner IN ('A', 'B')),
        to_partner TEXT NOT NULL CHECK (to_partner IN ('A', 'B')),
        question_text TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        is_dismissed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add is_dismissed column if it doesn't exist
    await pool.query(`ALTER TABLE journal_questions ADD COLUMN IF NOT EXISTS is_dismissed BOOLEAN DEFAULT FALSE`);
    // Track if the asker has seen responses
    await pool.query(`ALTER TABLE journal_questions ADD COLUMN IF NOT EXISTS asker_notified BOOLEAN DEFAULT FALSE`);

    // Question responses/conversation table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS journal_question_messages (
        id SERIAL PRIMARY KEY,
        question_id INTEGER NOT NULL REFERENCES journal_questions(id),
        from_partner TEXT NOT NULL CHECK (from_partner IN ('A', 'B')),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (e) {
    // Tables may already exist
  }

  // Analytics table
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS analytics (
        id SERIAL PRIMARY KEY,
        event_type TEXT NOT NULL,
        event_name TEXT NOT NULL,
        page TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (e) {
    // Table may already exist
  }

  // Subscriptions table
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        couple_code TEXT NOT NULL,
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        status TEXT DEFAULT 'inactive',
        current_period_start TIMESTAMP,
        current_period_end TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_subscriptions_couple_code ON subscriptions(couple_code)`);
  } catch (e) {
    // Table may already exist
  }

  // Promo codes table
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS promo_codes (
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        free_months INTEGER NOT NULL DEFAULT 1,
        max_uses INTEGER,
        uses_count INTEGER DEFAULT 0,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS promo_redemptions (
        id SERIAL PRIMARY KEY,
        promo_code_id INTEGER NOT NULL REFERENCES promo_codes(id),
        couple_code TEXT NOT NULL,
        redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(promo_code_id, couple_code)
      )
    `);

    // Insert default promo codes if they don't exist
    await pool.query(`
      INSERT INTO promo_codes (code, free_months, max_uses)
      VALUES
        ('MENSGROUP2026', 3, 50),
        ('FACEBOOK2026', 3, 50),
        ('THEFORGE2026', 3, 50)
      ON CONFLICT (code) DO NOTHING
    `);
  } catch (e) {
    // Tables may already exist
  }
}

export default pool;
