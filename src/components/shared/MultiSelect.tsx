import { useState, useRef, useEffect } from 'react';
import type { User } from '../../types/auth';

interface MultiSelectProps {
  users: User[];
  selectedUserIds: string[];
  onChange: (selectedIds: string[]) => void;
  label?: string;
  placeholder?: string;
  error?: string;
}

export default function MultiSelect({
  users,
  selectedUserIds,
  onChange,
  label = 'Assigned Users',
  placeholder = 'Search and select users...',
  error,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.userType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedUsers = users.filter((user) => selectedUserIds.includes(user.id));

  const toggleUser = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      onChange(selectedUserIds.filter((id) => id !== userId));
    } else {
      onChange([...selectedUserIds, userId]);
    }
  };

  const removeUser = (userId: string) => {
    onChange(selectedUserIds.filter((id) => id !== userId));
  };

  const getUserTypeBadgeStyle = (userType: 'Platform' | 'Partner') => {
    return userType === 'Platform'
      ? 'bg-blue-100 text-blue-800 border-blue-200'
      : 'bg-purple-100 text-purple-800 border-purple-200';
  };

  const getRoleBadgeStyle = (role: 'admin' | 'user') => {
    return role === 'admin'
      ? 'bg-orange-100 text-orange-800 border-orange-200'
      : 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {/* Selected Users Display */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`min-h-[42px] w-full px-3 py-2 border rounded-lg cursor-pointer transition-all ${
          error
            ? 'border-red-300 focus-within:ring-2 focus-within:ring-red-500/20'
            : 'border-gray-300 hover:border-gray-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20'
        }`}
      >
        {selectedUsers.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map((user) => (
              <span
                key={user.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-sm rounded-md border border-blue-200"
              >
                <div className="flex items-center gap-1.5">
                  {user.avatar && (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-4 h-4 rounded-full"
                    />
                  )}
                  <span className="font-medium">{user.name}</span>
                  <span className="text-xs opacity-75">({user.userType})</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeUser(user.id);
                  }}
                  className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        ) : (
          <span className="text-gray-400 text-sm">{placeholder}</span>
        )}

        {/* Dropdown Arrow */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* User List */}
          <div className="overflow-y-auto max-h-60">
            {filteredUsers.length > 0 ? (
              <>
                {/* Group by User Type */}
                {['Platform', 'Partner'].map((type) => {
                  const typeUsers = filteredUsers.filter((u) => u.userType === type);
                  if (typeUsers.length === 0) return null;

                  return (
                    <div key={type}>
                      <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          {type} Users
                        </span>
                      </div>
                      {typeUsers.map((user) => (
                        <label
                          key={user.id}
                          className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0"
                        >
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(user.id)}
                            onChange={() => toggleUser(user.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500/20"
                          />
                          
                          {user.avatar && (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 text-sm">
                                {user.name}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 text-xs font-medium rounded border ${getRoleBadgeStyle(
                                  user.role
                                )}`}
                              >
                                {user.role}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-500 truncate">
                                {user.email}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 text-xs font-medium rounded border ${getUserTypeBadgeStyle(
                                  user.userType
                                )}`}
                              >
                                {user.userType}
                              </span>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                No users found
              </div>
            )}
          </div>

          {/* Footer */}
          {filteredUsers.length > 0 && (
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
              {selectedUserIds.length} of {users.length} users selected
            </div>
          )}
        </div>
      )}
    </div>
  );
}
