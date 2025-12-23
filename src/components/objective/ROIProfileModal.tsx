/**
 * ROI Profile Modal
 * Modal dialog for creating new ROI profiles with name input and auto-color assignment
 */

import { useState } from 'react';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { getNextAvailableColor } from '../../types/roi';
import type { ROIProfile } from '../../types/roi';

interface ROIProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  existingProfiles: ROIProfile[];
  maxProfiles: number;
}

export function ROIProfileModal({
  isOpen,
  onClose,
  onSubmit,
  existingProfiles,
  maxProfiles,
}: ROIProfileModalProps) {
  const [profileName, setProfileName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const assignedColor = getNextAvailableColor(existingProfiles);
  const isLimitReached = existingProfiles.length >= maxProfiles;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!profileName.trim()) {
      setError('Profile name is required');
      return;
    }

    if (profileName.trim().length < 2) {
      setError('Profile name must be at least 2 characters');
      return;
    }

    // Check for duplicate names
    const duplicate = existingProfiles.find(
      p => p.name.toLowerCase() === profileName.trim().toLowerCase()
    );
    if (duplicate) {
      setError('A profile with this name already exists');
      return;
    }

    if (isLimitReached) {
      setError(`Maximum ${maxProfiles} profiles allowed per camera`);
      return;
    }

    onSubmit(profileName.trim());
    setProfileName('');
    onClose();
  };

  const handleClose = () => {
    setProfileName('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Create ROI Profile</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {isLimitReached ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-red-600 mt-0.5 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-800">Profile Limit Reached</p>
                  <p className="text-sm text-red-700 mt-1">
                    You have reached the maximum of {maxProfiles} ROI profiles for this camera.
                    Delete an existing profile to create a new one.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  label="Profile Name"
                  placeholder="e.g., planned, setup, execution"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  error={error}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Give your ROI profile a descriptive name (e.g., "Planned Layout", "Current Setup")
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Color
                </label>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm"
                    style={{ backgroundColor: assignedColor }}
                  />
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">Auto-assigned</p>
                    <p className="text-xs">Color will help identify this profile on the canvas</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-blue-600 mt-0.5 mr-2"
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
                    <p className="font-medium mb-1">After creating the profile:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>Use drawing tools to add shapes</li>
                      <li>Click shapes to add comments</li>
                      <li>Toggle visibility using profile chips</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1">
                  Create Profile
                </Button>
                <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                {existingProfiles.length} of {maxProfiles} profiles created
              </p>
            </form>
          )}

          {isLimitReached && (
            <div className="pt-4">
              <Button variant="secondary" onClick={handleClose} className="w-full">
                Close
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
