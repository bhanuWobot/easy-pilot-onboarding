import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getPilotById } from '../utils/db';
import type { OnboardingConfig } from '../types/onboarding';

export function CustomerWelcomePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [config, setConfig] = useState<OnboardingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadPilot() {
      if (!id) {
        setError(true);
        setLoading(false);
        return;
      }

      try {
        const pilot = await getPilotById(id);
        if (pilot) {
          setConfig(pilot);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error loading pilot:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadPilot();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading your onboarding experience...</p>
        </div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h1>
          <p className="text-gray-600">
            This onboarding link appears to be invalid or has expired. Please contact your representative for a new link.
          </p>
        </div>
      </div>
    );
  }

  const { pilotName, contactPerson, brandColor, welcomeMessage, backgroundImage, fieldToggles } = config;
  const hasBackground = fieldToggles.backgroundImage && backgroundImage;
  const themeColor = (fieldToggles.brandColor && brandColor) || '#3b82f6';

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {hasBackground ? (
        <div className="absolute inset-0">
          <img
            src={backgroundImage}
            alt="Background"
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/70" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50" />
      )}

      {/* Back Button */}
      <div className="absolute top-6 left-6 z-20">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105"
          style={{
            backgroundColor: hasBackground ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.9)',
            color: hasBackground ? '#ffffff' : '#1f2937',
            backdropFilter: 'blur(10px)',
            border: hasBackground ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Back to Dashboard</span>
        </motion.button>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <div className="flex-shrink-0 pt-16 px-8">
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="flex justify-center"
          >
            <div 
              className="w-24 h-24 rounded-2xl flex items-center justify-center shadow-2xl"
              style={{ backgroundColor: themeColor }}
            >
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          </motion.div>
        </div>

        <div className="flex-1 flex items-center justify-center px-8 py-16">
          <div className="max-w-5xl w-full text-center space-y-10">
            {pilotName && (
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
                  Welcome
                </h1>
                <p 
                  className="text-3xl md:text-4xl font-bold"
                  style={{ 
                    color: hasBackground ? 'rgba(255,255,255,0.95)' : '#1f2937',
                    textShadow: hasBackground ? '0 2px 15px rgba(0,0,0,0.4)' : 'none'
                  }}
                >
                  {pilotName}
                </p>
              </motion.div>
            )}

            {fieldToggles.welcomeMessage && welcomeMessage && (
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed"
                style={{ 
                  color: hasBackground ? 'rgba(255,255,255,0.9)' : '#4b5563',
                  textShadow: hasBackground ? '0 1px 3px rgba(0,0,0,0.3)' : 'none'
                }}
              >
                {welcomeMessage}
              </motion.p>
            )}

            {fieldToggles.contactPerson && contactPerson && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="inline-flex items-center gap-4 px-8 py-4 rounded-full"
                style={{ 
                  backgroundColor: hasBackground ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: themeColor }}
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p 
                    className="text-xs font-medium uppercase tracking-wider"
                    style={{ color: hasBackground ? 'rgba(255,255,255,0.7)' : '#6b7280' }}
                  >
                    Your Contact
                  </p>
                  <p 
                    className="text-base font-semibold"
                    style={{ color: hasBackground ? '#ffffff' : '#111827' }}
                  >
                    {contactPerson}
                  </p>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-12 py-5 rounded-xl font-bold text-white shadow-2xl text-xl"
                style={{ backgroundColor: themeColor }}
                onClick={() => navigate(`/camera-details/${id}`)}
              >
                <span className="flex items-center gap-2">
                  Get Started
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </motion.button>
            </motion.div>
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
