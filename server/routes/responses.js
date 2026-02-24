import { Router } from 'express';
import db from '../db.js';
import { generateAdvice } from '../openai.js';

const router = Router();

// Submit partner responses
router.post('/:sessionId/responses', async (req, res) => {
  const { sessionId } = req.params;
  const { partner, responses } = req.body;

  if (!partner || !['A', 'B'].includes(partner)) {
    return res.status(400).json({ error: 'Invalid partner (must be A or B)' });
  }

  if (!responses || !Array.isArray(responses)) {
    return res.status(400).json({ error: 'Invalid responses format' });
  }

  try {
    // Check if session exists
    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check if partner already completed
    const completedField = partner === 'A' ? 'partner_a_completed' : 'partner_b_completed';
    if (session[completedField]) {
      return res.status(400).json({ error: 'Partner has already completed the questionnaire' });
    }

    // Insert responses
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO responses (session_id, partner, question_id, question_type, answer)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((responses) => {
      for (const response of responses) {
        insertStmt.run(sessionId, partner, response.questionId, response.type, response.answer);
      }
    });

    insertMany(responses);

    // Mark partner as completed
    db.prepare(`UPDATE sessions SET ${completedField} = 1 WHERE id = ?`).run(sessionId);

    // Check if both partners have completed
    const updatedSession = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
    const bothCompleted = updatedSession.partner_a_completed && updatedSession.partner_b_completed;

    // If both completed, generate advice
    if (bothCompleted && !updatedSession.partner_a_advice) {
      try {
        const partnerAResponses = db.prepare(
          'SELECT question_id, question_type, answer FROM responses WHERE session_id = ? AND partner = ?'
        ).all(sessionId, 'A');

        const partnerBResponses = db.prepare(
          'SELECT question_id, question_type, answer FROM responses WHERE session_id = ? AND partner = ?'
        ).all(sessionId, 'B');

        // Generate advice for both partners
        const [adviceA, adviceB] = await Promise.all([
          generateAdvice(partnerAResponses, partnerBResponses, 'A'),
          generateAdvice(partnerAResponses, partnerBResponses, 'B')
        ]);

        db.prepare(`
          UPDATE sessions SET partner_a_advice = ?, partner_b_advice = ? WHERE id = ?
        `).run(adviceA, adviceB, sessionId);
      } catch (aiError) {
        console.error('Error generating advice:', aiError);
        // Continue without failing - advice can be generated later
      }
    }

    res.json({
      success: true,
      bothCompleted,
      message: bothCompleted
        ? 'Both partners have completed. Advice is being generated.'
        : 'Responses saved. Waiting for partner to complete.'
    });
  } catch (error) {
    console.error('Error saving responses:', error);
    res.status(500).json({ error: 'Failed to save responses' });
  }
});

// Get advice for a partner
router.get('/:sessionId/advice/:partner', async (req, res) => {
  const { sessionId, partner } = req.params;

  if (!['A', 'B'].includes(partner)) {
    return res.status(400).json({ error: 'Invalid partner (must be A or B)' });
  }

  try {
    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (!session.partner_a_completed || !session.partner_b_completed) {
      return res.status(400).json({
        error: 'Both partners must complete the questionnaire first',
        partnerACompleted: Boolean(session.partner_a_completed),
        partnerBCompleted: Boolean(session.partner_b_completed)
      });
    }

    const adviceField = partner === 'A' ? 'partner_a_advice' : 'partner_b_advice';
    let advice = session[adviceField];

    // If advice not yet generated, try to generate it now
    if (!advice) {
      const partnerAResponses = db.prepare(
        'SELECT question_id, question_type, answer FROM responses WHERE session_id = ? AND partner = ?'
      ).all(sessionId, 'A');

      const partnerBResponses = db.prepare(
        'SELECT question_id, question_type, answer FROM responses WHERE session_id = ? AND partner = ?'
      ).all(sessionId, 'B');

      advice = await generateAdvice(partnerAResponses, partnerBResponses, partner);

      db.prepare(`UPDATE sessions SET ${adviceField} = ? WHERE id = ?`).run(advice, sessionId);
    }

    res.json({ advice });
  } catch (error) {
    console.error('Error fetching advice:', error);
    res.status(500).json({ error: 'Failed to fetch advice' });
  }
});

export default router;
