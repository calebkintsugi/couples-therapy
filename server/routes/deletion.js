import { Router } from 'express';
import db from '../db.js';

const router = Router();

// Delete a session and all associated data
router.delete('/session/:sessionId/:token', async (req, res) => {
  const { sessionId, token } = req.params;

  try {
    // Verify the token belongs to this session
    const sessionResult = await db.query(
      'SELECT * FROM sessions WHERE id = $1 AND (partner_a_token = $2 OR partner_b_token = $2)',
      [sessionId, token]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized - invalid token' });
    }

    // Delete in order due to foreign key constraints
    // Delete followup questions
    await db.query('DELETE FROM followup_questions WHERE session_id = $1', [sessionId]);

    // Delete partner questions
    await db.query('DELETE FROM partner_questions WHERE session_id = $1', [sessionId]);

    // Delete responses
    await db.query('DELETE FROM responses WHERE session_id = $1', [sessionId]);

    // Delete the session
    await db.query('DELETE FROM sessions WHERE id = $1', [sessionId]);

    res.json({ success: true, message: 'Session and all associated data deleted' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Delete a journal and all associated data
router.delete('/journal/:journalId/:token', async (req, res) => {
  const { journalId, token } = req.params;

  try {
    // Verify the token belongs to this journal
    const journalResult = await db.query(
      'SELECT * FROM journals WHERE id = $1 AND (partner_a_token = $2 OR partner_b_token = $2)',
      [journalId, token]
    );

    if (journalResult.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized - invalid token' });
    }

    // Get all question IDs for this journal to delete messages
    const questionsResult = await db.query(
      'SELECT id FROM journal_questions WHERE journal_id = $1',
      [journalId]
    );
    const questionIds = questionsResult.rows.map(q => q.id);

    // Delete question messages
    if (questionIds.length > 0) {
      await db.query(
        'DELETE FROM journal_question_messages WHERE question_id = ANY($1)',
        [questionIds]
      );
    }

    // Delete journal questions
    await db.query('DELETE FROM journal_questions WHERE journal_id = $1', [journalId]);

    // Delete journal entries
    await db.query('DELETE FROM journal_entries WHERE journal_id = $1', [journalId]);

    // Delete the journal
    await db.query('DELETE FROM journals WHERE id = $1', [journalId]);

    res.json({ success: true, message: 'Journal and all associated data deleted' });
  } catch (error) {
    console.error('Error deleting journal:', error);
    res.status(500).json({ error: 'Failed to delete journal' });
  }
});

// Get data summary for a session (for transparency before deletion)
router.get('/session/:sessionId/:token/summary', async (req, res) => {
  const { sessionId, token } = req.params;

  try {
    const sessionResult = await db.query(
      'SELECT * FROM sessions WHERE id = $1 AND (partner_a_token = $2 OR partner_b_token = $2)',
      [sessionId, token]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized - invalid token' });
    }

    const session = sessionResult.rows[0];

    // Count responses
    const responsesResult = await db.query(
      'SELECT COUNT(*) as count FROM responses WHERE session_id = $1',
      [sessionId]
    );

    // Count followup questions
    const followupsResult = await db.query(
      'SELECT COUNT(*) as count FROM followup_questions WHERE session_id = $1',
      [sessionId]
    );

    res.json({
      sessionId,
      createdAt: session.created_at,
      category: session.category,
      responseCount: parseInt(responsesResult.rows[0].count),
      followupCount: parseInt(followupsResult.rows[0].count),
      hasAdvice: !!session.partner_a_advice || !!session.partner_b_advice,
    });
  } catch (error) {
    console.error('Error getting session summary:', error);
    res.status(500).json({ error: 'Failed to get session summary' });
  }
});

// Get data summary for a journal (for transparency before deletion)
router.get('/journal/:journalId/:token/summary', async (req, res) => {
  const { journalId, token } = req.params;

  try {
    const journalResult = await db.query(
      'SELECT * FROM journals WHERE id = $1 AND (partner_a_token = $2 OR partner_b_token = $2)',
      [journalId, token]
    );

    if (journalResult.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized - invalid token' });
    }

    const journal = journalResult.rows[0];

    // Count entries
    const entriesResult = await db.query(
      'SELECT COUNT(*) as count FROM journal_entries WHERE journal_id = $1',
      [journalId]
    );

    // Count questions
    const questionsResult = await db.query(
      'SELECT COUNT(*) as count FROM journal_questions WHERE journal_id = $1',
      [journalId]
    );

    res.json({
      journalId,
      createdAt: journal.created_at,
      entryCount: parseInt(entriesResult.rows[0].count),
      questionCount: parseInt(questionsResult.rows[0].count),
      totalWords: journal.partner_a_word_count + journal.partner_b_word_count,
    });
  } catch (error) {
    console.error('Error getting journal summary:', error);
    res.status(500).json({ error: 'Failed to get journal summary' });
  }
});

export default router;
