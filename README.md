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
- **6 themes** — Soft Light, Pure Dark, Midnight Blue, Nordic Slate, Forest Emerald, Sunset Warmth (pick in Settings)
- **Real push notifications (PWA)** — installable to your home screen; reminders arrive as real system notifications even with the browser fully closed, once VAPID keys are set up (see below)
- **Flexible recurrence** — daily, weekly (pick specific days), or monthly repeats
- **Drag-and-drop reordering** — manually reorder tasks in the timeline
- **Automatic conflict detection** — flags tasks scheduled within an hour of each other and suggests a free slot
- **Expandable details** — task notes stay hidden until you tap the task
- **Category icons** — work, health, sports, shopping, personal, each with its own icon and color
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
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` — needed for real push notifications. Generate a fresh pair with:

```bash
npm run generate-vapid
```

Copy the printed `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` into `backend/.env`. The frontend fetches the public key from the backend automatically — no separate frontend config needed. If you skip this, the app still works — you just won't get real push notifications when the browser is closed.

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
2. **Dashboard** — shows tasks as a vertical timeline (or grouped by category), color-coded with icons, plus an AI-generated insight banner and automatic conflict warnings when two tasks overlap.
3. **Add a task** — type a sentence into the assistant's input. Claude parses it into a structured task (title, category, time, reminder), you confirm — with full control over date/time, reminder, notes, and recurrence (daily/weekly with specific days/monthly) — and it's added to the timeline.
4. **Reorder** — drag any task in the timeline view to reorder it manually.
5. **Settings drawer** — language, one of 6 color themes, show/hide completed tasks, a Week/Month/Year time filter, push notifications, and sign out.

## API reference

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Current user (requires auth) |
| GET | `/api/tasks` | List your tasks |
| POST | `/api/tasks` | Create a task |
| PATCH | `/api/tasks/:id` | Update a task (e.g. mark complete) |
| PATCH | `/api/tasks/reorder` | Save a new manual task order |
| DELETE | `/api/tasks/:id` | Delete a task |
| POST | `/api/ai/parse-task` | Turn a sentence into a structured task |
| GET | `/api/ai/insight` | Get today's AI insight |
| GET | `/api/push/vapid-public-key` | Get the public key for push subscription |
| POST | `/api/push/subscribe` | Register a device for push notifications |

All routes except `/api/auth/register` and `/api/auth/login` require `Authorization: Bearer <token>`.

## Notes on reminders/notifications

Real push notifications now work via a service worker + the Push API, and
arrive even if the browser is fully closed — as long as you've set up VAPID
keys (see setup above) and the backend keeps running (it checks for due
reminders every 30 seconds and pushes to every device you've enabled
notifications on). Without VAPID keys configured, the app still works fine,
it just skips push and falls back silently.

## PWA (installable app)

The site includes a web app manifest and service worker, so visitors can
install it to their phone or desktop home screen like a native app (look for
"Install" / "Add to Home Screen" in the browser menu).

## Converting to a mobile app later

The backend doesn't change. For the app, swap the `frontend/` React web app
for React Native (or Expo) screens that call the same REST API in
`frontend/src/lib/api.js` — the auth flow, task model, and AI endpoints all
carry over as-is.
