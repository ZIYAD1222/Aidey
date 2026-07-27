import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { usePrefs } from '../lib/PrefsContext';
import { useTaskReminders } from '../lib/useTaskReminders';
import { enablePushNotifications } from '../lib/push';
import InsightBanner from '../components/InsightBanner';
import TaskCard from '../components/TaskCard';
import AddTaskChat from '../components/AddTaskChat';
import AideyLogo from '../components/AideyLogo';
import SettingsDrawer from '../components/SettingsDrawer';

const CONFLICT_WINDOW_MINUTES = 60;

function isWithinTimeframe(dueAtIso, timeframe) {
  if (timeframe === 'all') return true;
  const due = new Date(dueAtIso);
  const now = new Date();

  if (timeframe === 'week') {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    return due >= startOfWeek && due < endOfWeek;
  }
  if (timeframe === 'month') {
    return due.getFullYear() === now.getFullYear() && due.getMonth() === now.getMonth();
  }
  if (timeframe === 'year') {
    return due.getFullYear() === now.getFullYear();
  }
  return true;
}

// Flags pairs of incomplete tasks whose due times fall within an hour of
// each other, and suggests the next free hour-slot after the later one.
function findConflicts(tasks) {
  const active = tasks
    .filter((t) => !t.completed)
    .slice()
    .sort((a, b) => a.due_at.localeCompare(b.due_at));

  const conflicts = [];
  for (let i = 0; i < active.length - 1; i++) {
    const a = active[i];
    const b = active[i + 1];
    const diffMinutes = (new Date(b.due_at) - new Date(a.due_at)) / 60000;
    if (diffMinutes >= 0 && diffMinutes < CONFLICT_WINDOW_MINUTES) {
      const suggested = new Date(b.due_at);
      suggested.setMinutes(suggested.getMinutes() + CONFLICT_WINDOW_MINUTES);
      conflicts.push({ a, b, suggested: suggested.toISOString() });
    }
  }
  return conflicts;
}

