import { useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { usePrefs } from '../lib/PrefsContext';

function toLocalInputValue(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const darkTextInput = {
  borderRadius: 'var(--radius)',
  border: '0.5px solid var(--border)',
  background: '#fff',
  color: '#1a1a1a',
  fontSize: 13.5,
};

export default function AddTaskChat({ onCreated }) {
  const { token } = useAuth();
  const { t, lang } = usePrefs();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(null);
  const [remindHours, setRemindHours] = useState(0);
  const [remindMinutes, setRemindMinutes] = useState(30);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleParse(e) {
    e.preventDefault();
    if (!message.trim()) return;
    setBusy(true);
    setError('');
    try {
      const { task, aiEnabled: enabled } = await api.parseTask(token, message);
      setPending(task);
      setAiEnabled(enabled !== false);
      const total = task.remind_minutes_before || 30;
      setRemindHours(Math.floor(total / 60));
      setRemindMinutes(total % 60);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirm() {
    setBusy(true);
    try {
      const finalTask = {
        ...pending,
        remind_minutes_before: remindHours * 60 + remindMinutes,
      };
      const { task } = await api.createTask(token, finalTask);
      onCreated(task);
      setPending(null);
      setMessage('');
      setOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          width: '100%',
          height: 44,
          borderRadius: 'var(--radius)',
          border: '0.5px solid var(--border)',
          background: 'var(--bg-card)',
          color: 'var(--text-secondary)',
          fontSize: 14,
          textAlign: 'start',
          padding: '0 14px',
          marginTop: 12,
        }}
      >
        {t('addTaskPlaceholder')}
      </button>
    );
  }

  return (
    <div
      style={{
        marginTop: 12,
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: 14,
      }}
    >
      {!pending ? (
        <form onSubmit={handleParse} style={{ display: 'flex', gap: 8 }}>
          <input
            autoFocus
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('inputPlaceholder')}
            style={{ ...darkTextInput, flex: 1, height: 38, padding: '0 10px' }}
          />
          <button
            type="submit"
            disabled={busy}
            style={{
              height: 38,
              padding: '0 14px',
              borderRadius: 'var(--radius)',
              border: 'none',
              background: 'var(--accent)',
              color: '#fff',
              fontSize: 13.5,
            }}
          >
            {busy ? '…' : t('send')}
          </button>
        </form>
      ) : (
        <div>
          <input
            value={pending.title}
            onChange={(e) => setPending((prev) => ({ ...prev, title: e.target.value }))}
            style={{ ...darkTextInput, width: '100%', height: 36, padding: '0 10px', marginBottom: 8 }}
          />

          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <select
              value={pending.category}
              onChange={(e) => setPending((prev) => ({ ...prev, category: e.target.value }))}
              style={{ ...darkTextInput, height: 36, padding: '0 8px' }}
            >
              <option value="work">{t('work')}</option>
              <option value="health">{t('health')}</option>
              <option value="sports">{t('sports')}</option>
              <option value="personal">{t('personal')}</option>
            </select>

            <input
              type="datetime-local"
              value={toLocalInputValue(pending.due_at)}
              onChange={(e) =>
                setPending((prev) => ({ ...prev, due_at: new Date(e.target.value).toISOString() }))
              }
              style={{ ...darkTextInput, flex: 1, height: 36, padding: '0 8px' }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 12,
            }}
          >
            <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{t('remindMeAt')}</span>
            <select
              value={remindHours}
              onChange={(e) => setRemindHours(Number(e.target.value))}
              style={{ ...darkTextInput, height: 32, padding: '0 6px' }}
            >
              {Array.from({ length: 13 }, (_, i) => (
                <option key={i} value={i}>
                  {i} {lang === 'ar' ? 'ساعة' : 'hr'}
                </option>
              ))}
            </select>
            <select
              value={remindMinutes}
              onChange={(e) => setRemindMinutes(Number(e.target.value))}
              style={{ ...darkTextInput, height: 32, padding: '0 6px' }}
            >
              {[0, 5, 10, 15, 20, 30, 45].map((m) => (
                <option key={m} value={m}>
                  {m} {lang === 'ar' ? 'دقيقة' : 'min'}
                </option>
              ))}
            </select>
            <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{t('minBefore')}</span>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleConfirm}
              disabled={busy}
              style={{
                flex: 1,
                height: 36,
                borderRadius: 'var(--radius)',
                border: 'none',
                background: 'var(--accent)',
                color: '#fff',
                fontSize: 13.5,
              }}
            >
              {t('addToSchedule')}
            </button>
            <button
              onClick={() => setPending(null)}
              style={{
                height: 36,
                padding: '0 12px',
                borderRadius: 'var(--radius)',
                border: '0.5px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: 13.5,
              }}
            >
              {t('redo')}
            </button>
          </div>
        </div>
      )}
      {error && <p style={{ color: 'var(--personal-title)', fontSize: 12.5, marginTop: 8 }}>{error}</p>}
    </div>
  );
}
