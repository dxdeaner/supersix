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
  // Map<timerKey, { timer, dueDate }> — persists across renders so board switches don't cancel timers
  const timersRef = useRef(new Map());

  const requestPermission = async () => {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  useEffect(() => {
    if (permission !== 'granted') {
      timersRef.current.forEach(({ timer }) => clearTimeout(timer));
      timersRef.current.clear();
      return;
    }

    if (!tasks?.length) return;

    const now = Date.now();
    const notified = pruneOld(getNotified());
    saveNotified(notified);

    const currentTimerKeys = new Set();

    tasks.forEach(task => {
      if (!task.dueDate || task.status === 'completed') return;
      const due = new Date(task.dueDate).getTime();
      if (isNaN(due)) return;

      ALERTS.forEach(({ suffix, offsetMs, label }) => {
        const timerKey = `${task.id}_${suffix}`;
        const notifKey = `${task.id}_${suffix}_${task.dueDate}`;
        currentTimerKeys.add(timerKey);

        if (notified[notifKey]) return;

        const existing = timersRef.current.get(timerKey);
        if (existing && existing.dueDate === task.dueDate) return;
        if (existing) clearTimeout(existing.timer);

        const fireAt = due - offsetMs;
        const msUntil = fireAt - now;

        if (msUntil <= 0) {
          timersRef.current.delete(timerKey);
          return;
        }

        const timer = setTimeout(() => {
          timersRef.current.delete(timerKey);
          const current = getNotified();
          current[notifKey] = Date.now();
          saveNotified(current);
          new Notification(`Due in ${label}: ${task.title}`, {
            body: task.description || new Date(due).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
            icon: '/android-chrome-192x192.png',
            tag: notifKey,
          });
        }, msUntil);

        timersRef.current.set(timerKey, { timer, dueDate: task.dueDate });
        console.debug(`[Notif] Scheduled "${task.title}" — ${label} before due (fires in ${Math.round(msUntil / 60000)}m)`);
      });
    });

    // Cancel timers for tasks no longer in the list
    const toDelete = [];
    timersRef.current.forEach((_, key) => {
      if (!currentTimerKeys.has(key)) toDelete.push(key);
    });
    toDelete.forEach(key => {
      clearTimeout(timersRef.current.get(key).timer);
      timersRef.current.delete(key);
    });
  }, [tasks, permission]);

  // Clear all timers on unmount only
  useEffect(() => {
    return () => {
      timersRef.current.forEach(({ timer }) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  return { permission, requestPermission };
}
