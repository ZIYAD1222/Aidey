const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

router.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Enter a name, email, and password.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password needs at least 8 characters.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: "That email's already registered. Sign in instead." });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
    .run(name, email.toLowerCase(), passwordHash);

  const token = signToken(result.lastInsertRowid);
  res.status(201).json({
    token,
    user: { id: result.lastInsertRowid, name, email: email.toLowerCase() },
  });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Enter your email and password.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Email or password doesn't match." });
  }

  const token = signToken(user.id);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'Account not found.' });
  res.json({ user });
});

module.exports = router;
