import { useState } from 'react';
import Icon from './Icon';
import api from '../services/api';

const UserHeader = ({ user, onLogout, onOpenAuth }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await api.logout();
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
      onLogout(); // Logout anyway
    }
  };

  if (!user) {
    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onOpenAuth()}
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded font-medium transition-colors"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
      >
        <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center">
          <Icon name="user" size={16} />
        </div>
        <span className="hidden sm:block">{user.name}</span>
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 top-full mt-2 bg-slate-700 border border-slate-600 rounded-lg shadow-xl min-w-48 z-50">
          <div className="p-3 border-b border-slate-600">
            <p className="text-white font-medium">{user.name}</p>
            <p className="text-slate-400 text-sm">{user.email}</p>
            {!user.email_verified && (
              <p className="text-orange-400 text-xs mt-1">Email not verified</p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-left text-slate-300 hover:bg-slate-600 hover:text-white flex items-center space-x-2 rounded-b-lg"
          >
            <Icon name="log-out" size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {dropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default UserHeader;
