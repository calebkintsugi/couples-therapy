import { Router } from 'express';
import db from '../db.js';

const router = Router();

const ADMIN_PASSWORD = 'Islington8*';

// Middleware to check admin password
const requireAdminAuth = (req, res, next) => {
  const password = req.headers['x-admin-password'];
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Validate and redeem a promo code
router.post('/validate', async (req, res) => {
  const { code, coupleCode } = req.body;

  if (!code || !coupleCode) {
    return res.status(400).json({ error: 'Code and couple code are required' });
  }

  try {
    // Check if promo code exists and is valid
    const promoResult = await db.query(
      `SELECT * FROM promo_codes
       WHERE UPPER(code) = UPPER($1)
       AND is_active = TRUE
       AND (expires_at IS NULL OR expires_at > NOW())`,
      [code]
    );

    if (promoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid or expired promo code' });
    }

    const promo = promoResult.rows[0];

    // Check if max uses reached
    if (promo.max_uses && promo.uses_count >= promo.max_uses) {
      return res.status(400).json({ error: 'This promo code has reached its maximum uses' });
    }

    // Check if this couple already used this code
    const existingRedemption = await db.query(
      'SELECT * FROM promo_redemptions WHERE promo_code_id = $1 AND couple_code = $2',
      [promo.id, coupleCode.toUpperCase()]
    );

    if (existingRedemption.rows.length > 0) {
      return res.status(400).json({ error: 'You have already used this promo code' });
    }

    // Check if couple exists, create if not
    const coupleResult = await db.query(
      'SELECT * FROM couples WHERE code = $1',
      [coupleCode.toUpperCase()]
    );

    if (coupleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Couple not found. Please start a session first.' });
    }

    // Redeem the code
    await db.query(
      'INSERT INTO promo_redemptions (promo_code_id, couple_code) VALUES ($1, $2)',
      [promo.id, coupleCode.toUpperCase()]
    );

    // Increment uses count
    await db.query(
      'UPDATE promo_codes SET uses_count = uses_count + 1 WHERE id = $1',
      [promo.id]
    );

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + promo.free_months);

    res.json({
      success: true,
      freeMonths: promo.free_months,
      expiresAt: expiresAt,
      message: `Success! You have ${promo.free_months} months of free access.`
    });
  } catch (error) {
    console.error('Error validating promo code:', error);
    res.status(500).json({ error: 'Failed to validate promo code' });
  }
});

// Check if a promo code is valid (without redeeming)
router.get('/check/:code', async (req, res) => {
  const { code } = req.params;

  try {
    const promoResult = await db.query(
      `SELECT code, free_months, max_uses, uses_count
       FROM promo_codes
       WHERE UPPER(code) = UPPER($1)
       AND is_active = TRUE
       AND (expires_at IS NULL OR expires_at > NOW())`,
      [code]
    );

    if (promoResult.rows.length === 0) {
      return res.status(404).json({ valid: false, error: 'Invalid or expired promo code' });
    }

    const promo = promoResult.rows[0];

    if (promo.max_uses && promo.uses_count >= promo.max_uses) {
      return res.json({ valid: false, error: 'This promo code has reached its maximum uses' });
    }

    res.json({
      valid: true,
      freeMonths: promo.free_months,
      usesRemaining: promo.max_uses ? promo.max_uses - promo.uses_count : 'unlimited'
    });
  } catch (error) {
    console.error('Error checking promo code:', error);
    res.status(500).json({ error: 'Failed to check promo code' });
  }
});

// ============ ADMIN ROUTES ============

// Get all promo codes with stats
router.get('/admin/list', requireAdminAuth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        pc.*,
        COUNT(pr.id) as redemption_count,
        MAX(pr.redeemed_at) as last_redeemed
      FROM promo_codes pc
      LEFT JOIN promo_redemptions pr ON pc.id = pr.promo_code_id
      GROUP BY pc.id
      ORDER BY pc.created_at DESC
    `);

    res.json({ promoCodes: result.rows });
  } catch (error) {
    console.error('Error fetching promo codes:', error);
    res.status(500).json({ error: 'Failed to fetch promo codes' });
  }
});

// Get detailed stats for a specific promo code
router.get('/admin/stats/:codeId', requireAdminAuth, async (req, res) => {
  const { codeId } = req.params;

  try {
    const codeResult = await db.query('SELECT * FROM promo_codes WHERE id = $1', [codeId]);

    if (codeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Promo code not found' });
    }

    const redemptionsResult = await db.query(
      `SELECT pr.*, c.partner_a_name, c.partner_b_name
       FROM promo_redemptions pr
       LEFT JOIN couples c ON pr.couple_code = c.code
       WHERE pr.promo_code_id = $1
       ORDER BY pr.redeemed_at DESC`,
      [codeId]
    );

    res.json({
      promoCode: codeResult.rows[0],
      redemptions: redemptionsResult.rows
    });
  } catch (error) {
    console.error('Error fetching promo code stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Create a new promo code
router.post('/admin/create', requireAdminAuth, async (req, res) => {
  const { code, freeMonths, maxUses, expiresAt } = req.body;

  if (!code || !freeMonths) {
    return res.status(400).json({ error: 'Code and freeMonths are required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO promo_codes (code, free_months, max_uses, expires_at)
       VALUES (UPPER($1), $2, $3, $4)
       RETURNING *`,
      [code, freeMonths, maxUses || null, expiresAt || null]
    );

    res.json({ promoCode: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'A promo code with this name already exists' });
    }
    console.error('Error creating promo code:', error);
    res.status(500).json({ error: 'Failed to create promo code' });
  }
});

// Update a promo code
router.put('/admin/:codeId', requireAdminAuth, async (req, res) => {
  const { codeId } = req.params;
  const { maxUses, expiresAt, isActive } = req.body;

  try {
    const result = await db.query(
      `UPDATE promo_codes
       SET max_uses = COALESCE($1, max_uses),
           expires_at = COALESCE($2, expires_at),
           is_active = COALESCE($3, is_active)
       WHERE id = $4
       RETURNING *`,
      [maxUses, expiresAt, isActive, codeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Promo code not found' });
    }

    res.json({ promoCode: result.rows[0] });
  } catch (error) {
    console.error('Error updating promo code:', error);
    res.status(500).json({ error: 'Failed to update promo code' });
  }
});

// Delete a promo code
router.delete('/admin/:codeId', requireAdminAuth, async (req, res) => {
  const { codeId } = req.params;

  try {
    // First delete redemptions
    await db.query('DELETE FROM promo_redemptions WHERE promo_code_id = $1', [codeId]);

    // Then delete the code
    const result = await db.query('DELETE FROM promo_codes WHERE id = $1 RETURNING *', [codeId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Promo code not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting promo code:', error);
    res.status(500).json({ error: 'Failed to delete promo code' });
  }
});

export default router;
