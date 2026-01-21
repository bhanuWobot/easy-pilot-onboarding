/**
 * Header Component
 * Displays personalized greeting and user profile
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { GlobalSearch } from './GlobalSearch';

export function Header() {
  const { state } = useAuth();
  const [showSearch, setShowSearch] = useState(false);
  
  // Get first name from full name
  const firstName = state.user?.name?.split(' ')[0] || 'User';
  
  // Get initials for avatar
  const initials = state.user?.name
    ?.split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  // Keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="px-8 py-4 flex items-center justify-between gap-6">
          {/* Greeting */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {firstName}! 👋
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Here's what's happening with your pilots today
            </p>
          </div>

          {/* Global Search Bar */}
          <div className="flex-1 max-w-2xl">
            <button
              onClick={() => setShowSearch(true)}
              className="w-full flex items-center gap-3 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors group"
            >
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span className="text-gray-500 group-hover:text-gray-700 text-sm flex-1 text-left">
                Search pilots, objectives, cameras...
              </span>
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-300 rounded text-xs text-gray-600">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {/* Notifications */}
            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Profile Avatar */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden lg:block">
                <p className="text-sm font-medium text-gray-900">
                  {state.user?.name}
                </p>
                <p className="text-xs text-gray-600">
                  {state.user?.userType} {state.user?.role && `• ${state.user.role.charAt(0).toUpperCase() + state.user.role.slice(1)}`}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
                {initials}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearch isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </>
  );
}
