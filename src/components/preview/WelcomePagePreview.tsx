import { motion, AnimatePresence } from 'framer-motion';
import type { OnboardingConfig } from '../../types/onboarding';
import { BrowserFrame } from './BrowserFrame';

interface WelcomePagePreviewProps {
  config: OnboardingConfig;
}

export function WelcomePagePreview({ config }: WelcomePagePreviewProps) {
  const { pilotName, contactPerson, brandColor, welcomeMessage, backgroundImage, fieldToggles } = config;

  const hasBackground = fieldToggles.backgroundImage && backgroundImage;
  const themeColor = (fieldToggles.brandColor && brandColor) || '#3b82f6';

  return (
    <BrowserFrame>
      <div className="relative w-full h-full min-h-[600px] overflow-hidden">
        {/* Background Image or Gradient */}
        {hasBackground ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={backgroundImage}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
              <img
                src={backgroundImage}
                alt="Background"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/70" />
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50" />
        )}

        {/* Content - Full screen layout */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Top section with logo */}
          <div className="flex-shrink-0 pt-12 px-8">
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex justify-center"
            >
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl"
                style={{ backgroundColor: themeColor }}
              >
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
            </motion.div>
          </div>

          {/* Main content - centered */}
          <div className="flex-1 flex items-center justify-center px-8 py-12">
            <div className="max-w-4xl w-full text-center space-y-8">
              {/* Welcome Text */}
              <AnimatePresence mode="wait">
                {pilotName && (
                  <motion.div
                    key={pilotName}
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -30, opacity: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <h1 
                      className="text-6xl md:text-7xl font-black mb-4 tracking-tight"
                      style={{ 
                        color: hasBackground ? '#ffffff' : themeColor,
                        textShadow: hasBackground ? '0 4px 20px rgba(0,0,0,0.4)' : 'none'
                      }}
                    >
                      Welcome
                    </h1>
                    <p 
                      className="text-2xl md:text-3xl font-semibold"
                      style={{ 
                        color: hasBackground ? 'rgba(255,255,255,0.95)' : '#1f2937',
                        textShadow: hasBackground ? '0 2px 10px rgba(0,0,0,0.3)' : 'none'
                      }}
                    >
                      {pilotName}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Welcome Message */}
              <AnimatePresence>
                {fieldToggles.welcomeMessage && welcomeMessage && (
                  <motion.p
                    key={welcomeMessage}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
                    style={{ 
                      color: hasBackground ? 'rgba(255,255,255,0.9)' : '#4b5563',
                      textShadow: hasBackground ? '0 1px 3px rgba(0,0,0,0.3)' : 'none'
                    }}
                  >
                    {welcomeMessage}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Contact Person */}
              <AnimatePresence>
                {fieldToggles.contactPerson && contactPerson && (
                  <motion.div
                    key={contactPerson}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="inline-flex items-center gap-3 px-6 py-3 rounded-full"
                    style={{ 
                      backgroundColor: hasBackground ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${themeColor}` }}
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        className="text-sm font-semibold"
                        style={{ color: hasBackground ? '#ffffff' : '#111827' }}
                      >
                        {contactPerson}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* CTA Button */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-10 py-4 rounded-xl font-bold text-white shadow-2xl text-lg relative overflow-hidden group"
                  style={{ backgroundColor: themeColor }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Get Started
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </motion.button>
              </motion.div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 pb-8 px-8">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-center text-sm"
              style={{ color: hasBackground ? 'rgba(255,255,255,0.6)' : '#9ca3af' }}
            >
              Powered by Wobot AI
            </motion.p>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}
