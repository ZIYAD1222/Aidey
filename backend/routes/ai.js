const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function hasRealApiKey() {
  const key = process.env.ANTHROPIC_API_KEY;
  return key && key !== 'your-anthropic-api-key-here' && key.startsWith('sk-ant-');
}

// Very simple fallback parser used when no Anthropic API key is configured,
// so the rest of the app (auth, tasks, UI) can still be tried out for free.
function fallbackParseTask(message) {
  const inHour = message.match(/(?:in|بعد)\s*(\d+)\s*(?:hour|hr|ساعة|ساعه)/i);
  const dueAt = new Date();
  if (inHour) {
    dueAt.setHours(dueAt.getHours() + parseInt(inHour[1], 10));
  } else {
    dueAt.setHours(dueAt.getHours() + 1);
  }

  let category = 'personal';
  if (/work|meeting|call|عمل|اجتماع|شغل/i.test(message)) category = 'work';
  if (/doctor|dentist|clinic|طبيب|دكتور|أسنان|عيادة/i.test(message)) category = 'health';
  if (/gym|workout|run|sport|game|match|رياضة|جيم|تمرين|كرة|جري/i.test(message)) category = 'sports';

  return {
    title: message.slice(0, 60),
    category,
    due_at: dueAt.toISOString(),
    remind_minutes_before: 30,
  };
}

function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON found in model response.');
  return JSON.parse(match[0]);
}

// Turn a natural-language sentence into a structured task the user can confirm.
router.post('/parse-task', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Type a task to schedule.' });

  if (!hasRealApiKey()) {
    return res.json({ task: fallbackParseTask(message), aiEnabled: false });
  }

  const now = new Date().toISOString();

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: `You turn a short natural-language request into a task. Current time is ${now}.
Reply with ONLY a JSON object, no other text, in this exact shape:
{"title": string, "category": "work" | "health" | "sports" | "personal", "due_at": ISO 8601 datetime string, "remind_minutes_before": integer}
If no time is given, pick a sensible time later today. If unclear, make your best reasonable guess rather than asking a question.`,
      messages: [{ role: 'user', content: message }],
    });

    const text = response.content.find((block) => block.type === 'text')?.text || '';
    const parsed = extractJson(text);
    res.json({ task: parsed });
  } catch (err) {
    res.status(502).json({ error: "Couldn't reach the assistant. Try again." });
  }
});

// Look at today's schedule and surface one short, useful insight.
router.get('/insight', async (req, res) => {
  if (!hasRealApiKey()) {
    return res.json({ insight: null });
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const tasks = db
    .prepare(
      `SELECT title, category, due_at FROM tasks
       WHERE user_id = ? AND due_at BETWEEN ? AND ? AND completed = 0
       ORDER BY due_at ASC`
    )
    .all(req.userId, startOfDay.toISOString(), endOfDay.toISOString());

  if (tasks.length === 0) {
    return res.json({ insight: null });
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 100,
      system: `You are a scheduling assistant. Given today's task list, write ONE short, useful observation
(under 20 words, sentence case, no period at the end) — a conflict warning, a gap suggestion, or encouragement.
Reply with plain text only, nothing else.`,
      messages: [{ role: 'user', content: JSON.stringify(tasks) }],
    });

    const text = response.content.find((block) => block.type === 'text')?.text?.trim();
    res.json({ insight: text || null });
  } catch (err) {
    res.json({ insight: null });
  }
});

module.exports = router;
