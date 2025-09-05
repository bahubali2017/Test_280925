import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

/**
 * @file Theme toggle component for the Anamnesis Medical AI Assistant
 * @module ThemeToggle
 */

/**
 * Theme toggle component that switches between light and dark mode
 * Uses Moon and Sun icons from lucide-react for the toggle button
 * @returns {JSX.Element} The theme toggle component
 */
export function ThemeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Icon components used in conditional rendering - prevent ESLint unused var warnings
  const IconComponents = { Moon, Sun };

  // Initialize theme based on system preference or stored setting
  useEffect(() => {
    // Check if user has a preference stored
    const storedTheme = localStorage.getItem('theme');
    
    if (storedTheme === 'dark' || 
      (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  /**
   * Toggles between light and dark mode
   */
  const toggleTheme = () => {
    if (isDarkMode) {
      // Switch to light mode
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      // Switch to dark mode
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
      aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDarkMode ? (
        <Sun size={20} className="text-amber-500" aria-hidden="true" />
      ) : (
        <Moon size={20} className="text-primary-900" aria-hidden="true" />
      )}
      <span className="sr-only">{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
    </button>
  );
}