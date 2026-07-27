import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrefs } from '../lib/PrefsContext';
import CategoryIcon from './CategoryIcon';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function formatDateTime(iso, lang) {
  return new Date(iso).toLocaleString(lang === 'ar' ? 'ar' : 'en', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
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

function DayPicker({ value, onChange, t }) {
  const selected = (value || '').split(',').filter(Boolean);
  function toggleDay(day) {
    const next = selected.includes(day) ? selected.filter((d) => d !== day) : [...selected, day];
    onChange(next.join(','));
  }
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
      {DAYS.map((day) => (
        <button
          key={day}
          type="button"
          onClick={() => toggleDay(day)}
          style={{
            height: 28,
            padding: '0 8px',
            borderRadius: 'var(--radius)',
            border: '0.5px solid var(--border)',
            background: selected.includes(day) ? 'var(--cat)' : '#fff',
            color: selected.includes(day) ? '#fff' : '#1a1a1a',
            fontSize: 11.5,
          }}
        >
          {t(day)}
        </button>
      ))}
    </div>
  );
}

export default function TaskCard({ task, onToggle, onDelete, onEdit, index, onReorder }) {
  const { t, lang } = usePrefs();
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState(null);

  function startEdit(e) {
    e.stopPropagation();
    const total = task.remind_minutes_before || 0;
    setDraft({
      title: task.title,
      category: task.category,
      due_at: task.due_at,
      remindHours: Math.floor(total / 60),
      remindMinutes: total % 60,
      notes: task.notes || '',
      recurrence: task.recurrence || 'none',
      recurrence_days: task.recurrence_days || '',
    });
    setEditing(true);
  }

  function saveEdit() {
    onEdit(task, {
      title: draft.title,
      category: draft.category,
      due_at: draft.due_at,
      remind_minutes_before: draft.remindHours * 60 + draft.remindMinutes,
      notes: draft.notes,
      recurrence: draft.recurrence,
      recurrence_days: draft.recurrence === 'weekly' ? draft.recurrence_days : '',
    });
    setEditing(false);
  }

  const catClass = `category-${task.category}`;
  const recurrenceLabel = {
    daily: t('repeatDaily'),
    weekly: t('repeatWeekly'),
    monthly: t('repeatMonthly'),
  }[task.recurrence];

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
            <option value="shopping">{t('shopping')}</option>
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

        <textarea
          value={draft.notes}
          onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
          placeholder={t('notesPlaceholder')}
          rows={2}
          style={{ ...editInputStyle, width: '100%', height: 'auto', padding: '8px', marginBottom: 8, resize: 'vertical', fontFamily: 'inherit' }}
        />

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--cat-sub)' }}>{t('repeat')}</span>
          <select
            value={draft.recurrence}
            onChange={(e) => setDraft((d) => ({ ...d, recurrence: e.target.value }))}
            style={editInputStyle}
          >
            <option value="none">{t('repeatNone')}</option>
            <option value="daily">{t('repeatDaily')}</option>
            <option value="weekly">{t('repeatWeekly')}</option>
            <option value="monthly">{t('repeatMonthly')}</option>
          </select>
        </label>

        {draft.recurrence === 'weekly' && (
          <div>
            <span style={{ fontSize: 11.5, color: 'var(--cat-sub)', display: 'block', marginBottom: 6 }}>
              {t('onDays')}
            </span>
            <DayPicker
              value={draft.recurrence_days}
              onChange={(days) => setDraft((d) => ({ ...d, recurrence_days: days }))}
              t={t}
            />
          </div>
        )}

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
    <div
      draggable={Boolean(onReorder)}
      onDragStart={(e) => e.dataTransfer.setData('text/plain', String(index))}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const fromIndex = Number(e.dataTransfer.getData('text/plain'));
        if (onReorder && !Number.isNaN(fromIndex)) onReorder(fromIndex, index);
      }}
      style={{ display: 'flex', gap: 10, marginBottom: 16 }}
    >
      {onReorder && (
        <span
          title="Drag to reorder"
          style={{
            marginTop: 24,
            color: 'var(--text-muted)',
            fontSize: 13,
            cursor: 'grab',
            userSelect: 'none',
          }}
        >
          ⠿
        </span>
      )}
      <div style={{ marginTop: 22 }}>
        <CategoryIcon category={task.category} size={16} />
      </div>
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
            opacity: task.completed ? 0.55 : 1,
            cursor: task.notes ? 'pointer' : 'default',
          }}
          onClick={() => task.notes && setExpanded((v) => !v)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                {recurrenceLabel && ` · ${recurrenceLabel}`}
                {task.notes && ` · ${expanded ? '▲' : '▼'} ${t('details')}`}
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
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(task);
                }}
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
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task);
                }}
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
          <AnimatePresence initial={false}>
            {expanded && task.notes && (
              <motion.p
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.18, ease: 'easeInOut' }}
                style={{
                  color: 'var(--cat-sub)',
                  fontSize: 12.5,
                  paddingTop: 8,
                  borderTop: '0.5px solid var(--cat)',
                  opacity: 0.9,
                  lineHeight: 1.5,
                  overflow: 'hidden',
                }}
              >
                {task.notes}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
