import { Router } from 'express';
import db from '../db.js';

const router = Router();

// Track an event
router.post('/track', async (req, res) => {
  const { eventType, eventName, page, metadata } = req.body;

  if (!eventType || !eventName) {
    return res.status(400).json({ error: 'eventType and eventName are required' });
  }

  try {
    await db.query(
      `INSERT INTO analytics (event_type, event_name, page, metadata)
       VALUES ($1, $2, $3, $4)`,
      [eventType, eventName, page || null, metadata ? JSON.stringify(metadata) : null]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking event:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

// Get analytics summary (protected - you might want to add auth)
router.get('/summary', async (req, res) => {
  try {
    // Page visits
    const pageVisits = await db.query(`
      SELECT page, COUNT(*) as count
      FROM analytics
      WHERE event_type = 'page_view'
      GROUP BY page
      ORDER BY count DESC
    `);

    // Button clicks
    const buttonClicks = await db.query(`
      SELECT event_name, page, COUNT(*) as count
      FROM analytics
      WHERE event_type = 'button_click'
      GROUP BY event_name, page
      ORDER BY count DESC
    `);

    // Total visits today
    const todayVisits = await db.query(`
      SELECT COUNT(*) as count
      FROM analytics
      WHERE event_type = 'page_view'
      AND created_at >= CURRENT_DATE
    `);

    // Total visits all time
    const totalVisits = await db.query(`
      SELECT COUNT(*) as count
      FROM analytics
      WHERE event_type = 'page_view'
    `);

    // Recent events
    const recentEvents = await db.query(`
      SELECT event_type, event_name, page, created_at
      FROM analytics
      ORDER BY created_at DESC
      LIMIT 50
    `);

    // Category selections
    const categorySelections = await db.query(`
      SELECT metadata->>'category' as category, COUNT(*) as count
      FROM analytics
      WHERE event_name = 'category_selected'
      AND metadata->>'category' IS NOT NULL
      GROUP BY metadata->>'category'
      ORDER BY count DESC
    `);

    res.json({
      pageVisits: pageVisits.rows,
      buttonClicks: buttonClicks.rows,
      categorySelections: categorySelections.rows,
      todayVisits: parseInt(todayVisits.rows[0]?.count || 0),
      totalVisits: parseInt(totalVisits.rows[0]?.count || 0),
      recentEvents: recentEvents.rows,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
