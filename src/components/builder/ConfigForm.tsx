import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingBuilder } from '../../contexts/OnboardingBuilderContext';
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';
import { Toggle } from '../shared/Toggle';
import type { BackgroundPreset } from '../../types/onboarding';

export function ConfigForm() {
  const { state, dispatch } = useOnboardingBuilder();
  const { config } = state;
  const [presets, setPresets] = useState<BackgroundPreset[]>([]);
  const [loadingPresets, setLoadingPresets] = useState(true);

  // Load background presets
  useEffect(() => {
    fetch('/db/background-presets.json')
      .then((res) => res.json())
      .then((data) => {
        setPresets(data.presets);
        // Set default background if not already set
        if (!config.backgroundImage && data.presets.length > 0) {
          dispatch({
            type: 'UPDATE_CONFIG',
            payload: { backgroundImage: data.presets[0].imageUrl },
          });
        }
      })
      .catch((error) => console.error('Error loading presets:', error))
      .finally(() => setLoadingPresets(false));
  }, []);

  const handleInputChange = (field: keyof typeof config, value: string) => {
    dispatch({
      type: 'UPDATE_CONFIG',
      payload: { [field]: value },
    });
  };

  const handleToggle = (field: keyof typeof config.fieldToggles) => {
    dispatch({ type: 'TOGGLE_FIELD', field });
  };

  return (
    <div className="space-y-6">
      {/* Pilot/Company Name - Always visible and required */}
      <div>
        <Input
          label="Pilot/Company Name"
          placeholder="Enter company or pilot name"
          value={config.pilotName}
          onChange={(e) => handleInputChange('pilotName', e.target.value)}
          required
        />
      </div>

      {/* Contact Person */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Toggle
            enabled={config.fieldToggles.contactPerson}
            onChange={() => handleToggle('contactPerson')}
            label="Contact Person"
          />
        </div>
        <AnimatePresence>
          {config.fieldToggles.contactPerson && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <Input
                placeholder="Enter contact person name"
                value={config.contactPerson}
                onChange={(e) => handleInputChange('contactPerson', e.target.value)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Customer Business Details - Always visible, not toggleable */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Customer Business Details
        </label>
        <textarea
          placeholder="Describe the customer's business (e.g., restaurant, office, retail store, construction site)..."
          value={config.customerBusinessDetails}
          onChange={(e) => handleInputChange('customerBusinessDetails', e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        />
        <p className="text-xs text-gray-500 mt-1">
          This information will be used for AI background image generation only (not visible in preview)
        </p>
      </div>

      {/* Brand Color */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Toggle
            enabled={config.fieldToggles.brandColor}
            onChange={() => handleToggle('brandColor')}
            label="Brand Color"
          />
        </div>
        <AnimatePresence>
          {config.fieldToggles.brandColor && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={config.brandColor || '#3b82f6'}
                  onChange={(e) => handleInputChange('brandColor', e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  placeholder="#3b82f6"
                  value={config.brandColor}
                  onChange={(e) => handleInputChange('brandColor', e.target.value)}
                  className="flex-1"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Welcome Message */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Toggle
            enabled={config.fieldToggles.welcomeMessage}
            onChange={() => handleToggle('welcomeMessage')}
            label="Welcome Message"
          />
        </div>
        <AnimatePresence>
          {config.fieldToggles.welcomeMessage && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <textarea
                placeholder="Enter a welcome message for your customers"
                value={config.welcomeMessage}
                onChange={(e) => handleInputChange('welcomeMessage', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Background Image */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Toggle
            enabled={config.fieldToggles.backgroundImage}
            onChange={() => handleToggle('backgroundImage')}
            label="Background Image"
          />
        </div>
        <AnimatePresence>
          {config.fieldToggles.backgroundImage && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden space-y-3"
            >
              {loadingPresets ? (
                <div className="text-sm text-gray-500">Loading presets...</div>
              ) : (
                <>
                  <select
                    value={config.backgroundImage}
                    onChange={(e) => handleInputChange('backgroundImage', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Select a preset background</option>
                    {presets.map((preset) => (
                      <option key={preset.id} value={preset.imageUrl}>
                        {preset.name}
                      </option>
                    ))}
                  </select>

                  {/* AI Generate Button - Placeholder */}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => alert('AI Image generation coming soon!')}
                  >
                    ✨ Generate with AI
                  </Button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
