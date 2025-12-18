import { motion } from 'framer-motion';
import clsx from 'clsx';

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Toggle({ enabled, onChange, label, disabled = false }: ToggleProps) {
  return (
    <div className="flex items-center gap-3">
      {label && (
        <span className="text-sm font-medium text-gray-700">{label}</span>
      )}
      <button
        type="button"
        onClick={() => !disabled && onChange(!enabled)}
        disabled={disabled}
        className={clsx(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          enabled ? 'bg-blue-600' : 'bg-gray-300'
        )}
        aria-pressed={enabled}
      >
        <motion.span
          layout
          transition={{
            type: 'spring',
            stiffness: 700,
            damping: 30,
          }}
          className={clsx(
            'inline-block h-4 w-4 rounded-full bg-white shadow-lg',
            enabled ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  );
}
