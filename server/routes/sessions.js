import { Router } from 'express';
import { nanoid } from 'nanoid';
import db from '../db.js';

const router = Router();

// Generate a readable couple code (6 chars, uppercase alphanumeric)
function generateCoupleCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create a new session
router.post('/', async (req, res) => {
  const { coupleCode } = req.body || {};
  const sessionId = nanoid(10);
  const partnerAToken = nanoid(8);
  const partnerBToken = nanoid(8);

  try {
    let finalCoupleCode = coupleCode?.toUpperCase();
    let isNewCouple = false;

    if (finalCoupleCode) {
      // Verify the couple code exists
      const coupleResult = await db.query(
        'SELECT * FROM couples WHERE code = $1',
        [finalCoupleCode]
      );
      if (coupleResult.rows.length === 0) {
        return res.status(404).json({ error: 'Couple code not found' });
      }
    } else {
      // Create a new couple
      const coupleId = nanoid(10);
      finalCoupleCode = generateCoupleCode();
      await db.query(
        'INSERT INTO couples (id, code) VALUES ($1, $2)',
        [coupleId, finalCoupleCode]
      );
      isNewCouple = true;
    }

    // Create the session linked to the couple
    await db.query(
      'INSERT INTO sessions (id, partner_a_token, partner_b_token, couple_code) VALUES ($1, $2, $3, $4)',
      [sessionId, partnerAToken, partnerBToken, finalCoupleCode]
    );

    res.json({
      sessionId,
      partnerAToken,
      partnerBToken,
      coupleCode: finalCoupleCode,
      isNewCouple
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Get session status
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      'SELECT id, category, intake_type, unfaithful_partner, partner_a_name, partner_b_name, partner_a_completed, partner_b_completed, partner_a_token, partner_b_token, created_at FROM sessions WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = result.rows[0];
    res.json({
      id: session.id,
      category: session.category,
      intakeType: session.intake_type || 'long',
      unfaithfulPartner: session.unfaithful_partner,
      partnerAName: session.partner_a_name,
      partnerBName: session.partner_b_name,
      partnerACompleted: Boolean(session.partner_a_completed),
      partnerBCompleted: Boolean(session.partner_b_completed),
      partnerAToken: session.partner_a_token,
      partnerBToken: session.partner_b_token,
      createdAt: session.created_at
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Get session by token (for partner-specific access)
router.get('/:id/by-token/:token', async (req, res) => {
  const { id, token } = req.params;

  try {
    const result = await db.query(
      'SELECT id, category, intake_type, unfaithful_partner, partner_a_name, partner_b_name, partner_a_completed, partner_b_completed, partner_a_token, partner_b_token, couple_code FROM sessions WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = result.rows[0];

    // Determine which partner this token belongs to
    let partner = null;
    if (token === session.partner_a_token) {
      partner = 'A';
    } else if (token === session.partner_b_token) {
      partner = 'B';
    } else {
      return res.status(403).json({ error: 'Invalid token' });
    }

    res.json({
      id: session.id,
      partner,
      category: session.category,
      intakeType: session.intake_type || 'long',
      unfaithfulPartner: session.unfaithful_partner,
      partnerAName: session.partner_a_name,
      partnerBName: session.partner_b_name,
      partnerACompleted: Boolean(session.partner_a_completed),
      partnerBCompleted: Boolean(session.partner_b_completed),
      partnerBToken: partner === 'A' ? session.partner_b_token : null, // Only give B's token to A
      coupleCode: session.couple_code,
    });
  } catch (error) {
    console.error('Error fetching session by token:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Set category (called by Partner A)
router.patch('/:id/category', async (req, res) => {
  const { id } = req.params;
  const { category } = req.body;

  const validCategories = ['infidelity', 'communication', 'emotional_distance', 'life_stress', 'intimacy', 'strengthening'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({ error: 'Invalid category' });
  }

  try {
    const result = await db.query(
      'UPDATE sessions SET category = $1 WHERE id = $2 RETURNING *',
      [category, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error setting category:', error);
    res.status(500).json({ error: 'Failed to set category' });
  }
});

// Set unfaithful partner (called by Partner A)
router.patch('/:id/role', async (req, res) => {
  const { id } = req.params;
  const { unfaithfulPartner } = req.body;

  if (!['A', 'B'].includes(unfaithfulPartner)) {
    return res.status(400).json({ error: 'Invalid role (must be A or B)' });
  }

  try {
    const result = await db.query(
      'UPDATE sessions SET unfaithful_partner = $1 WHERE id = $2 RETURNING *',
      [unfaithfulPartner, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error setting role:', error);
    res.status(500).json({ error: 'Failed to set role' });
  }
});

// Set partner name
router.patch('/:id/name', async (req, res) => {
  const { id } = req.params;
  const { partner, name } = req.body;

  if (!['A', 'B'].includes(partner)) {
    return res.status(400).json({ error: 'Invalid partner (must be A or B)' });
  }

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const nameField = partner === 'A' ? 'partner_a_name' : 'partner_b_name';

  try {
    const result = await db.query(
      `UPDATE sessions SET ${nameField} = $1 WHERE id = $2 RETURNING *`,
      [name.trim(), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error setting name:', error);
    res.status(500).json({ error: 'Failed to set name' });
  }
});

// Set intake type
router.patch('/:id/intake-type', async (req, res) => {
  const { id } = req.params;
  const { intakeType } = req.body;

  if (!['short', 'long'].includes(intakeType)) {
    return res.status(400).json({ error: 'Invalid intake type (must be short or long)' });
  }

  try {
    const result = await db.query(
      'UPDATE sessions SET intake_type = $1 WHERE id = $2 RETURNING *',
      [intakeType, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error setting intake type:', error);
    res.status(500).json({ error: 'Failed to set intake type' });
  }
});

// Combined setup (for Partner A - sets name, category, intake type in one call)
router.patch('/:id/setup', async (req, res) => {
  const { id } = req.params;
  const { name, category, intakeType, unfaithfulPartner, aiModel } = req.body;

  const validCategories = ['infidelity', 'communication', 'emotional_distance', 'life_stress', 'intimacy', 'strengthening'];
  const validAiModels = ['openai', 'gemini'];

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Name is required' });
  }
  if (!validCategories.includes(category)) {
    return res.status(400).json({ error: 'Invalid category' });
  }
  if (!['short', 'long'].includes(intakeType)) {
    return res.status(400).json({ error: 'Invalid intake type' });
  }

  const selectedAiModel = validAiModels.includes(aiModel) ? aiModel : 'openai';

  try {
    let query = 'UPDATE sessions SET partner_a_name = $1, category = $2, intake_type = $3, ai_model = $4';
    let params = [name.trim(), category, intakeType, selectedAiModel];

    if (category === 'infidelity' && unfaithfulPartner) {
      query += ', unfaithful_partner = $5 WHERE id = $6 RETURNING *';
      params.push(unfaithfulPartner, id);
    } else {
      query += ' WHERE id = $5 RETURNING *';
      params.push(id);
    }

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error setting up session:', error);
    res.status(500).json({ error: 'Failed to set up session' });
  }
});

// Set partner PIN
router.patch('/:id/pin', async (req, res) => {
  const { id } = req.params;
  const { token, pin } = req.body;

  if (!pin || !/^\d{6}$/.test(pin)) {
    return res.status(400).json({ error: 'PIN must be 6 digits' });
  }

  try {
    // Get session and verify token
    const sessionResult = await db.query('SELECT * FROM sessions WHERE id = $1', [id]);
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

    const pinField = partner === 'A' ? 'partner_a_pin' : 'partner_b_pin';

    await db.query(
      `UPDATE sessions SET ${pinField} = $1 WHERE id = $2`,
      [pin, id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error setting PIN:', error);
    res.status(500).json({ error: 'Failed to set PIN' });
  }
});

// Verify partner PIN
router.post('/:id/verify-pin', async (req, res) => {
  const { id } = req.params;
  const { token, pin } = req.body;

  try {
    const sessionResult = await db.query('SELECT * FROM sessions WHERE id = $1', [id]);
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];
    let partner = null;
    let storedPin = null;

    if (token === session.partner_a_token) {
      partner = 'A';
      storedPin = session.partner_a_pin;
    } else if (token === session.partner_b_token) {
      partner = 'B';
      storedPin = session.partner_b_pin;
    } else {
      return res.status(403).json({ error: 'Invalid token' });
    }

    if (!storedPin) {
      // No PIN set yet - allow access (PIN will be set during questionnaire)
      return res.json({ verified: true, pinRequired: false });
    }

    if (pin === storedPin) {
      return res.json({ verified: true });
    } else {
      return res.status(401).json({ verified: false, error: 'Incorrect PIN' });
    }
  } catch (error) {
    console.error('Error verifying PIN:', error);
    res.status(500).json({ error: 'Failed to verify PIN' });
  }
});

export default router;
