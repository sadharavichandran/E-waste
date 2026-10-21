import React from 'react';

export const AuthIllustration: React.FC = () => {
  return (
    <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
      {/* Decorative background glow circles */}
      <div className="absolute inset-0 bg-emerald-500/15 rounded-full blur-3xl animate-pulse" />
      <div className="absolute inset-8 bg-teal-400/10 rounded-full blur-2xl" />

      {/* Modern Circular Economy SVG Illustration */}
      <svg
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 drop-shadow-2xl"
      >
        {/* Subtle background circular tracks */}
        <circle
          cx="200"
          cy="200"
          r="150"
          stroke="#10b981"
          strokeWidth="1.5"
          strokeDasharray="6 6"
          strokeOpacity="0.3"
        />
        <circle
          cx="200"
          cy="200"
          r="115"
          stroke="#34d399"
          strokeWidth="1"
          strokeOpacity="0.25"
        />

        {/* Central Core: Circular Loop Shield */}
        <circle
          cx="200"
          cy="200"
          r="78"
          fill="url(#coreGradient)"
          stroke="#10b981"
          strokeWidth="2.5"
          strokeOpacity="0.6"
        />

        {/* Motherboard / Silicon circuit traces merging into organic leaf vines */}
        <path
          d="M 120 200 L 160 200 L 175 185 L 190 185"
          stroke="#34d399"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.7"
        />
        <circle cx="120" cy="200" r="3.5" fill="#34d399" />
        <circle cx="175" cy="185" r="2.5" fill="#34d399" />

        <path
          d="M 280 200 L 240 200 L 225 215 L 210 215"
          stroke="#34d399"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.7"
        />
        <circle cx="280" cy="200" r="3.5" fill="#34d399" />
        <circle cx="225" cy="215" r="2.5" fill="#34d399" />

        {/* Central Organic Leaf / Recycling Icon */}
        <g transform="translate(170, 168) scale(1.05)">
          <path
            d="M 28 5 C 45 15, 52 38, 48 55 C 32 58, 12 48, 6 32 C 4 20, 14 8, 28 5 Z"
            fill="url(#leafGradient)"
            stroke="#6ee7b7"
            strokeWidth="1.5"
          />
          <path
            d="M 12 45 C 22 35, 32 25, 42 12"
            stroke="#064e3b"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Recycling continuous loop arrow */}
          <path
            d="M 8 28 C 4 36, 12 48, 22 52 C 34 54, 46 48, 50 38"
            stroke="#a7f3d0"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="3 3"
          />
        </g>

        {/* Orbital Node 1: Mobile Phone (Top Left) */}
        <g transform="translate(100, 90)">
          <rect
            x="0"
            y="0"
            width="34"
            height="56"
            rx="7"
            fill="#064e3b"
            stroke="#34d399"
            strokeWidth="2"
          />
          <rect x="3" y="6" width="28" height="40" rx="3" fill="#022c22" />
          <circle cx="17" cy="51" r="2" fill="#6ee7b7" />
          <line x1="13" y1="3" x2="21" y2="3" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        {/* Orbital Node 2: Laptop (Top Right) */}
        <g transform="translate(255, 95)">
          <rect
            x="6"
            y="0"
            width="44"
            height="30"
            rx="4"
            fill="#064e3b"
            stroke="#34d399"
            strokeWidth="1.8"
          />
          <rect x="9" y="3" width="38" height="22" rx="2" fill="#022c22" />
          {/* Keyboard base */}
          <path
            d="M 0 32 L 56 32 L 52 38 L 4 38 Z"
            fill="#047857"
            stroke="#34d399"
            strokeWidth="1.5"
          />
        </g>

        {/* Orbital Node 3: Lithium Battery / Microchip (Bottom Right) */}
        <g transform="translate(260, 245)">
          <rect
            x="0"
            y="5"
            width="36"
            height="46"
            rx="5"
            fill="#064e3b"
            stroke="#10b981"
            strokeWidth="2"
          />
          {/* Terminals */}
          <rect x="8" y="0" width="8" height="5" rx="1.5" fill="#f59e0b" />
          <rect x="20" y="0" width="8" height="5" rx="1.5" fill="#94a3b8" />
          {/* Lightning bolt recovery symbol */}
          <path
            d="M 20 16 L 14 26 L 19 26 L 16 38 L 24 24 L 19 24 Z"
            fill="#34d399"
          />
        </g>

        {/* Orbital Node 4: Recovered Precious Gold & Copper Reclaiming (Bottom Left) */}
        <g transform="translate(100, 245)">
          <circle cx="20" cy="20" r="18" fill="#064e3b" stroke="#f59e0b" strokeWidth="2" />
          {/* Rare earth ingot / gold bar icon */}
          <path
            d="M 10 24 L 16 14 L 28 14 L 32 24 Z"
            fill="#f59e0b"
            stroke="#fef3c7"
            strokeWidth="1"
          />
          <text x="21" y="22" fontSize="7" fontWeight="bold" fill="#78350f" textAnchor="middle">
            Au
          </text>
        </g>

        {/* Curving green flow arrows connecting all 4 nodes in a closed circular loop */}
        {/* Top Arc: Phone -> Laptop */}
        <path
          d="M 140 105 C 175 80, 220 80, 250 105"
          stroke="url(#arcGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <polygon points="255,108 245,103 247,112" fill="#34d399" />

        {/* Right Arc: Laptop -> Battery */}
        <path
          d="M 290 140 C 315 170, 315 215, 290 245"
          stroke="url(#arcGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <polygon points="287,250 286,239 295,244" fill="#34d399" />

        {/* Bottom Arc: Battery -> Precious Metals */}
        <path
          d="M 260 280 C 225 305, 175 305, 140 280"
          stroke="url(#arcGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <polygon points="135,277 145,282 143,273" fill="#34d399" />

        {/* Left Arc: Precious Metals -> Phone */}
        <path
          d="M 110 240 C 85 210, 85 170, 110 140"
          stroke="url(#arcGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <polygon points="113,135 114,146 105,141" fill="#34d399" />

        {/* Gradients */}
        <defs>
          <radialGradient id="coreGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#065f46" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#022c22" stopOpacity="0.95" />
          </radialGradient>
          <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#6ee7b7" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
