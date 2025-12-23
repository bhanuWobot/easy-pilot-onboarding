/**
 * Pilot Card Component
 * Clickable card displaying pilot information with hover effects
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { Pilot } from '../../types/pilot';
import type { PilotRecord } from "../../types/onboarding";
import { getStatusBadgeStyle, getStatusDisplayText } from '../../types/pilot';
import { deletePilot } from "../../utils/db";
import toast from "react-hot-toast";

interface PilotCardProps {
  pilot: Pilot | PilotRecord;
  onDelete?: () => void;
}

export function PilotCard({ pilot, onDelete }: PilotCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/pilots/${pilot.id}`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click

    if (!window.confirm(`Are you sure you want to delete "${pilot.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deletePilot(pilot.id);
      toast.success("Pilot deleted successfully");
      if (onDelete) onDelete();
    } catch (error) {
      console.error("Error deleting pilot:", error);
      toast.error("Failed to delete pilot");
    }
  };

  // Format date
  const formattedDate = new Date(pilot.startDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={handleClick}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg hover:border-gray-300 transition-all relative group"
    >
      {/* Delete Button */}
      <button
        onClick={handleDelete}
        className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100 z-10"
        title="Delete pilot"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>

      {/* Card Content */}
      <div className="p-5">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-base font-semibold text-gray-900 line-clamp-2 flex-1">{pilot.name}</h3>
            <span className={clsx("px-2.5 py-0.5 rounded-md text-xs font-medium border shrink-0", getStatusBadgeStyle(pilot.status))}>
              {getStatusDisplayText(pilot.status)}
            </span>
          </div>
          <p className="text-sm text-gray-600 truncate">{pilot.company}</p>
        </div>

        {/* Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{pilot.location}</span>
          </div>

          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>Started {formattedDate}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">Progress</span>
            <span className="text-sm font-semibold text-gray-900">{pilot.progress || 0}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pilot.progress || 0}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className={clsx(
                "h-full rounded-full",
                (pilot.progress || 0) >= 80
                  ? "bg-green-500"
                  : (pilot.progress || 0) >= 50
                  ? "bg-blue-500"
                  : (pilot.progress || 0) >= 25
                  ? "bg-yellow-500"
                  : "bg-gray-400"
              )}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
