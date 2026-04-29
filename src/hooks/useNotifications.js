import { useState, useEffect, useRef } from 'react';

const STORAGE_KEY = 'ss_notified';
const ALERTS = [
  { suffix: '2h',  offsetMs: 2 * 60 * 60 * 1000, label: '2 hours' },
  { suffix: '30m', offsetMs: 30 * 60 * 1000,      label: '30 minutes' },
];

function getNotified() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}

function saveNotified(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function pruneOld(notified) {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return Object.fromEntries(Object.entries(notified).filter(([, ts]) => ts > cutoff));
}

export function useNotifications(tasks) {
  const [permission, setPermission] = useState(
    () => 'Notification' in window ? Notification.permission : 'unsupported'
  );
  const timersRef = useRef([]);

  const requestPermission = async () => {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  useEffect(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    if (permission !== 'granted' || !tasks?.length) return;

    const now = Date.now();
    const notified = pruneOld(getNotified());
    saveNotified(notified);

    tasks.forEach(task => {
      if (!task.dueDate || task.status === 'completed') return;
      const due = new Date(task.dueDate).getTime();
      if (isNaN(due)) return;

      ALERTS.forEach(({ suffix, offsetMs, label }) => {
        const fireAt = due - offsetMs;
        const key = `${task.id}_${suffix}_${task.dueDate}`;
        if (notified[key]) return;
        const msUntil = fireAt - now;
        if (msUntil <= 0) return;

        const timer = setTimeout(() => {
          const current = getNotified();
          current[key] = Date.now();
          saveNotified(current);
          new Notification(`Due in ${label}: ${task.title}`, {
            body: task.description || new Date(due).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
            icon: '/android-chrome-192x192.png',
            tag: key,
          });
        }, msUntil);

        timersRef.current.push(timer);
      });
    });

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [tasks, permission]);

  return { permission, requestPermission };
}
