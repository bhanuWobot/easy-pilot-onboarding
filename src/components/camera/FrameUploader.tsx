import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';
import { MAX_FRAMES } from '../../types/camera';
import type { CameraFrame } from '../../types/camera';

interface FrameUploaderProps {
  frames: CameraFrame[];
  onChange: (frames: CameraFrame[]) => void;
  brandColor: string;
}

export function FrameUploader({ frames, onChange, brandColor }: FrameUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      toast.error(`${file.name}: Invalid file type. Please upload JPG, PNG, or WebP images.`);
      return false;
    }

    if (file.size > maxSize) {
      toast.error(`${file.name}: File too large. Maximum size is 5MB.`);
      return false;
    }

    return true;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const remainingSlots = MAX_FRAMES - frames.length;
    if (remainingSlots === 0) {
      toast.error('Maximum 64 frames reached');
      return;
    }

    const filesToAdd = Array.from(files).slice(0, remainingSlots);
    const validFiles = filesToAdd.filter(validateFile);

    if (validFiles.length === 0) return;

    const newFrames: CameraFrame[] = validFiles.map((file) => ({
      id: nanoid(),
      file,
      preview: URL.createObjectURL(file),
      location: '',
    }));

    onChange([...frames, ...newFrames]);

    if (filesToAdd.length > remainingSlots) {
      toast.error(`Only ${remainingSlots} frames could be added (limit: 64)`);
    } else {
      toast.success(`${validFiles.length} frame${validFiles.length > 1 ? 's' : ''} added`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleLocationChange = (id: string, location: string) => {
    onChange(frames.map((frame) => (frame.id === id ? { ...frame, location } : frame)));
  };

  const handleDelete = (id: string) => {
    const frame = frames.find((f) => f.id === id);
    if (frame) {
      URL.revokeObjectURL(frame.preview);
    }
    onChange(frames.filter((frame) => frame.id !== id));
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full max-w-6xl space-y-6"
    >
      {/* Counter */}
      <div className="flex items-center justify-between">
        <p className="text-white text-lg font-semibold">
          {frames.length} / {MAX_FRAMES} frames uploaded
        </p>
        {frames.length === MAX_FRAMES && (
          <span className="text-yellow-300 text-sm">Maximum reached</span>
        )}
      </div>

      {/* Upload Zone */}
      {frames.length < MAX_FRAMES && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className="relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300"
          style={{
            borderColor: isDragging ? brandColor : 'rgba(255, 255, 255, 0.4)',
            backgroundColor: isDragging ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <svg className="w-16 h-16 mx-auto mb-4 text-white opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-white text-lg font-semibold mb-2">
            Drop camera frames here or click to browse
          </p>
          <p className="text-white opacity-70 text-sm">
            JPG, PNG, or WebP • Max 5MB per file • Up to {MAX_FRAMES - frames.length} more files
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
        </div>
      )}

      {/* Frame Grid */}
      {frames.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence>
            {frames.map((frame, index) => (
              <motion.div
                key={frame.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="relative rounded-xl overflow-hidden"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                {/* Image Preview */}
                <div className="aspect-square relative">
                  <img
                    src={frame.preview}
                    alt={`Frame ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(frame.id)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors duration-200 shadow-lg"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Location Input */}
                <div className="p-3">
                  <input
                    type="text"
                    value={frame.location}
                    onChange={(e) => handleLocationChange(frame.id, e.target.value)}
                    placeholder="e.g., Main entrance, Parking lot"
                    className="w-full px-3 py-2 rounded-lg text-sm bg-white/20 text-white placeholder-white/50 border border-white/30 focus:outline-none focus:ring-2 transition-all duration-200"
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
