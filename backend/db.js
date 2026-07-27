const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, 'app.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'personal',
    due_at TEXT NOT NULL,
    remind_minutes_before INTEGER DEFAULT 30,
    completed INTEGER DEFAULT 0,
    notes TEXT DEFAULT '',
    recurrence TEXT DEFAULT 'none',
    recurrence_days TEXT DEFAULT '',
    position INTEGER DEFAULT 0,
    reminder_sent INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    endpoint TEXT UNIQUE NOT NULL,
    subscription_json TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );
`);

// Safe migration for databases created before notes/recurrence/position existed.
for (const col of [
  { name: 'notes', def: "TEXT DEFAULT ''" },
  { name: 'recurrence', def: "TEXT DEFAULT 'none'" },
  { name: 'recurrence_days', def: "TEXT DEFAULT ''" },
  { name: 'position', def: 'INTEGER DEFAULT 0' },
  { name: 'reminder_sent', def: 'INTEGER DEFAULT 0' },
]) {
  try {
    db.exec(`ALTER TABLE tasks ADD COLUMN ${col.name} ${col.def}`);
  } catch {
    // column already exists — ignore
  }
}

module.exports = db;
