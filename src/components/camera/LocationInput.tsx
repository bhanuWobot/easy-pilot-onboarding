import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { nanoid } from 'nanoid';
import type { CameraLocation } from '../../types/camera';

interface LocationInputProps {
  locations: CameraLocation[];
  onChange: (locations: CameraLocation[]) => void;
  brandColor: string;
  maxLocations?: number;
}

export function LocationInput({ locations, onChange, brandColor, maxLocations = 64 }: LocationInputProps) {
  const [newLocation, setNewLocation] = useState('');

  const handleAdd = () => {
    if (!newLocation.trim()) return;
    if (locations.length >= maxLocations) return;

    const location: CameraLocation = {
      id: nanoid(),
      label: newLocation.trim(),
    };

    onChange([...locations, location]);
    setNewLocation('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleDelete = (id: string) => {
    onChange(locations.filter((loc) => loc.id !== id));
  };

  const handleUpdate = (id: string, label: string) => {
    onChange(locations.map((loc) => (loc.id === id ? { ...loc, label } : loc)));
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full max-w-4xl space-y-6"
    >
      {/* Counter */}
      <div className="flex items-center justify-between">
        <p className="text-white text-lg font-semibold">
          {locations.length} location{locations.length !== 1 ? 's' : ''} added
        </p>
        {locations.length >= maxLocations && (
          <span className="text-yellow-300 text-sm">Maximum reached</span>
        )}
      </div>

      {/* Add Location Input */}
      {locations.length < maxLocations && (
        <div className="flex gap-3">
          <input
            type="text"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., Main entrance, Parking lot, Reception..."
            className="flex-1 px-4 py-3 rounded-xl text-white placeholder-white/50 border-2 border-white/30 focus:outline-none focus:border-white/60 transition-all duration-200"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
            }}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAdd}
            disabled={!newLocation.trim()}
            className="px-6 py-3 rounded-xl font-bold text-white transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: brandColor }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </motion.button>
        </div>
      )}

      {/* Locations List */}
      {locations.length > 0 && (
        <div className="space-y-3">
          <AnimatePresence>
            {locations.map((location, index) => (
              <motion.div
                key={location.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="flex items-center gap-3 p-4 rounded-xl"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                {/* Location Number */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: brandColor }}
                >
                  {index + 1}
                </div>

                {/* Location Input */}
                <input
                  type="text"
                  value={location.label}
                  onChange={(e) => handleUpdate(location.id, e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg text-white bg-white/10 border border-white/20 focus:outline-none focus:border-white/40 transition-all duration-200"
                  placeholder="Camera location"
                />

                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(location.id)}
                  className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors duration-200 flex-shrink-0"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Helper Text */}
      <p className="text-white/70 text-sm text-center">
        Add locations where cameras will be installed. Press Enter or click + to add.
      </p>
    </motion.div>
  );
}
