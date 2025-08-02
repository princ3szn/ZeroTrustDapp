import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the context
export const ThemeContext = createContext();

// Theme Provider Component
export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage for saved preference first
    const savedTheme = localStorage.getItem('darkMode');
    
    // If there's a saved preference, use it
    if (savedTheme !== null) {
      return JSON.parse(savedTheme);
    }
    
    // If no saved preference, check system preference
    return window.matchMedia && 
           window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Effect to apply dark mode and save preference
  useEffect(() => {
    // Apply Bootstrap dark theme
    if (darkMode) {
      document.documentElement.setAttribute('data-bs-theme', 'dark');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.setAttribute('data-bs-theme', 'light');
      document.body.classList.remove('dark-mode');
    }
    
    // Save to localStorage
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Toggle dark mode function
  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for using theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};