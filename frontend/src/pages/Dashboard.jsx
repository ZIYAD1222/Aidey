import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { usePrefs } from '../lib/PrefsContext';
import { useTaskReminders } from '../lib/useTaskReminders';
import InsightBanner from '../components/InsightBanner';
import TaskCard from '../components/TaskCard';
import AddTaskChat from '../components/AddTaskChat';
import AideyLogo from '../components/AideyLogo';
import PrefsToggle from '../components/PrefsToggle';

export default function Dashboard() {
  const { token, user, logout } = useAuth();
  const { t, lang } = usePrefs();
  const [tasks, setTasks] = useState([]);
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(true);

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

  const today = new Date().toLocaleDateString(lang === 'ar' ? 'ar' : 'en', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
            <PrefsToggle />
            <button
              onClick={logout}
              style={{
                height: 30,
                padding: '0 12px',
                borderRadius: 'var(--radius)',
                border: '0.5px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                fontSize: 12.5,
              }}
            >
              {t('signOut')}
            </button>
          </div>
        </div>

        <InsightBanner text={insight} />

        {loading ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{t('loadingSchedule')}</p>
        ) : tasks.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{t('emptySchedule')}</p>
        ) : (
          <div>
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} onEdit={handleUpdate} />
            ))}
          </div>
        )}

        <AddTaskChat onCreated={handleCreated} />
      </div>
    </div>
  );
}
