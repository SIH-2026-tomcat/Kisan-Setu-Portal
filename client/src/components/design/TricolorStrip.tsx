import React from 'react';

export const TricolorStrip: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-1.5 w-full flex ${className}`} aria-hidden="true">
    <div className="flex-1 bg-india-saffron"></div>
    <div className="flex-1 bg-white"></div>
    <div className="flex-1 bg-india-green"></div>
  </div>
);
