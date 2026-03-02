import { Router } from 'express';
import db from '../db.js';
import { generateAdvice, chatFollowUp, extractMemoryInsights } from '../openai.js';

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
        const category = updatedSession.category || 'communication';
        const unfaithfulPartner = updatedSession.unfaithful_partner;
        const partnerAName = updatedSession.partner_a_name || 'Partner A';
        const partnerBName = updatedSession.partner_b_name || 'Partner B';
        const intakeType = updatedSession.intake_type || 'long';
        const coupleCode = updatedSession.couple_code;
        const aiModel = updatedSession.ai_model || 'openai';

        // Fetch couple memory and previous sessions if couple code exists
        let coupleMemory = '';
        let previousSessions = [];

        if (coupleCode) {
          const coupleResult = await db.query(
            'SELECT memory FROM couples WHERE code = $1',
            [coupleCode]
          );
          if (coupleResult.rows.length > 0) {
            coupleMemory = coupleResult.rows[0].memory || '';
          }

          const prevSessionsResult = await db.query(
            'SELECT id, category, created_at, partner_a_completed, partner_b_completed FROM sessions WHERE couple_code = $1 AND id != $2 ORDER BY created_at DESC LIMIT 10',
            [coupleCode, sessionId]
          );
          previousSessions = prevSessionsResult.rows;
        }

        const [adviceA, adviceB] = await Promise.all([
          generateAdvice(partnerAResult.rows, partnerBResult.rows, 'A', category, unfaithfulPartner, partnerAName, partnerBName, aiModel, intakeType, coupleMemory, previousSessions),
          generateAdvice(partnerAResult.rows, partnerBResult.rows, 'B', category, unfaithfulPartner, partnerAName, partnerBName, aiModel, intakeType, coupleMemory, previousSessions)
        ]);

        await db.query(
          'UPDATE sessions SET partner_a_advice = $1, partner_b_advice = $2 WHERE id = $3',
          [adviceA, adviceB, sessionId]
        );

        // Extract insights and update couple memory (do this async, don't wait)
        if (coupleCode) {
          extractMemoryInsights(
            partnerAResult.rows,
            partnerBResult.rows,
            adviceA,
            category,
            partnerAName,
            partnerBName,
            coupleMemory
          ).then(async (newMemory) => {
            try {
              await db.query(
                'UPDATE couples SET memory = $1, last_memory_update = CURRENT_TIMESTAMP WHERE code = $2',
                [newMemory, coupleCode]
              );
            } catch (memErr) {
              console.error('Error updating couple memory:', memErr);
            }
          }).catch(err => console.error('Error extracting memory:', err));
        }
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

      const category = session.category || 'communication';
      const partnerAName = session.partner_a_name || 'Partner A';
      const partnerBName = session.partner_b_name || 'Partner B';
      const intakeType = session.intake_type || 'long';
      const aiModel = session.ai_model || 'openai';
      advice = await generateAdvice(partnerAResult.rows, partnerBResult.rows, partner, category, session.unfaithful_partner, partnerAName, partnerBName, aiModel, intakeType);

      await db.query(
        `UPDATE sessions SET ${adviceField} = $1 WHERE id = $2`,
        [advice, sessionId]
      );
    }

    res.json({ advice, category: session.category, unfaithfulPartner: session.unfaithful_partner });
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

    // Determine category and role
    const category = session.category || 'communication';
    const targetRole = session.unfaithful_partner === partner ? 'unfaithful' : 'betrayed';

    const response = await chatFollowUp(
      advice,
      conversationHistory || [],
      message,
      category,
      category === 'infidelity' ? targetRole : null
    );

    res.json({ response });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// Get advice by token
