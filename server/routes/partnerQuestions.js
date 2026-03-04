import { Router } from 'express';
import db from '../db.js';
import { encrypt, decrypt, decryptFields, decryptRows } from '../encryption.js';

const router = Router();

// Fields to encrypt
const QUESTION_ENCRYPTED_FIELDS = ['question_text'];

// Get questions sent to this partner
router.get('/:sessionId/for/:token', async (req, res) => {
  const { sessionId, token } = req.params;

  try {
    // Verify token and get partner
    const sessionResult = await db.query('SELECT * FROM sessions WHERE id = $1', [sessionId]);
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];
    let partner = null;
    if (token === session.partner_a_token) {
      partner = 'A';
    } else if (token === session.partner_b_token) {
      partner = 'B';
    } else {
      return res.status(403).json({ error: 'Invalid token' });
    }

    // Get questions sent TO this partner
    const questions = await db.query(
      'SELECT * FROM partner_questions WHERE session_id = $1 AND to_partner = $2 ORDER BY created_at DESC',
      [sessionId, partner]
    );

    // Get questions sent BY this partner
    const sentQuestions = await db.query(
      'SELECT * FROM partner_questions WHERE session_id = $1 AND from_partner = $2 ORDER BY created_at DESC',
      [sessionId, partner]
    );

    // Mark received questions as read
    await db.query(
      'UPDATE partner_questions SET is_read = TRUE WHERE session_id = $1 AND to_partner = $2',
      [sessionId, partner]
    );

    // Decrypt questions before returning
    res.json({
      received: decryptRows(questions.rows, QUESTION_ENCRYPTED_FIELDS),
      sent: decryptRows(sentQuestions.rows, QUESTION_ENCRYPTED_FIELDS),
      partnerName: partner === 'A' ? session.partner_b_name : session.partner_a_name
    });
  } catch (error) {
    console.error('Error fetching partner questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Send a question to partner
router.post('/:sessionId/send/:token', async (req, res) => {
  const { sessionId, token } = req.params;
  const { question } = req.body;

  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return res.status(400).json({ error: 'Question is required' });
  }

  try {
    const sessionResult = await db.query('SELECT * FROM sessions WHERE id = $1', [sessionId]);
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];
    let fromPartner = null;
    let toPartner = null;

    if (token === session.partner_a_token) {
      fromPartner = 'A';
      toPartner = 'B';
    } else if (token === session.partner_b_token) {
      fromPartner = 'B';
      toPartner = 'A';
    } else {
      return res.status(403).json({ error: 'Invalid token' });
    }

    // Insert the question (encrypted)
    const result = await db.query(
      'INSERT INTO partner_questions (session_id, from_partner, to_partner, question_text) VALUES ($1, $2, $3, $4) RETURNING *',
      [sessionId, fromPartner, toPartner, encrypt(question.trim())]
    );

    // Return decrypted
    res.json({ question: decryptFields(result.rows[0], QUESTION_ENCRYPTED_FIELDS) });
  } catch (error) {
    console.error('Error sending question:', error);
    res.status(500).json({ error: 'Failed to send question' });
  }
});

export default router;
