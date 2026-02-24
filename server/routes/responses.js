import { Router } from 'express';
import db from '../db.js';
import { generateAdvice, chatFollowUp } from '../openai.js';

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
    const sessionResult = await db.query('SELECT * FROM sessions WHERE id = $1', [sessionId]);
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const session = sessionResult.rows[0];

    // Check if partner already completed
    const completedField = partner === 'A' ? 'partner_a_completed' : 'partner_b_completed';
    if (session[completedField]) {
      return res.status(400).json({ error: 'Partner has already completed the questionnaire' });
    }

    // Insert responses
    for (const response of responses) {
      await db.query(
        `INSERT INTO responses (session_id, partner, question_id, question_type, answer)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (session_id, partner, question_id) DO UPDATE SET answer = $5`,
        [sessionId, partner, response.questionId, response.type, response.answer]
      );
    }

    // Mark partner as completed
    await db.query(
      `UPDATE sessions SET ${completedField} = TRUE WHERE id = $1`,
      [sessionId]
    );

    // Check if both partners have completed
    const updatedResult = await db.query('SELECT * FROM sessions WHERE id = $1', [sessionId]);
    const updatedSession = updatedResult.rows[0];
    const bothCompleted = updatedSession.partner_a_completed && updatedSession.partner_b_completed;

    // If both completed, generate advice
    if (bothCompleted && !updatedSession.partner_a_advice) {
      try {
        const partnerAResult = await db.query(
          'SELECT question_id, question_type, answer FROM responses WHERE session_id = $1 AND partner = $2',
          [sessionId, 'A']
        );
        const partnerBResult = await db.query(
          'SELECT question_id, question_type, answer FROM responses WHERE session_id = $1 AND partner = $2',
          [sessionId, 'B']
        );

        // Generate advice for both partners
        const unfaithfulPartner = updatedSession.unfaithful_partner;
        const partnerAName = updatedSession.partner_a_name || 'Partner A';
        const partnerBName = updatedSession.partner_b_name || 'Partner B';
        const [adviceA, adviceB] = await Promise.all([
          generateAdvice(partnerAResult.rows, partnerBResult.rows, 'A', unfaithfulPartner, partnerAName, partnerBName),
          generateAdvice(partnerAResult.rows, partnerBResult.rows, 'B', unfaithfulPartner, partnerAName, partnerBName)
        ]);

        await db.query(
          'UPDATE sessions SET partner_a_advice = $1, partner_b_advice = $2 WHERE id = $3',
          [adviceA, adviceB, sessionId]
        );
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
  const regenerate = req.query.regenerate === 'true';

  if (!['A', 'B'].includes(partner)) {
    return res.status(400).json({ error: 'Invalid partner (must be A or B)' });
  }

  try {
    const sessionResult = await db.query('SELECT * FROM sessions WHERE id = $1', [sessionId]);

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    if (!session.partner_a_completed || !session.partner_b_completed) {
      return res.status(400).json({
        error: 'Both partners must complete the questionnaire first',
        partnerACompleted: Boolean(session.partner_a_completed),
        partnerBCompleted: Boolean(session.partner_b_completed)
      });
    }

    const adviceField = partner === 'A' ? 'partner_a_advice' : 'partner_b_advice';
    let advice = session[adviceField];

    // If advice not yet generated OR regenerate requested, generate it
    if (!advice || regenerate) {
      const partnerAResult = await db.query(
        'SELECT question_id, question_type, answer FROM responses WHERE session_id = $1 AND partner = $2',
        [sessionId, 'A']
      );
      const partnerBResult = await db.query(
        'SELECT question_id, question_type, answer FROM responses WHERE session_id = $1 AND partner = $2',
        [sessionId, 'B']
      );

      const partnerAName = session.partner_a_name || 'Partner A';
      const partnerBName = session.partner_b_name || 'Partner B';
      advice = await generateAdvice(partnerAResult.rows, partnerBResult.rows, partner, session.unfaithful_partner, partnerAName, partnerBName);

      await db.query(
        `UPDATE sessions SET ${adviceField} = $1 WHERE id = $2`,
        [advice, sessionId]
      );
    }

    res.json({ advice, unfaithfulPartner: session.unfaithful_partner });
  } catch (error) {
    console.error('Error fetching advice:', error);
    res.status(500).json({ error: 'Failed to fetch advice' });
  }
});

// Chat follow-up endpoint
router.post('/:sessionId/chat/:partner', async (req, res) => {
  const { sessionId, partner } = req.params;
  const { message, conversationHistory } = req.body;

  if (!['A', 'B'].includes(partner)) {
    return res.status(400).json({ error: 'Invalid partner (must be A or B)' });
  }

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const sessionResult = await db.query('SELECT * FROM sessions WHERE id = $1', [sessionId]);

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];
    const adviceField = partner === 'A' ? 'partner_a_advice' : 'partner_b_advice';
    const advice = session[adviceField];

    if (!advice) {
      return res.status(400).json({ error: 'No advice found for this partner' });
    }

    // Determine role
    const targetRole = session.unfaithful_partner === partner ? 'unfaithful' : 'betrayed';

    const response = await chatFollowUp(
      advice,
      conversationHistory || [],
      message,
      targetRole
    );

    res.json({ response });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

export default router;
