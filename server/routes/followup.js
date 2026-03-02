import { Router } from 'express';
import db from '../db.js';
import { generateFollowupQuestion, generateFollowupResponse } from '../openai.js';

const router = Router();

const MAX_FOLLOWUPS = 10;

// Get all followup questions for a session (by token)
router.get('/:sessionId/by-token/:token', async (req, res) => {
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

    // Get all followup questions
    const followups = await db.query(
      'SELECT * FROM followup_questions WHERE session_id = $1 ORDER BY question_number ASC',
      [sessionId]
    );

    res.json({
      partner,
      followups: followups.rows,
      canCreateMore: followups.rows.length < MAX_FOLLOWUPS
    });
  } catch (error) {
    console.error('Error fetching followups:', error);
    res.status(500).json({ error: 'Failed to fetch followups' });
  }
});

// Generate AI-suggested question
router.post('/:sessionId/generate-question/:token', async (req, res) => {
  const { sessionId, token } = req.params;

  try {
    const sessionResult = await db.query('SELECT * FROM sessions WHERE id = $1', [sessionId]);
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    // Verify token
    if (token !== session.partner_a_token && token !== session.partner_b_token) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    // Check followup count
    const countResult = await db.query(
      'SELECT COUNT(*) FROM followup_questions WHERE session_id = $1',
      [sessionId]
    );
    if (parseInt(countResult.rows[0].count) >= MAX_FOLLOWUPS) {
      return res.status(400).json({ error: 'Maximum followup questions reached' });
    }

    // Get original responses and advice for context
    const responsesA = await db.query(
      'SELECT question_id, answer FROM responses WHERE session_id = $1 AND partner = $2',
      [sessionId, 'A']
    );
    const responsesB = await db.query(
      'SELECT question_id, answer FROM responses WHERE session_id = $1 AND partner = $2',
      [sessionId, 'B']
    );

    // Get previous followup questions to avoid repetition
    const previousFollowups = await db.query(
      'SELECT question_text, partner_a_answer, partner_b_answer, ai_response FROM followup_questions WHERE session_id = $1 ORDER BY question_number ASC',
      [sessionId]
    );

    const question = await generateFollowupQuestion(
      responsesA.rows,
      responsesB.rows,
      session.partner_a_advice,
      session.category,
      session.partner_a_name,
      session.partner_b_name,
      previousFollowups.rows,
      session.ai_model || 'openai'
    );

    res.json({ question });
  } catch (error) {
    console.error('Error generating question:', error);
    res.status(500).json({ error: 'Failed to generate question' });
  }
});

// Create a followup question (either accept AI suggestion or submit custom)
router.post('/:sessionId/create/:token', async (req, res) => {
  const { sessionId, token } = req.params;
  const { question, createdBy } = req.body;

  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return res.status(400).json({ error: 'Question is required' });
  }

  try {
    const sessionResult = await db.query('SELECT * FROM sessions WHERE id = $1', [sessionId]);
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    // Verify token and determine partner
    let partner = null;
    if (token === session.partner_a_token) {
      partner = 'A';
    } else if (token === session.partner_b_token) {
      partner = 'B';
    } else {
      return res.status(403).json({ error: 'Invalid token' });
    }

    // Check followup count
    const countResult = await db.query(
      'SELECT COUNT(*) FROM followup_questions WHERE session_id = $1',
      [sessionId]
    );
    const currentCount = parseInt(countResult.rows[0].count);
    if (currentCount >= MAX_FOLLOWUPS) {
      return res.status(400).json({ error: 'Maximum followup questions reached' });
    }

    // Create the followup question
    const result = await db.query(
      'INSERT INTO followup_questions (session_id, question_number, question_text, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [sessionId, currentCount + 1, question.trim(), createdBy || partner]
    );

    res.json({ followup: result.rows[0] });
  } catch (error) {
    console.error('Error creating followup:', error);
    res.status(500).json({ error: 'Failed to create followup question' });
  }
});

// Submit answer to a followup question
router.post('/:sessionId/answer/:questionId/:token', async (req, res) => {
  const { sessionId, questionId, token } = req.params;
  const { answer } = req.body;

  if (!answer || typeof answer !== 'string' || answer.trim().length === 0) {
    return res.status(400).json({ error: 'Answer is required' });
  }

  try {
    const sessionResult = await db.query('SELECT * FROM sessions WHERE id = $1', [sessionId]);
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    // Verify token and determine partner
    let partner = null;
    if (token === session.partner_a_token) {
      partner = 'A';
    } else if (token === session.partner_b_token) {
      partner = 'B';
    } else {
      return res.status(403).json({ error: 'Invalid token' });
    }

    // Get the followup question
    const followupResult = await db.query(
      'SELECT * FROM followup_questions WHERE id = $1 AND session_id = $2',
      [questionId, sessionId]
    );
    if (followupResult.rows.length === 0) {
      return res.status(404).json({ error: 'Followup question not found' });
    }

    const followup = followupResult.rows[0];
    const answerField = partner === 'A' ? 'partner_a_answer' : 'partner_b_answer';

    // Check if already answered
    if (followup[answerField]) {
      return res.status(400).json({ error: 'You have already answered this question' });
    }

    // Save the answer
    await db.query(
      `UPDATE followup_questions SET ${answerField} = $1 WHERE id = $2`,
      [answer.trim(), questionId]
    );

    // Check if both partners have now answered
    const updatedResult = await db.query(
      'SELECT * FROM followup_questions WHERE id = $1',
      [questionId]
    );
    const updatedFollowup = updatedResult.rows[0];

    let aiResponse = null;
    if (updatedFollowup.partner_a_answer && updatedFollowup.partner_b_answer && !updatedFollowup.ai_response) {
      // Get previous completed followups for context
      const previousFollowupsResult = await db.query(
        'SELECT question_text, partner_a_answer, partner_b_answer FROM followup_questions WHERE session_id = $1 AND id != $2 AND partner_a_answer IS NOT NULL AND partner_b_answer IS NOT NULL ORDER BY question_number ASC',
        [sessionId, questionId]
      );

      // Generate AI response
      try {
        aiResponse = await generateFollowupResponse(
          updatedFollowup.question_text,
          updatedFollowup.partner_a_answer,
          updatedFollowup.partner_b_answer,
          session.category,
          session.partner_a_name,
          session.partner_b_name,
          session.ai_model || 'openai',
          previousFollowupsResult.rows
        );

        await db.query(
          'UPDATE followup_questions SET ai_response = $1 WHERE id = $2',
          [aiResponse, questionId]
        );
      } catch (aiError) {
        console.error('Error generating AI response:', aiError);
      }
    }

    res.json({
      success: true,
      bothAnswered: !!(updatedFollowup.partner_a_answer && updatedFollowup.partner_b_answer),
      aiResponse
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

export default router;
