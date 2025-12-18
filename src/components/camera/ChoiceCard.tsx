import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface ChoiceCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  selected: boolean;
  delay?: number;
}

export function ChoiceCard({ icon, title, description, onClick, selected, delay = 0 }: ChoiceCardProps) {
  return (
    <motion.button
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative w-full min-h-48 p-8 rounded-2xl text-white cursor-pointer transition-all duration-300"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        border: selected ? '2px solid currentColor' : '2px solid rgba(255, 255, 255, 0.2)',
        boxShadow: selected ? '0 8px 32px rgba(0, 0, 0, 0.2)' : '0 4px 16px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <div className="text-5xl">{icon}</div>
        <h3 className="text-2xl font-bold">{title}</h3>
        <p className="text-sm opacity-80 max-w-xs">{description}</p>
      </div>
      
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
      )}
    </motion.button>
  );
}
