import React from 'react';

export const AshokaChakraSVG: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 100 100" className={className} aria-hidden="true" fill="none">
    <circle cx="50" cy="50" r="43" stroke="currentColor" strokeWidth="3.2" />
    <circle cx="50" cy="50" r="6.5" fill="currentColor" />
    {[...Array(24)].map((_, i) => (
      <line
        key={i}
        x1="50"
        y1="50"
        x2="50"
        y2="8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        transform={`rotate(${i * 15} 50 50)`}
      />
    ))}
    {[...Array(24)].map((_, i) => (
      <circle
        key={`outer-${i}`}
        cx="50"
        cy="11"
        r="1.5"
        fill="currentColor"
        transform={`rotate(${i * 15 + 7.5} 50 50)`}
      />
    ))}
  </svg>
);
