import { motion } from 'framer-motion';
import { CAMERA_COUNT_OPTIONS } from '../../types/camera';
import type { CameraCount } from '../../types/camera';

interface CameraCountSelectorProps {
  value: CameraCount | null;
  onChange: (value: CameraCount) => void;
  brandColor: string;
}

export function CameraCountSelector({ value, onChange, brandColor }: CameraCountSelectorProps) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full max-w-4xl"
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {CAMERA_COUNT_OPTIONS.map((option, index) => {
          const isSelected = value === option.value;
          
          return (
            <motion.button
              key={option.value}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange(option.value)}
              className="relative p-6 rounded-xl font-semibold transition-all duration-200 flex flex-col items-center justify-center gap-3 min-h-32"
              style={{
                backgroundColor: isSelected ? brandColor : 'rgba(255, 255, 255, 0.2)',
                color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                boxShadow: isSelected ? '0 8px 24px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
              }}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="text-sm">{option.label}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
