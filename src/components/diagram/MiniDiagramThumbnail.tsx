import React from 'react';
import { ProductTypologyId } from '../../types';

interface MiniDiagramThumbnailProps {
  typologyId: ProductTypologyId;
  colorFoil?: string;
}

export const MiniDiagramThumbnail: React.FC<MiniDiagramThumbnailProps> = ({
  typologyId,
  colorFoil = 'white',
}) => {
  const isDoor = typologyId.includes('door');
  const isCasement = typologyId.includes('casement') || typologyId.includes('openable') || typologyId.includes('tilt');
  const isVent = typologyId.includes('louver') || typologyId.includes('vent');
  const isFixed = typologyId.includes('fixed') && !typologyId.includes('sliding');
  const is3Track = typologyId.includes('3track');
  const is4Track = typologyId.includes('4track');

  return (
    <div className="w-14 h-11 rounded bg-slate-50 border border-slate-200 p-0.5 mx-auto flex items-center justify-center shadow-xs">
      <svg className="w-full h-full select-none" viewBox="0 0 34 26" fill="none">
        {/* Outer Frame */}
        <rect
          x="1"
          y="1"
          width="32"
          height="24"
          rx="1"
          fill={colorFoil === 'wooden' ? '#92400e' : colorFoil === 'grey' ? '#334155' : '#ffffff'}
          stroke="#64748b"
          strokeWidth="1.2"
        />

        {/* Louver Ventilator Mini */}
        {isVent && (
          <g>
            <line x1="3" y1="6" x2="31" y2="6" stroke="#475569" strokeWidth="1" />
            <line x1="3" y1="11" x2="31" y2="11" stroke="#475569" strokeWidth="1" />
            <line x1="3" y1="16" x2="31" y2="16" stroke="#475569" strokeWidth="1" />
            <line x1="3" y1="21" x2="31" y2="21" stroke="#475569" strokeWidth="1" />
          </g>
        )}

        {/* Casement / Openable Mini with Swing Triangle */}
        {isCasement && !isVent && (
          <g>
            <rect x="3" y="3" width="28" height="20" rx="1" fill="#dce9ff" stroke="#2563eb" strokeWidth="0.8" />
            <line x1="4" y1="4" x2="30" y2="13" stroke="#004ac6" strokeWidth="1" strokeDasharray="1.5 1.5" />
            <line x1="4" y1="22" x2="30" y2="13" stroke="#004ac6" strokeWidth="1" strokeDasharray="1.5 1.5" />
          </g>
        )}

        {/* Fixed Picture Mini */}
        {isFixed && (
          <g>
            <rect x="3" y="3" width="28" height="20" rx="1" fill="#dce9ff" stroke="#2563eb" strokeWidth="0.8" />
            <line x1="8" y1="6" x2="26" y2="20" stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="2 2" />
          </g>
        )}

        {/* 2-Track Sliding Mini */}
        {!isVent && !isCasement && !isFixed && !is3Track && !is4Track && (
          <g>
            <rect x="3" y="3" width="15" height="20" rx="0.5" fill="#e5eeff" stroke="#64748b" strokeWidth="0.8" />
            <rect x="16" y="3" width="15" height="20" rx="0.5" fill="#bfdbfe" stroke="#004ac6" strokeWidth="1" />
            {isDoor && <line x1="3" y1="23" x2="31" y2="23" stroke="#006242" strokeWidth="1.5" />}
          </g>
        )}

        {/* 3-Track Sliding Mini */}
        {is3Track && (
          <g>
            <rect x="3" y="3" width="10" height="20" rx="0.5" fill="#eff6ff" stroke="#64748b" strokeWidth="0.7" />
            <rect x="12" y="3" width="11" height="20" rx="0.5" fill="#bfdbfe" stroke="#004ac6" strokeWidth="0.8" />
            <rect x="22" y="3" width="9" height="20" rx="0.5" fill="#cbd5e1" stroke="#475569" strokeWidth="0.7" strokeDasharray="1 1" />
          </g>
        )}

        {/* 4-Track Sliding Mini */}
        {is4Track && (
          <g>
            <rect x="3" y="3" width="7.5" height="20" fill="#e5eeff" stroke="#64748b" strokeWidth="0.6" />
            <rect x="10" y="3" width="7.5" height="20" fill="#bfdbfe" stroke="#004ac6" strokeWidth="0.8" />
            <rect x="17" y="3" width="7.5" height="20" fill="#bfdbfe" stroke="#004ac6" strokeWidth="0.8" />
            <rect x="24" y="3" width="7" height="20" fill="#e5eeff" stroke="#64748b" strokeWidth="0.6" />
          </g>
        )}
      </svg>
    </div>
  );
};
