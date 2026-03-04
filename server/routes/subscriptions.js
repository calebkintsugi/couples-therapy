import { Router } from 'express';
import Stripe from 'stripe';
import db from '../db.js';

const router = Router();

// Initialize Stripe (will be null if key not set)
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const MONTHLY_PRICE = 495; // $4.95 in cents
const PRICE_DISPLAY = '$4.95';

// Check subscription status for a couple
router.get('/status/:coupleCode', async (req, res) => {
  const { coupleCode } = req.params;

  try {
    // Check for active subscription
    const subResult = await db.query(
      `SELECT * FROM subscriptions
       WHERE couple_code = $1
       AND status = 'active'
       AND current_period_end > NOW()
       ORDER BY current_period_end DESC
       LIMIT 1`,
      [coupleCode.toUpperCase()]
    );

    if (subResult.rows.length > 0) {
      const sub = subResult.rows[0];
      return res.json({
        active: true,
        expiresAt: sub.current_period_end,
        status: sub.status
      });
    }

    // Check for active promo redemption
    const promoResult = await db.query(
      `SELECT pr.redeemed_at, pc.free_months
       FROM promo_redemptions pr
       JOIN promo_codes pc ON pr.promo_code_id = pc.id
       WHERE pr.couple_code = $1
       ORDER BY pr.redeemed_at DESC
       LIMIT 1`,
      [coupleCode.toUpperCase()]
    );

    if (promoResult.rows.length > 0) {
      const promo = promoResult.rows[0];
      const expiresAt = new Date(promo.redeemed_at);
      expiresAt.setMonth(expiresAt.getMonth() + promo.free_months);

      if (expiresAt > new Date()) {
        return res.json({
          active: true,
          expiresAt: expiresAt,
          status: 'promo',
          promoMonths: promo.free_months
        });
      }
    }

    res.json({ active: false });
  } catch (error) {
    console.error('Error checking subscription:', error);
    res.status(500).json({ error: 'Failed to check subscription status' });
  }
});

// Create checkout session for subscription
router.post('/create-checkout', async (req, res) => {
  const { coupleCode, returnUrl } = req.body;

  if (!stripe) {
    return res.status(500).json({ error: 'Payment system not configured' });
  }

  if (!coupleCode) {
    return res.status(400).json({ error: 'Couple code is required' });
  }

  try {
    // Check if couple exists
    const coupleResult = await db.query(
      'SELECT * FROM couples WHERE code = $1',
      [coupleCode.toUpperCase()]
    );

    if (coupleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Couple not found' });
    }

    // Check for existing active subscription
    const existingSub = await db.query(
      `SELECT * FROM subscriptions
       WHERE couple_code = $1
       AND status = 'active'
       AND current_period_end > NOW()`,
      [coupleCode.toUpperCase()]
    );

    if (existingSub.rows.length > 0) {
      return res.status(400).json({ error: 'Already have an active subscription' });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'RepairCoach Subscription',
              description: 'Unlimited access to relationship coaching for you and your partner',
            },
            unit_amount: MONTHLY_PRICE,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        coupleCode: coupleCode.toUpperCase(),
      },
      success_url: `${returnUrl}?success=true&couple_code=${coupleCode.toUpperCase()}`,
      cancel_url: `${returnUrl}?canceled=true`,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe webhook handler
router.post('/webhook', async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: 'Payment system not configured' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // For testing without webhook signature verification
      event = req.body;
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const coupleCode = session.metadata?.coupleCode;

      if (coupleCode && session.subscription) {
        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(session.subscription);

        await db.query(
          `INSERT INTO subscriptions (couple_code, stripe_customer_id, stripe_subscription_id, status, current_period_start, current_period_end)
           VALUES ($1, $2, $3, $4, to_timestamp($5), to_timestamp($6))
           ON CONFLICT (couple_code) DO UPDATE SET
             stripe_customer_id = $2,
             stripe_subscription_id = $3,
             status = $4,
             current_period_start = to_timestamp($5),
             current_period_end = to_timestamp($6),
             updated_at = NOW()`,
          [
            coupleCode,
            session.customer,
            session.subscription,
            subscription.status,
            subscription.current_period_start,
            subscription.current_period_end,
          ]
        );
      }
      break;
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;

      await db.query(
        `UPDATE subscriptions
         SET status = $1,
             current_period_start = to_timestamp($2),
             current_period_end = to_timestamp($3),
             updated_at = NOW()
         WHERE stripe_subscription_id = $4`,
        [
          subscription.status,
          subscription.current_period_start,
          subscription.current_period_end,
          subscription.id,
        ]
      );
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);

        await db.query(
          `UPDATE subscriptions
           SET status = $1,
               current_period_start = to_timestamp($2),
               current_period_end = to_timestamp($3),
               updated_at = NOW()
           WHERE stripe_subscription_id = $4`,
          [
            subscription.status,
            subscription.current_period_start,
            subscription.current_period_end,
            subscription.id,
          ]
        );
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      if (invoice.subscription) {
        await db.query(
          `UPDATE subscriptions SET status = 'past_due', updated_at = NOW() WHERE stripe_subscription_id = $1`,
          [invoice.subscription]
        );
      }
      break;
    }
  }

  res.json({ received: true });
});

// Cancel subscription
router.post('/cancel/:coupleCode', async (req, res) => {
  const { coupleCode } = req.params;

  if (!stripe) {
    return res.status(500).json({ error: 'Payment system not configured' });
  }

  try {
    const subResult = await db.query(
      'SELECT stripe_subscription_id FROM subscriptions WHERE couple_code = $1 AND status = $2',
      [coupleCode.toUpperCase(), 'active']
    );

    if (subResult.rows.length === 0) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Cancel at period end (don't immediately revoke access)
    await stripe.subscriptions.update(subResult.rows[0].stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    res.json({ success: true, message: 'Subscription will cancel at end of billing period' });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

export default router;
