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
      'SELECT id, partner_a_completed, partner_b_completed, created_at FROM sessions WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = result.rows[0];
    res.json({
      id: session.id,
      partnerACompleted: Boolean(session.partner_a_completed),
      partnerBCompleted: Boolean(session.partner_b_completed),
      createdAt: session.created_at
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

export default router;
