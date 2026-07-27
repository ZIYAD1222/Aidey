const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const ALLOWED_CATEGORIES = ['work', 'health', 'sports', 'shopping', 'personal'];
const ALLOWED_RECURRENCE = ['none', 'daily', 'weekly', 'monthly'];
const DAY_INDEX = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

function computeNextDueDate(dueAtIso, recurrence, recurrenceDays) {
  const d = new Date(dueAtIso);

  if (recurrence === 'monthly') {
    d.setMonth(d.getMonth() + 1);
    return d.toISOString();
  }

  if (recurrence === 'daily') {
    d.setDate(d.getDate() + 1);
    return d.toISOString();
  }

  if (recurrence === 'weekly') {
    const days = (recurrenceDays || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => DAY_INDEX[s])
      .filter((n) => n !== undefined);

    if (days.length === 0) {
      d.setDate(d.getDate() + 7);
      return d.toISOString();
    }

    // Find the next selected weekday strictly after the current due date.
    for (let add = 1; add <= 7; add++) {
      const candidate = new Date(d);
      candidate.setDate(candidate.getDate() + add);
      if (days.includes(candidate.getDay())) {
        return candidate.toISOString();
      }
    }
    d.setDate(d.getDate() + 7);
    return d.toISOString();
  }

  return null;
}

router.get('/', (req, res) => {
  const tasks = db
    .prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY position ASC, due_at ASC')
    .all(req.userId);
  res.json({ tasks });
});

router.patch('/reorder', (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order)) {
    return res.status(400).json({ error: 'order must be an array of task ids.' });
  }
  const update = db.prepare('UPDATE tasks SET position = ? WHERE id = ? AND user_id = ?');
  order.forEach((id, index) => update.run(index, id, req.userId));
  res.json({ ok: true });
});

router.post('/', (req, res) => {
  const {
    title,
    category = 'personal',
    due_at,
    remind_minutes_before = 30,
    notes = '',
    recurrence = 'none',
    recurrence_days = '',
  } = req.body;

  if (!title || !due_at) {
    return res.status(400).json({ error: 'A task needs a title and a due time.' });
  }
  const safeCategory = ALLOWED_CATEGORIES.includes(category) ? category : 'personal';
  const safeRecurrence = ALLOWED_RECURRENCE.includes(recurrence) ? recurrence : 'none';

  const { maxPos } = db
    .prepare('SELECT COALESCE(MAX(position), -1) AS maxPos FROM tasks WHERE user_id = ?')
    .get(req.userId);

  const result = db
    .prepare(
      `INSERT INTO tasks (user_id, title, category, due_at, remind_minutes_before, notes, recurrence, recurrence_days, position)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      req.userId,
      title,
      safeCategory,
      due_at,
      remind_minutes_before,
      notes,
      safeRecurrence,
      recurrence_days,
      maxPos + 1
    );

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ task });
});

router.patch('/:id', (req, res) => {
  const task = db
    .prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.userId);
  if (!task) return res.status(404).json({ error: "That task doesn't exist." });

  const fields = [
    'title',
    'category',
    'due_at',
    'remind_minutes_before',
    'completed',
    'notes',
    'recurrence',
    'recurrence_days',
  ];
  const updates = {};
  for (const field of fields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }
  if (updates.category && !ALLOWED_CATEGORIES.includes(updates.category)) {
    delete updates.category;
  }
  if (updates.recurrence && !ALLOWED_RECURRENCE.includes(updates.recurrence)) {
    delete updates.recurrence;
  }
  if (updates.due_at !== undefined || updates.remind_minutes_before !== undefined) {
    updates.reminder_sent = 0;
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

  // If a recurring task was just marked complete, schedule the next occurrence.
  const justCompleted = Number(updates.completed) === 1 && !task.completed;
  const recurrence = updates.recurrence || task.recurrence;
  const recurrenceDays = updates.recurrence_days ?? task.recurrence_days;
  if (justCompleted && recurrence && recurrence !== 'none') {
    const nextDue = computeNextDueDate(updates.due_at || task.due_at, recurrence, recurrenceDays);
    if (nextDue) {
      db.prepare(
        `INSERT INTO tasks (user_id, title, category, due_at, remind_minutes_before, notes, recurrence, recurrence_days)
         VALUES (@user_id, @title, @category, @due_at, @remind_minutes_before, @notes, @recurrence, @recurrence_days)`
      ).run({
        user_id: task.user_id,
        title: updates.title || task.title,
        category: updates.category || task.category,
        due_at: nextDue,
        remind_minutes_before: updates.remind_minutes_before ?? task.remind_minutes_before,
        notes: updates.notes ?? task.notes,
        recurrence,
        recurrence_days: recurrenceDays || '',
      });
    }
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
