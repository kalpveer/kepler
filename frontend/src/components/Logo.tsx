import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => {
  return (
    <svg 
      className={className} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
      <circle cx="50" cy="50" r="30" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
      
      {/* Abstract Orbit Curves */}
      <path
        d="M20 50 C20 20, 80 20, 80 50 C80 80, 20 80, 20 50"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        transform="rotate(30 50 50)"
      />
      <path
        d="M15 50 C15 10, 85 10, 85 50 C85 90, 15 90, 15 50"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.6"
        strokeLinecap="round"
        fill="none"
        transform="rotate(-40 50 50)"
      />
      
      {/* Central Core */}
      <circle cx="50" cy="50" r="8" fill="currentColor" />
      
      {/* Data Node Accent */}
      <circle cx="75" cy="27" r="3" fill="currentColor" />
      <circle cx="23" cy="65" r="2.5" fill="currentColor" />
    </svg>
  );
};
