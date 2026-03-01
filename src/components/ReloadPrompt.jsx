import { useState, useEffect } from 'react';

const ReloadPrompt = () => {
  const [showReload, setShowReload] = useState(false);

  useEffect(() => {
    const handler = () => setShowReload(true);
    window.addEventListener('sw-update-available', handler);
    return () => window.removeEventListener('sw-update-available', handler);
  }, []);

  const handleUpdate = () => {
    const updateSW = window.__supersix_updateSW;
    if (updateSW) {
      updateSW(true);
    }
  };

  const handleDismiss = () => {
    setShowReload(false);
  };

  if (!showReload) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-center">
      <div className="bg-slate-800 border border-cyan-500/30 rounded-lg shadow-xl shadow-cyan-500/10 px-4 py-3 flex items-center space-x-3 max-w-md">
        <div className="flex-1">
          <p className="text-white text-sm font-medium">Update available</p>
          <p className="text-slate-400 text-xs">A new version of SuperSix is ready.</p>
        </div>
        <button
          onClick={handleUpdate}
          className="bg-cyan-600 hover:bg-cyan-700 text-white text-sm px-3 py-1.5 rounded transition-colors whitespace-nowrap"
        >
          Refresh
        </button>
        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white text-sm px-2 py-1.5 transition-colors"
        >
          Later
        </button>
      </div>
    </div>
  );
};

export default ReloadPrompt;
