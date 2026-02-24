import { Router } from 'express';
import { nanoid } from 'nanoid';
import db from '../db.js';

const router = Router();

// Create a new session
router.post('/', (req, res) => {
  const sessionId = nanoid(10);

  try {
    db.prepare('INSERT INTO sessions (id) VALUES (?)').run(sessionId);
    res.json({ sessionId });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Get session status
router.get('/:id', (req, res) => {
  const { id } = req.params;

  try {
    const session = db.prepare(`
      SELECT id, partner_a_completed, partner_b_completed, created_at
      FROM sessions
      WHERE id = ?
    `).get(id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

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
