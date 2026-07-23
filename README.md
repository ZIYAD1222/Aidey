# Aidey — smart assistant website

A task-scheduling assistant: sign in, tell it what to do in plain English or
Arabic ("dentist Thursday 2pm, remind me an hour before" / "موعد الأسنان
الخميس الساعة 2، ذكّرني قبل ساعة"), and it schedules the task on a timeline
with an AI-generated daily insight at the top.

This is the **website** version, built so it converts cleanly into a
mobile app later (React frontend talking to a REST API is the same shape
React Native would use).

## Features

- **Bilingual** — English and Arabic, with full right-to-left layout switching
- **Light / dark mode** — toggle in the corner, saved per device
- **Task reminders** — browser notifications fire at a time you choose per task (minutes before the task, editable when you add it)
- **Aidey logo** — in the corner of every screen

## Stack

- **Frontend**: React + Vite, React Router, plain CSS variables (no UI framework)
- **Backend**: Node.js + Express
- **Database**: SQLite via Node's built-in `node:sqlite` module (no native build step, so it runs anywhere Node 22+ runs)
- **Auth**: JWT + bcrypt password hashing
- **AI**: Anthropic API — parses natural-language task input and generates the daily insight

## Project structure

```
assistant-app/
  backend/          Express API (auth, tasks, AI)
  frontend/         React + Vite website
```

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
- `JWT_SECRET` — any long random string
- `ANTHROPIC_API_KEY` — your Anthropic API key (get one at console.anthropic.com)

```bash
npm start
```

The API runs at `http://localhost:4000`. A `app.db` SQLite file is created automatically on first run.

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env   # only needed if your API isn't on localhost:4000
npm run dev
```

The website runs at `http://localhost:5173`.

## How it works

1. **Register / sign in** — creates a JWT-authenticated account.
2. **Dashboard** — shows today's tasks as a vertical timeline, color-coded by category (work / health / personal), plus an AI-generated insight banner at the top when there's something worth flagging (a conflict, a gap, encouragement).
3. **Add a task** — type a sentence into the assistant's input ("gym at 6, remind me 15 min before"). Claude parses it into a structured task (title, category, time, reminder), you confirm, and it's added to the timeline.

## API reference

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Current user (requires auth) |
| GET | `/api/tasks` | List your tasks |
| POST | `/api/tasks` | Create a task |
| PATCH | `/api/tasks/:id` | Update a task (e.g. mark complete) |
| DELETE | `/api/tasks/:id` | Delete a task |
| POST | `/api/ai/parse-task` | Turn a sentence into a structured task |
| GET | `/api/ai/insight` | Get today's AI insight |

All `/api/tasks` and `/api/ai` routes require `Authorization: Bearer <token>`.

## Notes on reminders/notifications

Reminders currently work via the browser's Notification API: the dashboard
asks for notification permission, then checks every 30 seconds whether any
task's reminder time has arrived and fires a native browser notification.
This works while the site is open in a tab (including in the background),
but **not** if the browser is fully closed — that needs a service worker +
push subscription (web push) or, once converted to a mobile app, native
push. Happy to add that next if you need reminders to arrive with the site
closed.

## Converting to a mobile app later

The backend doesn't change. For the app, swap the `frontend/` React web app
for React Native (or Expo) screens that call the same REST API in
`frontend/src/lib/api.js` — the auth flow, task model, and AI endpoints all
carry over as-is.
