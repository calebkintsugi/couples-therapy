import { Router } from 'express';
import { nanoid } from 'nanoid';
import db from '../db.js';

const router = Router();

// Generate a readable couple code (6 chars, uppercase alphanumeric)
function generateCoupleCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like 0, O, 1, I
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create a new couple
router.post('/', async (req, res) => {
  const id = nanoid(10);
  const code = generateCoupleCode();

  try {
    await db.query(
      'INSERT INTO couples (id, code) VALUES ($1, $2)',
      [id, code]
    );
    res.json({ id, code });
  } catch (error) {
    console.error('Error creating couple:', error);
    res.status(500).json({ error: 'Failed to create couple' });
  }
});

// Get couple by code
router.get('/by-code/:code', async (req, res) => {
  const { code } = req.params;

  try {
    const result = await db.query(
      'SELECT * FROM couples WHERE code = $1',
      [code.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Couple not found' });
    }

    const couple = result.rows[0];

    // Get all sessions for this couple
    const sessionsResult = await db.query(
      `SELECT id, category, created_at, partner_a_completed, partner_b_completed,
              partner_a_name, partner_b_name, partner_a_token, partner_b_token
       FROM sessions
       WHERE couple_code = $1
       ORDER BY created_at DESC`,
      [code.toUpperCase()]
    );

    res.json({
      id: couple.id,
      code: couple.code,
      partnerAName: couple.partner_a_name,
      partnerBName: couple.partner_b_name,
      createdAt: couple.created_at,
      sessions: sessionsResult.rows.map(s => ({
        id: s.id,
        category: s.category,
        createdAt: s.created_at,
        partnerACompleted: Boolean(s.partner_a_completed),
        partnerBCompleted: Boolean(s.partner_b_completed),
        partnerAName: s.partner_a_name,
        partnerBName: s.partner_b_name,
        partnerAToken: s.partner_a_token,
        partnerBToken: s.partner_b_token,
      }))
    });
  } catch (error) {
    console.error('Error fetching couple:', error);
    res.status(500).json({ error: 'Failed to fetch couple' });
  }
});

// Update couple names
router.patch('/:code', async (req, res) => {
  const { code } = req.params;
  const { partnerAName, partnerBName } = req.body;

  try {
    const result = await db.query(
      'UPDATE couples SET partner_a_name = COALESCE($1, partner_a_name), partner_b_name = COALESCE($2, partner_b_name) WHERE code = $3 RETURNING *',
      [partnerAName, partnerBName, code.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Couple not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating couple:', error);
    res.status(500).json({ error: 'Failed to update couple' });
  }
});

export default router;
