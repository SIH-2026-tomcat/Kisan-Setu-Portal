import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilityContextType {
  fontSizeLevel: number; // -1: small (0.875rem), 0: normal (1rem), 1: large (1.125rem), 2: extra large (1.25rem)
  highContrast: boolean;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
  toggleHighContrast: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fontSizeLevel, setFontSizeLevel] = useState<number>(0);
  const [highContrast, setHighContrast] = useState<boolean>(false);

  useEffect(() => {
    const scales = ['0.875rem', '1rem', '1.125rem', '1.25rem'];
    const scaleIndex = fontSizeLevel + 1; // 0 to 3
    document.documentElement.style.setProperty('--text-scale', scales[Math.max(0, Math.min(3, scaleIndex))]);
  }, [fontSizeLevel]);

  useEffect(() => {
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }, [highContrast]);

  const increaseFontSize = () => setFontSizeLevel((prev) => Math.min(prev + 1, 2));
  const decreaseFontSize = () => setFontSizeLevel((prev) => Math.max(prev - 1, -1));
  const resetFontSize = () => setFontSizeLevel(0);
  const toggleHighContrast = () => setHighContrast((prev) => !prev);

  return (
    <AccessibilityContext.Provider
      value={{
        fontSizeLevel,
        highContrast,
        increaseFontSize,
        decreaseFontSize,
        resetFontSize,
        toggleHighContrast,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
