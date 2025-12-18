/**
 * Pilot Card Component
 * Clickable card displaying pilot information with hover effects
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { Pilot } from '../../types/pilot';
import { getStatusBadgeStyle, getStatusDisplayText } from '../../types/pilot';

interface PilotCardProps {
  pilot: Pilot;
}

export function PilotCard({ pilot }: PilotCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/pilots/${pilot.id}`);
  };

  // Format date
  const formattedDate = new Date(pilot.startDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      onClick={handleClick}
      className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 cursor-pointer hover:shadow-xl transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
            {pilot.name}
          </h3>
          <p className="text-sm text-gray-600">{pilot.company}</p>
        </div>
        
        {/* Status Badge */}
        <span
          className={clsx(
            'px-3 py-1 rounded-full text-xs font-medium border',
            getStatusBadgeStyle(pilot.status)
          )}
        >
          {getStatusDisplayText(pilot.status)}
        </span>
      </div>

      {/* Info Grid */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="line-clamp-1">{pilot.location}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Started {formattedDate}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-700">Progress</span>
          <span className="text-xs font-semibold text-blue-600">{pilot.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pilot.progress}%` }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={clsx(
              'h-full rounded-full transition-all',
              pilot.progress >= 80 ? 'bg-green-500' :
              pilot.progress >= 50 ? 'bg-blue-500' :
              pilot.progress >= 25 ? 'bg-yellow-500' :
              'bg-red-500'
            )}
          />
        </div>
      </div>

      {/* Footer - Hover Arrow */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-end text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="mr-1">View Details</span>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </motion.div>
  );
}
