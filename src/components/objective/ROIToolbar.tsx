/**
 * ROI Toolbar
 * Drawing tool selection toolbar for ROI canvas
 * Includes: select, rectangle, circle, polygon, line, arrow, delete
 */

import type { DrawingTool } from './ROICanvas';
import { ROI_COLORS, type ROIColor } from '../../types/roi';

interface ROIToolbarProps {
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  selectedColor: string;
  onColorChange: (color: ROIColor) => void;
  onDelete?: () => void;
  hasSelection: boolean;
  disabled?: boolean;
}

interface Tool {
  id: DrawingTool;
  name: string;
  icon: React.ReactElement;
  description: string;
}

const tools: Tool[] = [
  {
    id: 'select',
    name: 'Select',
    description: 'Select and edit shapes',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
        />
      </svg>
    ),
  },
  {
    id: 'rectangle',
    name: 'Rectangle',
    description: 'Draw rectangular regions',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z"
        />
      </svg>
    ),
  },
  {
    id: 'circle',
    name: 'Circle',
    description: 'Draw circular regions',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <circle cx="12" cy="12" r="8" strokeWidth={2} />
      </svg>
    ),
  },
  {
    id: 'polygon',
    name: 'Polygon',
    description: 'Draw custom polygons (click to add points)',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 3l14 9-14 9V3z"
        />
      </svg>
    ),
  },
  {
    id: 'line',
    name: 'Line',
    description: 'Draw straight lines',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 19L19 5"
        />
      </svg>
    ),
  },
  {
    id: 'arrow',
    name: 'Arrow',
    description: 'Draw directional arrows',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M14 5l7 7m0 0l-7 7m7-7H3"
        />
      </svg>
    ),
  },
];

export function ROIToolbar({
  activeTool,
  onToolChange,
  selectedColor,
  onColorChange,
  onDelete,
  hasSelection,
  disabled = false,
}: ROIToolbarProps) {
  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-3">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Drawing Tools - Compact Row */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-700">Tools:</span>
          <div className="flex gap-1">
            {tools.map((tool) => {
              const isActive = activeTool === tool.id;
              const isDisabled = disabled;

              return (
                <button
                  key={tool.id}
                  onClick={() => !isDisabled && onToolChange(tool.id)}
                  disabled={isDisabled}
                  className={`
                    group relative p-2 rounded transition-all border
                    ${
                      isActive
                        ? 'bg-blue-500 border-blue-600 text-white'
                        : 'bg-white border-gray-300 text-gray-600 hover:border-blue-400 hover:bg-blue-50'
                    }
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                  title={tool.name}
                >
                  <div className={isActive ? 'text-white' : 'text-gray-600 group-hover:text-blue-600'}>
                    {tool.icon}
                  </div>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
                    {tool.name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Color Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-700">Color:</span>
          <div className="relative">
            <select
              value={selectedColor}
              onChange={(e) => !disabled && onColorChange(e.target.value as ROIColor)}
              disabled={disabled}
              className="appearance-none pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style={{ 
                backgroundColor: 'white',
              }}
            >
              {ROI_COLORS.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
            {/* Color preview circle */}
            <div 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-sm pointer-events-none"
              style={{ backgroundColor: selectedColor }}
            />
            {/* Dropdown arrow */}
            <svg className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Action Buttons */}
        {hasSelection && onDelete && (
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onDelete}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors flex items-center gap-1"
              title="Delete selected shape"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Info Messages */}
      {activeTool === 'polygon' && (
        <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
          <p className="text-xs text-yellow-800">
            <strong>Polygon mode:</strong> Click to add points. Click near the first point or double-click to close.
          </p>
        </div>
      )}

      {disabled && (
        <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-2">
          <p className="text-xs text-gray-600 text-center">
            Create a profile first to start drawing
          </p>
        </div>
      )}
    </div>
  );
}
