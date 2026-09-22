import Icon from './Icon';
import useNow from '../hooks/useNow';
import { entryMs, formatClock } from '../utils/timeTracking';

// Header pill for the currently running timer (visible from any board/view).
const RunningTimer = ({ entry, onStop, onOpen, compact = false }) => {
  const now = useNow(!!entry);
  if (!entry) return null;

  return (
    <div className="flex items-center gap-1 bg-green-600/15 border border-green-500/40 rounded-full pl-2.5 pr-1 py-0.5 text-xs min-w-0">
      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" aria-hidden="true" />
      <button
        onClick={onOpen}
        className="flex items-center gap-1.5 min-w-0 text-green-300 hover:text-white transition-colors"
        title={`${entry.taskTitle} · ${entry.boardName}`}
      >
        {!compact && <span className="truncate max-w-[160px]">{entry.taskTitle}</span>}
        <span className="font-mono tabular-nums">{formatClock(entryMs(entry, now))}</span>
      </button>
      <button
        onClick={onStop}
        className="p-1 rounded-full text-green-300 hover:text-white hover:bg-red-600 transition-colors"
        title="Stop timer"
        aria-label="Stop timer"
      >
        <Icon name="square" size={10} />
      </button>
    </div>
  );
};

export default RunningTimer;
