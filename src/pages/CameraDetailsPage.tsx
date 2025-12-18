import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getPilotById } from '../utils/db';
import { ChoiceCard } from '../components/camera/ChoiceCard';
import { CameraCountSelector } from '../components/camera/CameraCountSelector';
import { FrameUploader } from '../components/camera/FrameUploader';
import { LocationInput } from '../components/camera/LocationInput';
import { DEFAULT_CAMERA_DETAILS } from '../types/camera';
import type { OnboardingConfig } from '../types/onboarding';
import type { CameraDetails, CameraCount, CameraLocation } from '../types/camera';

export function CameraDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [config, setConfig] = useState<OnboardingConfig | null>(null);
  const [step, setStep] = useState(1);
  const [details, setDetails] = useState<CameraDetails>(() => {
    const saved = localStorage.getItem('cameraDetails');
    return saved ? JSON.parse(saved) : DEFAULT_CAMERA_DETAILS;
  });

  useEffect(() => {
    async function loadPilot() {
      if (!id) {
        toast.error('Invalid pilot ID. Redirecting...');
        navigate('/');
        return;
      }

      try {
        const pilot = await getPilotById(id);
        if (pilot) {
          setConfig(pilot);
        } else {
          toast.error('Pilot not found. Redirecting...');
          navigate('/');
        }
      } catch (err) {
        console.error('Error loading pilot:', err);
        toast.error('Failed to load pilot. Redirecting...');
        navigate('/');
      }
    }

    loadPilot();
  }, [id, navigate]);

  useEffect(() => {
    localStorage.setItem('cameraDetails', JSON.stringify(details));
  }, [details]);

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const { brandColor, backgroundImage, fieldToggles } = config;
  const hasBackground = fieldToggles.backgroundImage && backgroundImage;
  const themeColor = (fieldToggles.brandColor && brandColor) || '#3b82f6';

  const handleBack = () => {
    if (step === 1) {
      navigate('/welcome' + window.location.hash);
    } else {
      setStep(step - 1);
    }
  };

  const handleContinue = () => {
    // Validation
    if (step === 2 && !details.cameraCount) {
      toast.error('Please select a camera count range');
      return;
    }

    if (step === 3 && details.hasCameras === false && details.plannedLocations.length === 0) {
      toast.error('Please add at least one camera location');
      return;
    }

    if (step === 3 && details.hasCameras === false) {
      const emptyLocations = details.plannedLocations.filter((loc) => !loc.label.trim());
      if (emptyLocations.length > 0) {
        toast.error('Please provide labels for all camera locations');
        return;
      }
    }

    if (step === 4 && details.canProvideFrames && details.frames.length > 0) {
      const emptyLocations = details.frames.filter((f) => !f.location.trim());
      if (emptyLocations.length > 0) {
        toast.error('Please provide locations for all uploaded frames');
        return;
      }
    }

    // Navigation logic
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (details.hasCameras === true) {
        setStep(3);
      } else {
        // Planning - go to location input
        setStep(3);
      }
    } else if (step === 3) {
      if (details.hasCameras === false) {
        // Planning users - done, go to setup
        navigate(`/setup/${id}`);
      } else if (details.canProvideFrames === true) {
        setStep(4);
      } else {
        // Can't provide frames - skip to setup
        navigate(`/setup/${id}`);
      }
    } else if (step === 4) {
      navigate(`/setup/${id}`);
    }
  };

  const canContinue = 
    (step === 1 && details.hasCameras !== null) ||
    (step === 2 && details.cameraCount !== null) ||
    (step === 3 && details.hasCameras === false && details.plannedLocations.length > 0) ||
    (step === 3 && details.hasCameras === true && details.canProvideFrames !== null) ||
    (step === 4);

  const totalSteps = details.hasCameras === true ? 4 : 3;

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* Background */}
      {hasBackground ? (
        <div className="absolute inset-0">
          <img
            src={backgroundImage}
            alt="Background"
            className="w-full h-full object-cover"
            style={{ filter: 'blur(8px)' }}
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50" />
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header with Back Button */}
        <div className="flex-shrink-0 pt-8 px-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-8 py-16">
          <div className="max-w-5xl w-full">
            <AnimatePresence mode="wait">
              {/* Step 1: Do you have cameras? */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -100, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  <motion.h1
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-5xl md:text-6xl font-black text-center mb-12"
                    style={{
                      color: hasBackground ? '#ffffff' : themeColor,
                      textShadow: hasBackground ? '0 4px 30px rgba(0,0,0,0.5)' : 'none',
                    }}
                  >
                    Do you have cameras installed?
                  </motion.h1>

                  <div className="grid md:grid-cols-2 gap-6">
                    <ChoiceCard
                      icon="✓"
                      title="Yes, already installed"
                      description="We have cameras set up and ready to connect"
                      onClick={() => setDetails({ ...details, hasCameras: true })}
                      selected={details.hasCameras === true}
                      delay={0.1}
                    />
                    <ChoiceCard
                      icon="📅"
                      title="No, still planning"
                      description="We're planning to install cameras after consulting"
                      onClick={() => setDetails({ ...details, hasCameras: false })}
                      selected={details.hasCameras === false}
                      delay={0.2}
                    />
                  </div>
                </motion.div>
              )}

              {/* Step 2: How many cameras? */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -100, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  <motion.h1
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-5xl md:text-6xl font-black text-center mb-12"
                    style={{
                      color: hasBackground ? '#ffffff' : themeColor,
                      textShadow: hasBackground ? '0 4px 30px rgba(0,0,0,0.5)' : 'none',
                    }}
                  >
                    {details.hasCameras 
                      ? 'How many cameras do you have?' 
                      : 'How many cameras are you planning to install?'}
                  </motion.h1>

                  <div className="flex justify-center">
                    <CameraCountSelector
                      value={details.cameraCount}
                      onChange={(count: CameraCount) => setDetails({ ...details, cameraCount: count })}
                      brandColor={themeColor}
                    />
                  </div>
                </motion.div>
              )}

              {/* Step 3: Can you provide frames? OR Add camera locations */}
              {step === 3 && details.hasCameras === true && (
                <motion.div
                  key="step3-frames"
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -100, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  <motion.h1
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-5xl md:text-6xl font-black text-center mb-12"
                    style={{
                      color: hasBackground ? '#ffffff' : themeColor,
                      textShadow: hasBackground ? '0 4px 30px rgba(0,0,0,0.5)' : 'none',
                    }}
                  >
                    Can you provide camera frames?
                  </motion.h1>

                  <div className="grid md:grid-cols-2 gap-6">
                    <ChoiceCard
                      icon="📸"
                      title="Yes, I can provide"
                      description="I have sample images from my cameras ready to upload"
                      onClick={() => setDetails({ ...details, canProvideFrames: true })}
                      selected={details.canProvideFrames === true}
                      delay={0.1}
                    />
                    <ChoiceCard
                      icon="⏭️"
                      title="No, skip this step"
                      description="I don't have frames available right now"
                      onClick={() => setDetails({ ...details, canProvideFrames: false })}
                      selected={details.canProvideFrames === false}
                      delay={0.2}
                    />
                  </div>
                </motion.div>
              )}

              {/* Step 3: Add camera locations (for planning users) */}
              {step === 3 && details.hasCameras === false && (
                <motion.div
                  key="step3-locations"
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -100, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  <motion.h1
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-5xl md:text-6xl font-black text-center mb-12"
                    style={{
                      color: hasBackground ? '#ffffff' : themeColor,
                      textShadow: hasBackground ? '0 4px 30px rgba(0,0,0,0.5)' : 'none',
                    }}
                  >
                    Where will cameras be located?
                  </motion.h1>

                  <div className="flex justify-center">
                    <LocationInput
                      locations={details.plannedLocations}
                      onChange={(locations: CameraLocation[]) => setDetails({ ...details, plannedLocations: locations })}
                      brandColor={themeColor}
                    />
                  </div>
                </motion.div>
              )}

              {/* Step 4: Upload frames */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -100, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  <motion.h1
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-5xl md:text-6xl font-black text-center mb-12"
                    style={{
                      color: hasBackground ? '#ffffff' : themeColor,
                      textShadow: hasBackground ? '0 4px 30px rgba(0,0,0,0.5)' : 'none',
                    }}
                  >
                    Upload Camera Frames
                  </motion.h1>

                  <div className="flex justify-center">
                    <FrameUploader
                      frames={details.frames}
                      onChange={(frames) => setDetails({ ...details, frames })}
                      brandColor={themeColor}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer with Progress and Continue */}
        <div className="flex-shrink-0 pb-10 px-8">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            {/* Progress Dots */}
            <div className="flex gap-2">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: i + 1 === step ? themeColor : 'rgba(255, 255, 255, 0.3)',
                  }}
                />
              ))}
            </div>

            {/* Continue Button */}
            <motion.button
              whileHover={canContinue ? { scale: 1.05 } : {}}
              whileTap={canContinue ? { scale: 0.95 } : {}}
              onClick={handleContinue}
              disabled={!canContinue}
              className="px-8 py-4 rounded-xl font-bold text-white shadow-xl transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: themeColor }}
            >
              <span className="flex items-center gap-2">
                Continue
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
