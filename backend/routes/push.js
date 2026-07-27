const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || null });
});

router.post('/subscribe', (req, res) => {
  const { subscription } = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'A valid push subscription is required.' });
  }

  const existing = db
    .prepare('SELECT id FROM push_subscriptions WHERE endpoint = ?')
    .get(subscription.endpoint);

  if (existing) {
    db.prepare(
      'UPDATE push_subscriptions SET user_id = ?, subscription_json = ? WHERE endpoint = ?'
    ).run(req.userId, JSON.stringify(subscription), subscription.endpoint);
  } else {
    db.prepare(
      'INSERT INTO push_subscriptions (user_id, endpoint, subscription_json) VALUES (?, ?, ?)'
    ).run(req.userId, subscription.endpoint, JSON.stringify(subscription));
  }

  res.status(201).json({ ok: true });
});

router.post('/unsubscribe', (req, res) => {
  const { endpoint } = req.body;
  if (endpoint) {
    db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ? AND user_id = ?').run(
      endpoint,
      req.userId
    );
  }
  res.json({ ok: true });
});

module.exports = router;