export default function Dashboard() {
  const { token, user, logout } = useAuth();
  const { t, lang } = usePrefs();
  const [tasks, setTasks] = useState([]);
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('timeline');
  const [showCompleted, setShowCompleted] = useState(true);
  const [timeframe, setTimeframe] = useState('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notificationsStatus, setNotificationsStatus] = useState('off');
  const [dismissedConflicts, setDismissedConflicts] = useState([]);

  useTaskReminders(tasks);

  useEffect(() => {
    Promise.all([api.getTasks(token), api.getInsight(token)])
      .then(([taskRes, insightRes]) => {
        setTasks(taskRes.tasks);
        setInsight(insightRes.insight);
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function handleToggle(task) {
    const { task: updated } = await api.updateTask(token, task.id, {
      completed: task.completed ? 0 : 1,
    });
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }

  async function handleDelete(task) {
    await api.deleteTask(token, task.id);
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
  }

  async function handleUpdate(task, updates) {
    const { task: updated } = await api.updateTask(token, task.id, updates);
    setTasks((prev) =>
      prev
        .map((t) => (t.id === updated.id ? updated : t))
        .sort((a, b) => a.due_at.localeCompare(b.due_at))
    );
  }

  function handleCreated(task) {
    setTasks((prev) => [...prev, task].sort((a, b) => a.due_at.localeCompare(b.due_at)));
  }

  function handleReorder(fromIndex, toIndex) {
    setTasks((prev) => {
      const next = prev.slice();
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      api.reorderTasks(token, next.map((tsk) => tsk.id));
      return next;
    });
  }

  async function handleEnableNotifications() {
    try {
      const result = await enablePushNotifications(token, api);
      setNotificationsStatus(result.ok ? 'on' : 'failed');
    } catch {
      setNotificationsStatus('failed');
    }
  }

  async function applySuggestion(task, suggestedIso) {
    await handleUpdate(task, { due_at: suggestedIso });
  }

  const today = new Date().toLocaleDateString(lang === 'ar' ? 'ar' : 'en', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const visibleTasks = tasks
    .filter((task) => showCompleted || !task.completed)
    .filter((task) => isWithinTimeframe(task.due_at, timeframe));

  const conflicts = useMemo(
    () =>
      findConflicts(visibleTasks).filter(
        (c) => !dismissedConflicts.includes(`${c.a.id}-${c.b.id}`)
      ),
    [visibleTasks, dismissedConflicts]
  );

  const grouped = visibleTasks.reduce((acc, task) => {
    (acc[task.category] = acc[task.category] || []).push(task);
    return acc;
  }, {});
  const categoryOrder = ['work', 'health', 'sports', 'shopping', 'personal'];

  const selectStyle = {
    height: 30,
    padding: '0 8px',
    borderRadius: 'var(--radius)',
    border: '0.5px solid var(--border)',
    background: 'var(--bg-card)',
    color: 'var(--text-secondary)',
    fontSize: 12.5,
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: '32px 16px' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AideyLogo size={34} />
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>{today}</p>
              <h1 style={{ fontSize: 22, fontWeight: 500, margin: '2px 0 0' }}>
                {t('hi')}{user ? `, ${user.name.split(' ')[0]}` : ''}
              </h1>
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label={t('settings')}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: '0.5px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text-secondary)',
              fontSize: 16,
            }}
          >
            ⚙
          </button>
        </div>

        <InsightBanner text={insight} />

        {conflicts.map((c) => (
          <div
            key={`${c.a.id}-${c.b.id}`}
            className="fade-in"
            style={{
              background: 'var(--personal-bg)',
              border: '0.5px solid var(--personal)',
              borderRadius: 'var(--radius)',
              padding: '10px 14px',
              marginBottom: 12,
            }}
          >
            <p style={{ color: 'var(--personal-title)', fontSize: 12.5, margin: '0 0 6px' }}>
              ⚠ "{c.a.title}" {t('conflictWarning')} "{c.b.title}"
            </p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11.5, color: 'var(--personal-sub)' }}>
                {t('suggestedTime')}:{' '}
                {new Date(c.suggested).toLocaleTimeString(lang === 'ar' ? 'ar' : 'en', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
              <button
                onClick={() => applySuggestion(c.b, c.suggested)}
                style={{
                  height: 26,
                  padding: '0 10px',
                  borderRadius: 'var(--radius)',
                  border: 'none',
                  background: 'var(--personal)',
                  color: '#fff',
                  fontSize: 11.5,
                }}
              >
                {t('useSuggestion')}
              </button>
              <button
                onClick={() =>
                  setDismissedConflicts((prev) => [...prev, `${c.a.id}-${c.b.id}`])
                }
                style={{
                  height: 26,
                  padding: '0 10px',
                  borderRadius: 'var(--radius)',
                  border: '0.5px solid var(--personal)',
                  background: 'transparent',
                  color: 'var(--personal)',
                  fontSize: 11.5,
                }}
              >
                {t('dismiss')}
              </button>
            </div>
          </div>
        ))}

        {!loading && tasks.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <select value={view} onChange={(e) => setView(e.target.value)} style={selectStyle}>
              <option value="timeline">{t('timelineView')}</option>
              <option value="category">{t('categoryView')}</option>
            </select>
          </div>
        )}

        {loading ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{t('loadingSchedule')}</p>
        ) : visibleTasks.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{t('emptySchedule')}</p>
        ) : view === 'timeline' ? (
          <div>
            {visibleTasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onReorder={handleReorder}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onEdit={handleUpdate}
              />
            ))}
          </div>
        ) : (
          <div>
            {categoryOrder
              .filter((cat) => grouped[cat]?.length)
              .map((cat) => (
                <div key={cat} style={{ marginBottom: 18 }}>
                  <p
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      margin: '0 0 8px',
                      textTransform: 'uppercase',
                      letterSpacing: 0.4,
                    }}
                  >
                    {t(cat)} · {grouped[cat].length}
                  </p>
                  {grouped[cat].map((task, index) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      index={index}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                      onEdit={handleUpdate}
                    />
                  ))}
                </div>
              ))}
          </div>
        )}

        <AddTaskChat onCreated={handleCreated} />
      </div>

      <SettingsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onLogout={logout}
        showCompleted={showCompleted}
        onShowCompletedChange={setShowCompleted}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        onEnableNotifications={handleEnableNotifications}
        notificationsStatus={notificationsStatus}
      />
    </div>
  );
}
