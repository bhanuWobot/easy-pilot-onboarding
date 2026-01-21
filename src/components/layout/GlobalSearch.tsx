import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllPilots } from '../../utils/db';
import { getAllObjectives } from '../../utils/objectiveDb';
import { getAllCameras } from '../../utils/cameraDb';
import { getAllAssets } from '../../utils/assetDb';
import { getAllUsers } from '../../utils/userDb';
import { getAllLocations } from '../../utils/locationDb';
import type { PilotRecord } from '../../types/onboarding';
import type { Objective } from '../../types/objective';
import type { Camera } from '../../types/camera';
import type { Asset } from '../../types/asset';
import type { User } from '../../types/auth';
import type { Location } from '../../types/location';

interface SearchResult {
  id: string;
  type: 'pilot' | 'objective' | 'camera' | 'asset' | 'user' | 'location';
  title: string;
  subtitle: string;
  metadata?: string;
  link: string;
  icon: string;
  iconColor: string;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    const lowerQuery = query.toLowerCase();
    const searchResults: SearchResult[] = [];

    try {
      // Search Pilots
      const pilots = await getAllPilots();
      pilots.forEach((pilot: PilotRecord) => {
        if (
          pilot.name.toLowerCase().includes(lowerQuery) ||
          pilot.company.toLowerCase().includes(lowerQuery) ||
          pilot.contactPerson.toLowerCase().includes(lowerQuery) ||
          pilot.contactEmail.toLowerCase().includes(lowerQuery) ||
          pilot.locationName?.toLowerCase().includes(lowerQuery)
        ) {
          searchResults.push({
            id: pilot.id,
            type: 'pilot',
            title: pilot.name,
            subtitle: pilot.company,
            metadata: `${pilot.status} • ${pilot.locationName || 'No location'}`,
            link: `/pilots/${pilot.id}`,
            icon: '🚀',
            iconColor: 'bg-blue-100 text-blue-600',
          });
        }
      });

      // Search Objectives
      const objectives = await getAllObjectives();
      objectives.forEach((objective: Objective) => {
        if (
          objective.title.toLowerCase().includes(lowerQuery) ||
          objective.description?.toLowerCase().includes(lowerQuery)
        ) {
          const pilot = pilots.find((p: PilotRecord) => p.id === objective.pilotId);
          searchResults.push({
            id: objective.id,
            type: 'objective',
            title: objective.title,
            subtitle: pilot?.name || 'Unknown Pilot',
            metadata: `${objective.status} • ${objective.priority} priority`,
            link: `/objectives/${objective.id}`,
            icon: '🎯',
            iconColor: 'bg-purple-100 text-purple-600',
          });
        }
      });

      // Search Cameras
      const cameras = await getAllCameras();
      cameras.forEach((camera: Camera) => {
        if (
          camera.name.toLowerCase().includes(lowerQuery) ||
          camera.location?.toLowerCase().includes(lowerQuery) ||
          camera.notes?.toLowerCase().includes(lowerQuery)
        ) {
          const pilot = pilots.find((p: PilotRecord) => p.id === camera.pilotId);
          searchResults.push({
            id: camera.id,
            type: 'camera',
            title: camera.name,
            subtitle: pilot?.name || 'Unknown Pilot',
            metadata: `${camera.status} • ${camera.frames.length} frames`,
            link: `/pilots/${camera.pilotId}?tab=locations`,
            icon: '📷',
            iconColor: 'bg-orange-100 text-orange-600',
          });
        }
      });

      // Search Assets
      const assets = await getAllAssets();
      assets.forEach((asset: Asset) => {
        if (
          asset.title.toLowerCase().includes(lowerQuery) ||
          asset.fileName.toLowerCase().includes(lowerQuery) ||
          asset.description?.toLowerCase().includes(lowerQuery)
        ) {
          const pilot = pilots.find((p: PilotRecord) => p.id === asset.pilotId);
          searchResults.push({
            id: asset.id,
            type: 'asset',
            title: asset.title || asset.fileName,
            subtitle: pilot?.name || 'Unknown Pilot',
            metadata: `${asset.category} • ${(asset.fileSize / 1024).toFixed(1)} KB`,
            link: `/pilots/${asset.pilotId}?tab=assets`,
            icon: '📎',
            iconColor: 'bg-green-100 text-green-600',
          });
        }
      });

      // Search Users
      const users = await getAllUsers();
      users.forEach((user: User) => {
        if (
          user.name.toLowerCase().includes(lowerQuery) ||
          user.email.toLowerCase().includes(lowerQuery) ||
          user.role.toLowerCase().includes(lowerQuery)
        ) {
          searchResults.push({
            id: user.id,
            type: 'user',
            title: user.name,
            subtitle: user.email,
            metadata: `${user.role} • ${user.userType}`,
            link: `/users/${user.id}`,
            icon: '👤',
            iconColor: 'bg-indigo-100 text-indigo-600',
          });
        }
      });

      // Search Locations
      const locations = await getAllLocations();
      locations.forEach((location: Location) => {
        if (
          location.name.toLowerCase().includes(lowerQuery) ||
          location.cityRegion.toLowerCase().includes(lowerQuery)
        ) {
          // Find pilot that has this location
          const pilot = pilots.find((p: PilotRecord) => 
            p.locationIds?.includes(location.id)
          );
          searchResults.push({
            id: location.id,
            type: 'location',
            title: location.name,
            subtitle: location.cityRegion,
            metadata: `${location.status} • ${location.cameraCount} cameras`,
            link: pilot ? `/pilots/${pilot.id}?tab=locations` : '/dashboard',
            icon: '📍',
            iconColor: 'bg-red-100 text-red-600',
          });
        }
      });

      setResults(searchResults.slice(0, 50)); // Limit to 50 results
      setSelectedIndex(0);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelectResult(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    navigate(result.link);
    onClose();
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    const labels = {
      pilot: 'Pilot',
      objective: 'Objective',
      camera: 'Camera',
      asset: 'Asset',
      user: 'User',
      location: 'Location',
    };
    return labels[type];
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[600px] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search pilots, objectives, cameras, assets, users..."
                className="w-full pl-12 pr-4 py-3 text-lg border-0 focus:ring-0 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : results.length > 0 ? (
              <div className="p-2">
                {Object.entries(groupedResults).map(([type, typeResults]) => (
                  <div key={type} className="mb-4">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {getTypeLabel(type as SearchResult['type'])}s ({typeResults.length})
                    </div>
                    {typeResults.map((result) => {
                      const globalIndex = results.findIndex((r) => r.id === result.id);
                      return (
                        <button
                          key={result.id}
                          onClick={() => handleSelectResult(result)}
                          className={`w-full flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors ${
                            globalIndex === selectedIndex ? 'bg-blue-50 ring-2 ring-blue-500' : ''
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg ${result.iconColor} flex items-center justify-center text-xl flex-shrink-0`}>
                            {result.icon}
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <div className="font-medium text-gray-900 truncate">{result.title}</div>
                            <div className="text-sm text-gray-600 truncate">{result.subtitle}</div>
                            {result.metadata && (
                              <div className="text-xs text-gray-500 mt-1">{result.metadata}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="hidden sm:inline">View</span>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : searchQuery ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-500 text-center">
                  Try searching for pilots, objectives, cameras, or users
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Search everything</h3>
                <p className="text-gray-500 text-center max-w-sm">
                  Find pilots, objectives, cameras, assets, users, and locations instantly
                </p>
                <div className="mt-6 flex flex-wrap gap-2 justify-center">
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">Pilots</span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">Objectives</span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">Cameras</span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">Assets</span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">Users</span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">Locations</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">↑</kbd>
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">↓</kbd>
                  to navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">Enter</kbd>
                  to select
                </span>
              </div>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">Esc</kbd>
                to close
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
