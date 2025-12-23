/**
 * ROI Profile Chips
 * Color-coded chips for toggling ROI profile visibility
 * Supports multiple simultaneous selections for comparison
 */

import type { ROIProfile } from '../../types/roi';

interface ROIProfileChipsProps {
  profiles: ROIProfile[];
  onToggleProfile: (profileId: string) => void;
  onShowAll: () => void;
  onHideAll: () => void;
  onDeleteProfile?: (profileId: string) => void;
}

export function ROIProfileChips({
  profiles,
  onToggleProfile,
  onShowAll,
  onHideAll,
  onDeleteProfile,
}: ROIProfileChipsProps) {
  if (profiles.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <svg
          className="mx-auto h-8 w-8 text-gray-400 mb-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
        <p className="text-sm text-gray-600 font-medium">No ROI Profiles Yet</p>
        <p className="text-xs text-gray-500 mt-1">Create a profile to start drawing</p>
      </div>
    );
  }

  const visibleCount = profiles.filter(p => p.visible).length;
  const allVisible = visibleCount === profiles.length;
  const noneVisible = visibleCount === 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">
          ROI Profiles ({visibleCount}/{profiles.length} visible)
        </p>
        <div className="flex gap-2">
          <button
            onClick={onShowAll}
            disabled={allVisible}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Show All
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={onHideAll}
            disabled={noneVisible}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Hide All
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className="group relative inline-flex items-center"
          >
            <button
              onClick={() => onToggleProfile(profile.id)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all transform hover:scale-105 flex items-center gap-2"
              style={{
                backgroundColor: profile.visible ? profile.color : '#F3F4F6',
                color: profile.visible ? '#FFFFFF' : '#6B7280',
                boxShadow: profile.visible
                  ? `0 2px 8px ${profile.color}40`
                  : 'none',
              }}
            >
              <span
                className="w-3 h-3 rounded-full border-2"
                style={{
                  borderColor: profile.visible ? '#FFFFFF' : profile.color,
                  backgroundColor: profile.visible ? 'transparent' : profile.color,
                }}
              />
              <span>{profile.name}</span>
              <span className="text-xs opacity-75">
                ({profile.shapes.length})
              </span>
            </button>

            {onDeleteProfile && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Delete ROI profile "${profile.name}"? This will remove all ${profile.shapes.length} shape(s).`)) {
                    onDeleteProfile(profile.id);
                  }
                }}
                className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-lg"
                title="Delete profile"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <svg
            className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-xs text-blue-700">
            <p className="font-medium">Tip:</p>
            <p className="mt-0.5">
              Toggle multiple profiles to compare different ROI configurations simultaneously.
              Each profile is color-coded for easy identification on the canvas.
            </p>
          </div>
        </div>
      </div> */}
    </div>
  );
}
