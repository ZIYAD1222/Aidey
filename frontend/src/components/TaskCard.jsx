import { useState } from 'react';
import { usePrefs } from '../lib/PrefsContext';

function formatDateTime(iso, lang) {
  return new Date(iso).toLocaleString(lang === 'ar' ? 'ar' : 'en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function toLocalInputValue(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const editInputStyle = {
  borderRadius: 'var(--radius)',
  border: '0.5px solid var(--border)',
  background: '#fff',
  color: '#1a1a1a',
  fontSize: 13,
  height: 32,
  padding: '0 8px',
};

export default function TaskCard({ task, onToggle, onDelete, onEdit }) {
  const { t, lang } = usePrefs();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);

  function startEdit() {
    const total = task.remind_minutes_before || 0;
    setDraft({
      title: task.title,
      category: task.category,
      due_at: task.due_at,
      remindHours: Math.floor(total / 60),
      remindMinutes: total % 60,
    });
    setEditing(true);
  }

  function saveEdit() {
    onEdit(task, {
      title: draft.title,
      category: draft.category,
      due_at: draft.due_at,
      remind_minutes_before: draft.remindHours * 60 + draft.remindMinutes,
    });
    setEditing(false);
  }

  const catClass = `category-${task.category}`;

  if (editing) {
    return (
      <div
        className={catClass}
        style={{
          background: 'var(--cat-bg)',
          borderLeft: '3px solid var(--cat)',
          borderRadius: 8,
          padding: '12px',
          marginBottom: 16,
        }}
      >
        <input
          value={draft.title}
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          style={{ ...editInputStyle, width: '100%', marginBottom: 8 }}
        />
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <select
            value={draft.category}
            onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
            style={editInputStyle}
          >
            <option value="work">{t('work')}</option>
            <option value="health">{t('health')}</option>
            <option value="sports">{t('sports')}</option>
            <option value="personal">{t('personal')}</option>
          </select>
          <input
            type="datetime-local"
            value={toLocalInputValue(draft.due_at)}
            onChange={(e) => setDraft((d) => ({ ...d, due_at: new Date(e.target.value).toISOString() }))}
            style={{ ...editInputStyle, flex: 1 }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--cat-sub)' }}>{t('remindMeAt')}</span>
          <select
            value={draft.remindHours}
            onChange={(e) => setDraft((d) => ({ ...d, remindHours: Number(e.target.value) }))}
            style={editInputStyle}
          >
            {Array.from({ length: 13 }, (_, i) => (
              <option key={i} value={i}>
                {i} {lang === 'ar' ? 'ساعة' : 'hr'}
              </option>
            ))}
          </select>
          <select
            value={draft.remindMinutes}
            onChange={(e) => setDraft((d) => ({ ...d, remindMinutes: Number(e.target.value) }))}
            style={editInputStyle}
          >
            {[0, 5, 10, 15, 20, 30, 45].map((m) => (
              <option key={m} value={m}>
                {m} {lang === 'ar' ? 'دقيقة' : 'min'}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={saveEdit}
            style={{
              flex: 1,
              height: 32,
              borderRadius: 'var(--radius)',
              border: 'none',
              background: 'var(--cat)',
              color: '#fff',
              fontSize: 13,
            }}
          >
            {t('addToSchedule')}
          </button>
          <button
            onClick={() => setEditing(false)}
            style={{
              height: 32,
              padding: '0 12px',
              borderRadius: 'var(--radius)',
              border: '0.5px solid var(--border)',
              background: 'transparent',
              color: 'var(--cat-sub)',
              fontSize: 13,
            }}
          >
            {t('redo')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: `var(--${task.category})`,
          marginTop: 22,
        }}
      />
      <div style={{ flex: 1 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: '0 0 4px' }}>
          {formatDateTime(task.due_at, lang)}
        </p>
        <div
          className={catClass}
          style={{
            background: 'var(--cat-bg)',
            borderLeft: '3px solid var(--cat)',
            borderRadius: 8,
            padding: '10px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            opacity: task.completed ? 0.55 : 1,
          }}
        >
          <div>
            <p
              style={{
                color: 'var(--cat-title)',
                fontSize: 14,
                fontWeight: 500,
                margin: 0,
                textDecoration: task.completed ? 'line-through' : 'none',
              }}
            >
              {task.title}
            </p>
            <p style={{ color: 'var(--cat-sub)', fontSize: 12, margin: '2px 0 0' }}>
              {t(task.category) || task.category}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={startEdit}
              aria-label="Edit task"
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                border: '1.5px solid var(--cat)',
                background: 'transparent',
                color: 'var(--cat)',
                fontSize: 12,
              }}
            >
              ✎
            </button>
            <button
              onClick={() => onToggle(task)}
              aria-label={task.completed ? 'Mark as not done' : 'Mark as done'}
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                border: `1.5px solid var(--cat)`,
                background: task.completed ? 'var(--cat)' : 'transparent',
                color: task.completed ? '#fff' : 'var(--cat)',
                fontSize: 13,
              }}
            >
              ✓
            </button>
            <button
              onClick={() => onDelete(task)}
              aria-label="Delete task"
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                border: '1.5px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-muted)',
                fontSize: 13,
              }}
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
