import React from 'react';

interface CrossCutDetailProps {
  profileBrand: string;
  series: string;
}

export const CrossCutDetail: React.FC<CrossCutDetailProps> = ({ profileBrand, series }) => {
  return (
    <div className="w-full h-80 bg-slate-900 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden border border-slate-700">
      {/* CAD Grid Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>

      <div className="absolute top-3 left-4 flex items-center gap-2">
        <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
          60mm 3-Chamber Extrusion Section
        </span>
        <span className="text-xs text-slate-400 font-mono">Scale 1:1 Engineering Detail</span>
      </div>

      <svg
        className="w-full h-64 max-w-md select-none drop-shadow-lg"
        viewBox="0 0 380 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="metalCore" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="50%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
          <pattern id="hatchHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.4" />
          </pattern>
        </defs>

        {/* Outer Frame UPVC Wall (Multi-Chamber) */}
        <path
          d="M 50 30 L 330 30 L 330 50 L 310 50 L 310 150 L 330 150 L 330 170 L 50 170 L 50 150 L 70 150 L 70 50 L 50 50 Z"
          fill="#1e293b"
          stroke="#38bdf8"
          strokeWidth="2.5"
        />

        {/* Internal Chamber Divider Walls */}
        <line x1="130" y1="50" x2="130" y2="150" stroke="#38bdf8" strokeWidth="2" />
        <line x1="250" y1="50" x2="250" y2="150" stroke="#38bdf8" strokeWidth="2" />
        <line x1="70" y1="90" x2="130" y2="90" stroke="#38bdf8" strokeWidth="1.5" />
        <line x1="250" y1="90" x2="310" y2="90" stroke="#38bdf8" strokeWidth="1.5" />

        {/* Center Reinforcement Chamber with Galvanized Steel Core */}
        <rect
          x="142"
          y="62"
          width="96"
          height="76"
          rx="2"
          fill="url(#metalCore)"
          stroke="#f8fafc"
          strokeWidth="1.5"
        />
        <rect
          x="152"
          y="72"
          width="76"
          height="56"
          rx="1"
          fill="#0f172a"
          stroke="#94a3b8"
          strokeWidth="1"
        />

        {/* Glazing Bead Clip & EPDM Gasket */}
        <path
          d="M 280 20 L 310 20 L 310 50 L 290 50 Z"
          fill="#0284c7"
          stroke="#7dd3fc"
          strokeWidth="1.5"
        />
        {/* Rubber EPDM Gaskets (Black) */}
        <rect x="274" y="22" width="6" height="12" rx="2" fill="#000000" stroke="#475569" strokeWidth="1" />
        <rect x="180" y="24" width="6" height="10" rx="2" fill="#000000" stroke="#475569" strokeWidth="1" />

        {/* Insulated Double Glazed Glass Pane cross-section preview */}
        <rect x="190" y="10" width="80" height="18" fill="url(#hatchHatch)" stroke="#60a5fa" strokeWidth="1.5" rx="1" />
        <text x="230" y="23" fill="#93c5fd" fontSize="9" fontFamily="JetBrains Mono" textAnchor="middle" fontWeight="bold">
          DGU / 5mm Glass
        </text>

        {/* Technical Callout Annotations */}
        {/* Steel core callout */}
        <line x1="190" y1="100" x2="140" y2="185" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="2 2" />
        <circle cx="190" cy="100" r="3" fill="#f59e0b" />
        <text x="135" y="195" fill="#f59e0b" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold" textAnchor="middle">
          1.2mm GI Anti-Sag Stiffener
        </text>

        {/* Drainage Chamber callout */}
        <line x1="100" y1="120" x2="60" y2="20" stroke="#34d399" strokeWidth="1.2" strokeDasharray="2 2" />
        <circle cx="100" cy="120" r="3" fill="#34d399" />
        <text x="60" y="15" fill="#34d399" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold" textAnchor="start">
          Primary Decompression Chamber
        </text>

        {/* Profile wall thickness annotation */}
        <line x1="330" y1="100" x2="365" y2="100" stroke="#cbd5e1" strokeWidth="1" />
        <text x="370" y="103" fill="#e2e8f0" fontSize="9" fontFamily="JetBrains Mono" textAnchor="start">
          2.5mm Wall
        </text>
      </svg>

      <div className="absolute bottom-2 right-4 text-[11px] text-slate-400 font-mono">
        {profileBrand} • {series}
      </div>
    </div>
  );
};
