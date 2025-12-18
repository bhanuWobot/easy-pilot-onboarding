import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { getPilotById } from '../utils/db';
import type { OnboardingConfig } from '../types/onboarding';

export function SetupPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [config, setConfig] = useState<OnboardingConfig | null>(null);

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

  const { brandColor, backgroundImage, fieldToggles } = config || {};
  const hasBackground = fieldToggles?.backgroundImage && backgroundImage;
  const themeColor = (fieldToggles?.brandColor && brandColor) || '#3b82f6';

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
        <div className="flex-1 flex items-center justify-center px-8 py-16">
          <div className="max-w-3xl w-full text-center space-y-8">
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <h1 
                className="text-7xl md:text-8xl font-black mb-6 tracking-tight"
                style={{ 
                  color: hasBackground ? '#ffffff' : themeColor,
                  textShadow: hasBackground ? '0 4px 30px rgba(0,0,0,0.5)' : 'none'
                }}
              >
                Setup Page
              </h1>
              <p 
                className="text-2xl md:text-3xl"
                style={{ 
                  color: hasBackground ? 'rgba(255,255,255,0.9)' : '#4b5563',
                  textShadow: hasBackground ? '0 2px 15px rgba(0,0,0,0.4)' : 'none'
                }}
              >
                Coming soon...
              </p>
            </motion.div>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-lg"
              style={{ 
                color: hasBackground ? 'rgba(255,255,255,0.8)' : '#6b7280',
                textShadow: hasBackground ? '0 1px 3px rgba(0,0,0,0.3)' : 'none'
              }}
            >
              This is a placeholder for the setup page. The next step in the onboarding flow will be implemented here.
            </motion.p>
          </div>
        </div>

        <div className="flex-shrink-0 pb-10 px-8">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center text-sm"
            style={{ color: hasBackground ? 'rgba(255,255,255,0.6)' : '#9ca3af' }}
          >
            Powered by Wobot AI
          </motion.p>
        </div>
      </div>
    </div>
  );
}
