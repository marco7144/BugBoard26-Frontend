import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

/**
 * Pulsante per alternare tra Light Mode e Dark Mode.
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`btn btn-secondary btn-icon ${className}`}
      title={isDarkMode ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
      aria-label="Alterna tema chiaro/scuro"
    >
      {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};
