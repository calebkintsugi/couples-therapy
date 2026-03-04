import { Router } from 'express';
import { nanoid } from 'nanoid';
import crypto from 'crypto';
import db from '../db.js';
import { sendMagicLink } from '../email.js';

const router = Router();

// How long magic links are valid (15 minutes)
const MAGIC_LINK_EXPIRY_MS = 15 * 60 * 1000;

// Create account without requiring email verification (for frictionless signup)
router.post('/create-account', async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Find or create user
    let userResult = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [normalizedEmail]
    );

    let userId;
    if (userResult.rows.length === 0) {
      userId = nanoid();
      await db.query(
        'INSERT INTO users (id, email) VALUES ($1, $2)',
        [userId, normalizedEmail]
      );
    } else {
      userId = userResult.rows[0].id;
    }

    res.json({ success: true, userId, email: normalizedEmail });
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Send magic link to email
router.post('/send-link', async (req, res) => {
  const { email, coupleCode, partner } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Find or create user
    let userResult = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [normalizedEmail]
    );

    let userId;
    if (userResult.rows.length === 0) {
      userId = nanoid();
      await db.query(
        'INSERT INTO users (id, email) VALUES ($1, $2)',
        [userId, normalizedEmail]
      );
    } else {
      userId = userResult.rows[0].id;
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const linkId = nanoid();
    const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MS);

    // Invalidate any existing unused links for this user
    await db.query(
      'UPDATE magic_links SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
      [userId]
    );

    // Create new magic link
    await db.query(
      'INSERT INTO magic_links (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)',
      [linkId, userId, token, expiresAt]
    );

    // If coupleCode provided, pre-link it to the user (will be confirmed on verify)
    if (coupleCode) {
      await db.query(
        `INSERT INTO user_couples (user_id, couple_code, partner)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, couple_code) DO UPDATE SET partner = $3`,
        [userId, coupleCode.toUpperCase(), partner || null]
      );
    }

    // Send email
    const baseUrl = process.env.BASE_URL || 'https://repaircoach.ai';
    // Include coupleCode in URL so after verify we can redirect appropriately
    let magicLinkUrl = `${baseUrl}/auth/verify?token=${token}`;
    if (coupleCode) {
      magicLinkUrl += `&linked=${coupleCode.toUpperCase()}`;
    }

    await sendMagicLink({ email: normalizedEmail, magicLinkUrl });

    res.json({ success: true, message: 'Magic link sent to your email', userId });
  } catch (error) {
    console.error('Error sending magic link:', error);
    res.status(500).json({ error: 'Failed to send magic link' });
  }
});

// Verify magic link and create session
router.post('/verify', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    // Find valid magic link
    const linkResult = await db.query(
      `SELECT ml.*, u.email, u.id as user_id
       FROM magic_links ml
       JOIN users u ON ml.user_id = u.id
       WHERE ml.token = $1
       AND ml.used_at IS NULL
       AND ml.expires_at > NOW()`,
      [token]
    );

    if (linkResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired link' });
    }

    const link = linkResult.rows[0];

    // Mark link as used
    await db.query(
      'UPDATE magic_links SET used_at = NOW() WHERE id = $1',
      [link.id]
    );

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex');

    // Get user's linked couples
    const couplesResult = await db.query(
      `SELECT uc.couple_code, uc.partner, c.partner_a_name, c.partner_b_name
       FROM user_couples uc
       LEFT JOIN couples c ON uc.couple_code = c.code
       WHERE uc.user_id = $1`,
      [link.user_id]
    );

    res.json({
      success: true,
      sessionToken,
      userId: link.user_id,
      email: link.email,
      couples: couplesResult.rows
    });
  } catch (error) {
    console.error('Error verifying magic link:', error);
    res.status(500).json({ error: 'Failed to verify link' });
  }
});

// Get current user info (for checking auth state)
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  const userId = req.headers['x-user-id'];

  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const userResult = await db.query(
      'SELECT id, email, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get user's linked couples with subscription status
    const couplesResult = await db.query(
      `SELECT uc.couple_code, uc.partner, c.partner_a_name, c.partner_b_name,
              s.status as subscription_status, s.current_period_end
       FROM user_couples uc
       LEFT JOIN couples c ON uc.couple_code = c.code
       LEFT JOIN subscriptions s ON uc.couple_code = s.couple_code
       WHERE uc.user_id = $1`,
      [userId]
    );

    res.json({
      id: user.id,
      email: user.email,
      createdAt: user.created_at,
      couples: couplesResult.rows
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// Link a couple code to current user
router.post('/link-couple', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { coupleCode, partner } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (!coupleCode) {
    return res.status(400).json({ error: 'Couple code is required' });
  }

  try {
    // Verify couple exists
    const coupleResult = await db.query(
      'SELECT * FROM couples WHERE code = $1',
      [coupleCode.toUpperCase()]
    );

    if (coupleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Couple code not found' });
    }

    // Link user to couple
    await db.query(
      `INSERT INTO user_couples (user_id, couple_code, partner)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, couple_code) DO UPDATE SET partner = $3`,
      [userId, coupleCode.toUpperCase(), partner || null]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error linking couple:', error);
    res.status(500).json({ error: 'Failed to link couple code' });
  }
});

export default router;
