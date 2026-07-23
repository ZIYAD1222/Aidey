import { useEffect, useRef } from 'react';

export function useTaskReminders(tasks) {
  const notified = useRef(new Set());

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;

      const now = Date.now();
      tasks.forEach((task) => {
        if (task.completed || notified.current.has(task.id)) return;

        const dueTime = new Date(task.due_at).getTime();
        const remindAt = dueTime - task.remind_minutes_before * 60 * 1000;

        if (now >= remindAt && now < dueTime) {
          notified.current.add(task.id);
          new Notification('Aidey', {
            body: `${task.title} — ${new Date(task.due_at).toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
            })}`,
          });
        }
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [tasks]);
}
