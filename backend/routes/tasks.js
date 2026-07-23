const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const ALLOWED_CATEGORIES = ['work', 'health', 'sports', 'personal'];

router.get('/', (req, res) => {
  const tasks = db
    .prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY due_at ASC')
    .all(req.userId);
  res.json({ tasks });
});

router.post('/', (req, res) => {
  const { title, category = 'personal', due_at, remind_minutes_before = 30 } = req.body;

  if (!title || !due_at) {
    return res.status(400).json({ error: 'A task needs a title and a due time.' });
  }
  const safeCategory = ALLOWED_CATEGORIES.includes(category) ? category : 'personal';

  const result = db
    .prepare(
      `INSERT INTO tasks (user_id, title, category, due_at, remind_minutes_before)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(req.userId, title, safeCategory, due_at, remind_minutes_before);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ task });
});

router.patch('/:id', (req, res) => {
  const task = db
    .prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.userId);
  if (!task) return res.status(404).json({ error: "That task doesn't exist." });

  const fields = ['title', 'category', 'due_at', 'remind_minutes_before', 'completed'];
  const updates = {};
  for (const field of fields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const setClause = Object.keys(updates)
    .map((key) => `${key} = @${key}`)
    .join(', ');

  if (setClause) {
    db.prepare(`UPDATE tasks SET ${setClause} WHERE id = @id`).run({
      ...updates,
      id: task.id,
    });
  }

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id);
  res.json({ task: updated });
});

router.delete('/:id', (req, res) => {
  const result = db
    .prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ error: "That task doesn't exist." });
  res.status(204).end();
});

module.exports = router;