router.get('/:sessionId/advice-by-token/:token', async (req, res) => {
  const { sessionId, token } = req.params;
  const regenerate = req.query.regenerate === 'true';
  const requestedAiModel = req.query.aiModel;

  try {
    const sessionResult = await db.query('SELECT * FROM sessions WHERE id = $1', [sessionId]);

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    // Determine which partner this token belongs to
    let partner = null;
    if (token === session.partner_a_token) {
      partner = 'A';
    } else if (token === session.partner_b_token) {
      partner = 'B';
    } else {
      return res.status(403).json({ error: 'Invalid token' });
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

      const category = session.category || 'communication';
      const partnerAName = session.partner_a_name || 'Partner A';
      const partnerBName = session.partner_b_name || 'Partner B';
      const intakeType = session.intake_type || 'long';
      const coupleCode = session.couple_code;
      // Use requested model if provided, otherwise use stored model
      const validModels = ['openai', 'gemini'];
      const aiModel = (requestedAiModel && validModels.includes(requestedAiModel))
        ? requestedAiModel
        : (session.ai_model || 'openai');

      // Fetch couple memory and previous sessions if couple code exists
      let coupleMemory = '';
      let previousSessions = [];

      if (coupleCode) {
        const coupleResult = await db.query(
          'SELECT memory FROM couples WHERE code = $1',
          [coupleCode]
        );
        if (coupleResult.rows.length > 0) {
          coupleMemory = coupleResult.rows[0].memory || '';
        }

        const prevSessionsResult = await db.query(
          'SELECT id, category, created_at, partner_a_completed, partner_b_completed FROM sessions WHERE couple_code = $1 AND id != $2 ORDER BY created_at DESC LIMIT 10',
          [coupleCode, sessionId]
        );
        previousSessions = prevSessionsResult.rows;
      }

      advice = await generateAdvice(partnerAResult.rows, partnerBResult.rows, partner, category, session.unfaithful_partner, partnerAName, partnerBName, aiModel, intakeType, coupleMemory, previousSessions);

      await db.query(
        `UPDATE sessions SET ${adviceField} = $1 WHERE id = $2`,
        [advice, sessionId]
      );

      // Update couple memory if regenerating (async, don't wait)
      if (coupleCode && regenerate) {
        extractMemoryInsights(
          partnerAResult.rows,
          partnerBResult.rows,
          advice,
          category,
          partnerAName,
          partnerBName,
          coupleMemory
        ).then(async (newMemory) => {
          try {
            await db.query(
              'UPDATE couples SET memory = $1, last_memory_update = CURRENT_TIMESTAMP WHERE code = $2',
              [newMemory, coupleCode]
            );
          } catch (memErr) {
            console.error('Error updating couple memory:', memErr);
          }
        }).catch(err => console.error('Error extracting memory:', err));
      }
    }

    res.json({
      advice,
      partner,
      category: session.category,
      unfaithfulPartner: session.unfaithful_partner,
      coupleCode: session.couple_code,
      aiModel: session.ai_model || 'openai'
    });
  } catch (error) {
    console.error('Error fetching advice:', error);
    res.status(500).json({ error: 'Failed to fetch advice' });
  }
});

// Chat follow-up by token
router.post('/:sessionId/chat-by-token/:token', async (req, res) => {
  const { sessionId, token } = req.params;
  const { message, conversationHistory } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const sessionResult = await db.query('SELECT * FROM sessions WHERE id = $1', [sessionId]);

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    // Determine which partner this token belongs to
    let partner = null;
    if (token === session.partner_a_token) {
      partner = 'A';
    } else if (token === session.partner_b_token) {
      partner = 'B';
    } else {
      return res.status(403).json({ error: 'Invalid token' });
    }

    const adviceField = partner === 'A' ? 'partner_a_advice' : 'partner_b_advice';
    const advice = session[adviceField];

    if (!advice) {
      return res.status(400).json({ error: 'No advice found for this partner' });
    }

    // Determine category and role
    const category = session.category || 'communication';
    const targetRole = session.unfaithful_partner === partner ? 'unfaithful' : 'betrayed';

    const response = await chatFollowUp(
      advice,
      conversationHistory || [],
      message,
      category,
      category === 'infidelity' ? targetRole : null
    );

    res.json({ response });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

export default router;
