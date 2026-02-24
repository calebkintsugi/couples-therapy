import { Router } from 'express';
import { nanoid } from 'nanoid';
import db from '../db.js';

const router = Router();

// Create a new session
router.post('/', async (req, res) => {
  const sessionId = nanoid(10);

  try {
    await db.query('INSERT INTO sessions (id) VALUES ($1)', [sessionId]);
    res.json({ sessionId });
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
      'SELECT id, unfaithful_partner, partner_a_name, partner_b_name, partner_a_completed, partner_b_completed, created_at FROM sessions WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = result.rows[0];
    res.json({
      id: session.id,
      unfaithfulPartner: session.unfaithful_partner,
      partnerAName: session.partner_a_name,
      partnerBName: session.partner_b_name,
      partnerACompleted: Boolean(session.partner_a_completed),
      partnerBCompleted: Boolean(session.partner_b_completed),
      createdAt: session.created_at
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
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

export default router;
