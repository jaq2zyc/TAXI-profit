import React from 'react';

export const WelcomeGraphic: React.FC = () => (
  <svg
    viewBox="0 0 200 150"
    xmlns="http://www.w3.org/2000/svg"
    className="w-48 h-auto"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#1F2937', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#111827', stopOpacity: 1 }} />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* Main container */}
    <rect x="0" y="0" width="200" height="150" rx="10" fill="url(#bgGradient)" />
    <rect x="0" y="0" width="200" height="150" rx="10" fill="transparent" stroke="#374151" strokeWidth="1" />

    {/* Header */}
    <text x="15" y="25" fontFamily="Inter, sans-serif" fontSize="12" fontWeight="bold" fill="#F9FAFB">
      Dashboard
    </text>
    <circle cx="180" cy="20" r="8" fill="#374151" />

    {/* Main stat card */}
    <rect x="15" y="40" width="80" height="50" rx="5" fill="#374151" fillOpacity="0.5" />
    <text x="25" y="55" fontFamily="Inter, sans-serif" fontSize="8" fill="#9CA3AF">
      Zysk/h
    </text>
    <text x="25" y="75" fontFamily="Inter, sans-serif" fontSize="16" fontWeight="bold" fill="#22C55E">
      52.40
    </text>

    {/* Sparkline */}
    <path
      d="M 105 75 C 115 60, 125 85, 135 70 S 155 45, 165 60 S 185 80, 185 80"
      stroke="#10B981"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      filter="url(#glow)"
    />

    {/* Bar chart */}
    <g transform="translate(15, 100)">
      <rect x="0" y="20" width="15" height="10" rx="2" fill="#10B981" fillOpacity="0.4" />
      <rect x="20" y="10" width="15" height="20" rx="2" fill="#10B981" fillOpacity="0.6" />
      <rect x="40" y="5" width="15" height="25" rx="2" fill="#10B981" fillOpacity="0.8" />
      <rect x="60" y="0" width="15" height="30" rx="2" fill="#10B981" filter="url(#glow)" />
      <rect x="80" y="15" width="15" height="15" rx="2" fill="#10B981" fillOpacity="0.5" />
    </g>
  </svg>
);
