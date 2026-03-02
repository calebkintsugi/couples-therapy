import { Router } from 'express';
import { nanoid } from 'nanoid';
import db from '../db.js';

const router = Router();

// Create a new session
router.post('/', async (req, res) => {
  const sessionId = nanoid(10);
  const partnerAToken = nanoid(8);
  const partnerBToken = nanoid(8);

  try {
    await db.query(
      'INSERT INTO sessions (id, partner_a_token, partner_b_token) VALUES ($1, $2, $3)',
      [sessionId, partnerAToken, partnerBToken]
    );
    res.json({ sessionId, partnerAToken, partnerBToken });
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
      'SELECT id, category, intake_type, unfaithful_partner, partner_a_name, partner_b_name, partner_a_completed, partner_b_completed, partner_a_token, partner_b_token FROM sessions WHERE id = $1',
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
  const { name, category, intakeType, unfaithfulPartner } = req.body;

  const validCategories = ['infidelity', 'communication', 'emotional_distance', 'life_stress', 'intimacy', 'strengthening'];

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Name is required' });
  }
  if (!validCategories.includes(category)) {
    return res.status(400).json({ error: 'Invalid category' });
  }
  if (!['short', 'long'].includes(intakeType)) {
    return res.status(400).json({ error: 'Invalid intake type' });
  }

  try {
    let query = 'UPDATE sessions SET partner_a_name = $1, category = $2, intake_type = $3';
    let params = [name.trim(), category, intakeType];

    if (category === 'infidelity' && unfaithfulPartner) {
      query += ', unfaithful_partner = $4 WHERE id = $5 RETURNING *';
      params.push(unfaithfulPartner, id);
    } else {
      query += ' WHERE id = $4 RETURNING *';
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

export default router;
