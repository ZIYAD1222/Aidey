require('dotenv').config();
const express = require('express');
const cors = require('cors');
const webpush = require('web-push');
const db = require('./db');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const aiRoutes = require('./routes/ai');
const pushRoutes = require('./routes/push');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/push', pushRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

const hasVapidKeys = process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY;
if (hasVapidKeys) {
  webpush.setVapidDetails(
    'mailto:no-reply@aidey.app',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.log(
    'Web push disabled: run "npm run generate-vapid" in backend/ and add the keys to .env to enable it.'
  );
}

// Every 30 seconds, look for tasks whose reminder time has arrived and push a
// notification to every device the task's owner has subscribed from.
function checkReminders() {
  if (!hasVapidKeys) return;

  const now = Date.now();
  const dueTasks = db
    .prepare(
      `SELECT * FROM tasks
       WHERE completed = 0 AND reminder_sent = 0`
    )
    .all();

  for (const task of dueTasks) {
    const dueTime = new Date(task.due_at).getTime();
    const remindAt = dueTime - task.remind_minutes_before * 60 * 1000;
    if (now < remindAt || now >= dueTime) continue;

    const subs = db
      .prepare('SELECT * FROM push_subscriptions WHERE user_id = ?')
      .all(task.user_id);

    const payload = JSON.stringify({
      title: 'Aidey',
      body: `${task.title} — ${new Date(task.due_at).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      })}`,
    });

    for (const sub of subs) {
      const subscription = JSON.parse(sub.subscription_json);
      webpush.sendNotification(subscription, payload).catch((err) => {
        if (err.statusCode === 404 || err.statusCode === 410) {
          db.prepare('DELETE FROM push_subscriptions WHERE id = ?').run(sub.id);
        }
      });
    }

    db.prepare('UPDATE tasks SET reminder_sent = 1 WHERE id = ?').run(task.id);
  }
}

setInterval(checkReminders, 30000);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
