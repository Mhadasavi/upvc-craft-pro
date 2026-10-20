import React, { useState } from 'react';
import { MeasurementUnit, OpeningDirection, ProductTypologyId, ProfileFoilColor } from '../../types';
import { CrossCutDetail } from './CrossCutDetail';
import {
  RotateCcw,
  Tag,
  ZoomIn,
  ZoomOut,
  Ruler,
  Layers,
  Eye,
  EyeOff,
} from 'lucide-react';

interface ParametricElevationProps {
  typologyId: ProductTypologyId;
  widthInInches: number;
  heightInInches: number;
  unit: MeasurementUnit;
  trackCount: number;
  panelCount: number;
  openingDirection: OpeningDirection;
  profileBrand: string;
  colorFoil: ProfileFoilColor;
  glassPackage: string;
  hasMesh?: boolean;
  hasRollers?: boolean;
  hasLock?: boolean;
  hasExhaustCutout?: boolean;
}

export const ParametricElevation: React.FC<ParametricElevationProps> = ({
  typologyId,
  widthInInches,
  heightInInches,
  unit,
  trackCount,
  panelCount,
  openingDirection,
  profileBrand,
  colorFoil,
  glassPackage,
  hasMesh = false,
  hasRollers = true,
  hasLock = true,
  hasExhaustCutout = false,
}) => {
  const [activeTab, setActiveTab] = useState<'elevation' | 'cross-cut'>('elevation');
  const [showDimensions, setShowDimensions] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Proportional dimensional math
  const safeW = Math.max(12, widthInInches || 48);
  const safeH = Math.max(12, heightInInches || 60);
  const wMm = Math.round(safeW * 25.4);
  const hMm = Math.round(safeH * 25.4);

  // Compute bounding box in SVG coordinate space (Total Viewbox: 560 x 360)
  const maxAvailableW = 390;
  const maxAvailableH = 230;
  const originX = 100;
  const originY = 70;

  const aspectRatio = safeW / safeH;

  let frameW = maxAvailableW;
  let frameH = maxAvailableH;

  if (aspectRatio > maxAvailableW / maxAvailableH) {
    // Width constrained
    frameW = maxAvailableW;
    frameH = Math.max(120, Math.min(maxAvailableH, maxAvailableW / aspectRatio));
  } else {
    // Height constrained
    frameH = maxAvailableH;
    frameW = Math.max(130, Math.min(maxAvailableW, maxAvailableH * aspectRatio));
  }

  // Center horizontally & vertically inside viewport
  const frameX = originX + (maxAvailableW - frameW) / 2;
  const frameY = originY + (maxAvailableH - frameH) / 2;

  // Profile Color styling
  let profileFill = 'url(#profileWhite)';
  let profileBorder = '#737686';
  let innerFrameFill = '#f8f9ff';

  if (colorFoil === 'wooden') {
    profileFill = 'url(#profileWood)';
    profileBorder = '#59290b';
    innerFrameFill = '#854d0e';
  } else if (colorFoil === 'grey') {
    profileFill = 'url(#profileGrey)';
    profileBorder = '#1e293b';
    innerFrameFill = '#334155';
  }

  // Glass Tint styling
  const isFrosted =
    glassPackage.toLowerCase().includes('frosted') || glassPackage.toLowerCase().includes('pinhead');
  const isTinted =
    glassPackage.toLowerCase().includes('tinted') || glassPackage.toLowerCase().includes('grey');

  let glassFill = 'url(#glassClear)';
  if (isFrosted) glassFill = 'url(#glassFrosted)';
  if (isTinted) glassFill = 'url(#glassTinted)';

  // Determine typology classification
  const isDoor =
    typologyId.includes('door') ||
    typologyId === 'casement-door' ||
    typologyId === 'french-door' ||
    typologyId === 'folding-bifold-door';
  const isSliding = typologyId.includes('sliding');
  const isCasement = typologyId.includes('casement') || typologyId.includes('openable');
  const isTiltTurn = typologyId.includes('tilt');
  const isFixed = typologyId.includes('fixed') && !typologyId.includes('sliding');
  const isLouverVent = typologyId.includes('louver') || typologyId.includes('vent');
  const isCombination = typologyId.includes('combination');
  const isFrench = typologyId === 'french-door';
  const isBifold = typologyId === 'folding-bifold-door';
  const isTopHung = typologyId === 'top-hung-vent';

  // Panels count for sliding
  const effectivePanels =
    panelCount ||
    (typologyId.includes('4track') ? 4 : typologyId.includes('3track') ? 3 : 2);
  const effectiveTracks =
    trackCount ||
    (typologyId.includes('4track') ? 4 : typologyId.includes('3track') ? 3 : 2);

  // Sill and profile thickness
  const outerWallThick = 9;
  const sashBorderThick = 8;
  const innerW = frameW - outerWallThick * 2;
  const innerH = frameH - outerWallThick * 2;
  const innerX = frameX + outerWallThick;
  const innerY = frameY + outerWallThick;

  // Zoom handlers
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(1.6, Math.round((prev + 0.15) * 100) / 100));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(0.65, Math.round((prev - 0.15) * 100) / 100));
  };

  const handleResetView = () => {
    setZoomLevel(1);
    setShowDimensions(true);
    setShowLabels(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5 flex flex-col gap-4">
      {/* Interactive Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
            <Ruler className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Dynamic Parametric Elevation</h3>
              <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Live Vector CAD
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Real-time vector preview scaled to rough opening ({safeW}&quot; × {safeH}&quot; / {wMm} × {hMm} mm)
            </p>
          </div>
        </div>

        {/* View Mode Tabs & Interactive Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Front Elevation vs Cross-Cut View */}
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('elevation')}
              className={`px-3 py-1 rounded transition-all ${
                activeTab === 'elevation'
                  ? 'bg-white text-blue-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              type="button"
            >
              Front Elevation
            </button>
            <button
              onClick={() => setActiveTab('cross-cut')}
              className={`px-3 py-1 rounded transition-all ${
                activeTab === 'cross-cut'
                  ? 'bg-white text-blue-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              type="button"
            >
              Detail Cross-Cut
            </button>
          </div>

          {/* Show/Hide Dimensions Button */}
          <button
            onClick={() => setShowDimensions(!showDimensions)}
            className={`h-8 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all border ${
              showDimensions
                ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
            title="Toggle Overall and Panel Dimensions"
            type="button"
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>{showDimensions ? 'Dimensions: ON' : 'Dimensions: OFF'}</span>
          </button>

          {/* Show/Hide Panel Labels Button */}
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`h-8 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all border ${
              showLabels
                ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
            title="Toggle Panel SASH Labels"
            type="button"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>{showLabels ? 'Labels: ON' : 'Labels: OFF'}</span>
          </button>

          {/* Zoom In & Zoom Out Controls */}
          <div className="inline-flex items-center rounded-lg bg-white border border-slate-200 shadow-2xs p-0.5">
            <button
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.65}
              className="p-1.5 rounded text-slate-600 hover:text-blue-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              title="Zoom Out"
              type="button"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] font-bold text-slate-700 px-2 min-w-11 text-center select-none">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoomLevel >= 1.6}
              className="p-1.5 rounded text-slate-600 hover:text-blue-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              title="Zoom In"
              type="button"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Reset View Button */}
          <button
            onClick={handleResetView}
            className="h-8 px-2.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Reset Zoom and Re-enable All Annotations"
            type="button"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Cross-Cut detail view OR Full Elevation SVG */}
      {activeTab === 'cross-cut' ? (
        <CrossCutDetail profileBrand={profileBrand} series="60mm Multi-Chamber Class A" />
      ) : (
        <div className="relative w-full h-92 bg-slate-50/70 rounded-xl p-3 flex items-center justify-center overflow-hidden border border-slate-200">
          {/* Technical CAD Blueprint Grid Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-60 pointer-events-none"></div>

          {/* Main Dynamic Parametric SVG Viewport */}
          <svg
            className="w-full h-full max-h-84 drop-shadow-sm select-none transition-transform duration-150"
            style={{ transform: `scale(${zoomLevel})` }}
            viewBox="0 0 560 360"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Profile Gradient - White */}
              <linearGradient id="profileWhite" x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#f1f5f9" />
              </linearGradient>

              {/* Profile Gradient - Wooden Golden Oak */}
              <linearGradient id="profileWood" x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#b45309" />
                <stop offset="50%" stopColor="#92400e" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>

              {/* Profile Gradient - Anthracite Grey */}
              <linearGradient id="profileGrey" x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>

              {/* Glass Gradient - Clear Toughened */}
              <linearGradient id="glassClear" x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#dce9ff" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#b4c5ff" stopOpacity="0.5" />
              </linearGradient>

              {/* Glass Gradient - Frosted */}
              <linearGradient id="glassFrosted" x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.8" />
              </linearGradient>

              {/* Glass Gradient - Tinted Reflective */}
              <linearGradient id="glassTinted" x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#64748b" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#334155" stopOpacity="0.9" />
              </linearGradient>

              {/* SS304 Mosquito Mesh Pattern */}
              <pattern id="meshPattern" width="4" height="4" patternUnits="userSpaceOnUse">
                <line x1="0" y1="2" x2="4" y2="2" stroke="#64748b" strokeWidth="0.6" opacity="0.6" />
                <line x1="2" y1="0" x2="2" y2="4" stroke="#64748b" strokeWidth="0.6" opacity="0.6" />
              </pattern>

              {/* Arrow Markers for CAD Dimension Lines */}
              <marker id="cadArrowEnd" markerHeight="6" markerWidth="6" orient="auto" refX="3" refY="3">
                <polygon fill="#004ac6" points="0 0, 6 3, 0 6" />
              </marker>
              <marker id="cadArrowStart" markerHeight="6" markerWidth="6" orient="auto-start-reverse" refX="3" refY="3">
                <polygon fill="#004ac6" points="0 0, 6 3, 0 6" />
              </marker>

              {/* Mini Arrow for Panel Dimensions */}
              <marker id="panelArrowEnd" markerHeight="4" markerWidth="4" orient="auto" refX="2" refY="2">
                <polygon fill="#006242" points="0 0, 4 2, 0 4" />
              </marker>
              <marker id="panelArrowStart" markerHeight="4" markerWidth="4" orient="auto-start-reverse" refX="2" refY="2">
                <polygon fill="#006242" points="0 0, 4 2, 0 4" />
              </marker>
            </defs>

            {/* 1. TOP OVERALL WIDTH DIMENSION ANNOTATION */}
            {showDimensions && (
              <g id="topOverallDimension">
                <line
                  x1={frameX}
                  y1={frameY - 32}
                  x2={frameX + frameW}
                  y2={frameY - 32}
                  stroke="#004ac6"
                  strokeWidth="1.5"
                  markerEnd="url(#cadArrowEnd)"
                  markerStart="url(#cadArrowStart)"
                />
                {/* Extension ticks */}
                <line x1={frameX} y1={frameY - 40} x2={frameX} y2={frameY - 6} stroke="#94a3b8" strokeWidth="1" />
                <line
                  x1={frameX + frameW}
                  y1={frameY - 40}
                  x2={frameX + frameW}
                  y2={frameY - 6}
                  stroke="#94a3b8"
                  strokeWidth="1"
                />
                {/* Overall Width Label pill */}
                <rect
                  x={frameX + frameW / 2 - 65}
                  y={frameY - 44}
                  width="130"
                  height="22"
                  rx="4"
                  fill="#ffffff"
                  stroke="#004ac6"
                  strokeWidth="1.2"
                />
                <text
                  x={frameX + frameW / 2}
                  y={frameY - 29}
                  fill="#004ac6"
                  fontFamily="JetBrains Mono"
                  fontSize="11"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  W: {safeW}&quot; ({wMm} mm)
                </text>
              </g>
            )}

            {/* 2. INDIVIDUAL PANEL WIDTH DIMENSION ANNOTATIONS */}
            {showDimensions && (effectivePanels >= 2 || isFrench || isBifold) && !isFixed && !isLouverVent && (
              <g id="individualPanelDimensions">
                {(() => {
                  const numPanels = isBifold ? 3 : isFrench ? 2 : effectivePanels;
                  const panelInches = (safeW / numPanels).toFixed(1);
                  const panelMm = Math.round((safeW / numPanels) * 25.4);
                  const panelSpanSvg = frameW / numPanels;

                  return Array.from({ length: numPanels }).map((_, pIdx) => {
                    const pStartX = frameX + pIdx * panelSpanSvg;
                    const pEndX = pStartX + panelSpanSvg;
                    const pMidX = (pStartX + pEndX) / 2;
                    const pY = frameY - 12;

                    return (
                      <g key={pIdx}>
                        {/* Panel width dimension segment */}
                        <line
                          x1={pStartX + 2}
                          y1={pY}
                          x2={pEndX - 2}
                          y2={pY}
                          stroke="#006242"
                          strokeWidth="1.2"
                          markerEnd="url(#panelArrowEnd)"
                          markerStart="url(#panelArrowStart)"
                        />
                        <line x1={pStartX} y1={pY - 4} x2={pStartX} y2={pY + 4} stroke="#006242" strokeWidth="1" />
                        <line x1={pEndX} y1={pY - 4} x2={pEndX} y2={pY + 4} stroke="#006242" strokeWidth="1" />

                        {/* Individual Panel Width Label badge */}
                        <rect
                          x={pMidX - 42}
                          y={pY - 10}
                          width="84"
                          height="18"
                          rx="3"
                          fill="#ffffff"
                          stroke="#a7f3d0"
                          strokeWidth="1"
                        />
                        <text
                          x={pMidX}
                          y={pY + 2.5}
                          fill="#006242"
                          fontFamily="JetBrains Mono"
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          P{pIdx + 1}: {panelInches}&quot; ({panelMm})
                        </text>
                      </g>
                    );
                  });
                })()}
              </g>
            )}

            {/* 3. LEFT OVERALL HEIGHT DIMENSION ANNOTATION */}
            {showDimensions && (
              <g id="leftOverallDimension">
                <line
                  x1={frameX - 25}
                  y1={frameY}
                  x2={frameX - 25}
                  y2={frameY + frameH}
                  stroke="#004ac6"
                  strokeWidth="1.5"
                  markerEnd="url(#cadArrowEnd)"
                  markerStart="url(#cadArrowStart)"
                />
                {/* Extension ticks */}
                <line x1={frameX - 35} y1={frameY} x2={frameX - 6} y2={frameY} stroke="#94a3b8" strokeWidth="1" />
                <line
                  x1={frameX - 35}
                  y1={frameY + frameH}
                  x2={frameX - 6}
                  y2={frameY + frameH}
                  stroke="#94a3b8"
                  strokeWidth="1"
                />
                {/* Rotated label pill */}
                <rect
                  x={frameX - 36}
                  y={frameY + frameH / 2 - 50}
                  width="22"
                  height="100"
                  rx="4"
                  fill="#ffffff"
                  stroke="#004ac6"
                  strokeWidth="1.2"
                />
                <text
                  x={frameX - 25}
                  y={frameY + frameH / 2}
                  transform={`rotate(-90 ${frameX - 25} ${frameY + frameH / 2})`}
                  fill="#004ac6"
                  fontFamily="JetBrains Mono"
                  fontSize="11"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  H: {safeH}&quot; ({hMm} mm)
                </text>
              </g>
            )}

            {/* OUTER UPVC MAIN FRAME (Welded Multi-Chamber Outer Box) */}
            <rect
              x={frameX}
              y={frameY}
              width={frameW}
              height={frameH}
              rx="3"
              fill={profileFill}
              stroke={profileBorder}
              strokeWidth="2.5"
            />
            <rect
              x={innerX}
              y={innerY}
              width={innerW}
              height={innerH}
              rx="2"
              fill={innerFrameFill}
              stroke="#cbd5e1"
              strokeWidth="1.2"
            />

            {/* PRODUCT-SPECIFIC INTERNAL ELEVATION DRAWING */}

            {/* 1. SLIDING WINDOWS & DOORS (2-TRACK, 3-TRACK, 4-TRACK) */}
            {isSliding && !isCombination && (
              <g id="slidingSashes">
                {Array.from({ length: effectivePanels }).map((_, idx) => {
                  const sashOverlap = 12;
                  const individualW = (innerW + sashOverlap * (effectivePanels - 1)) / effectivePanels;
                  const sashX = innerX + idx * (individualW - sashOverlap);
                  const sashY = innerY + 3;
                  const sashH = innerH - 6;

                  const isLastPanelMesh =
                    (hasMesh || typologyId.includes('3track')) && idx === effectivePanels - 1;
                  const isActiveSliding =
                    openingDirection === 'slide-right' ? idx === 0 : idx === 1 || idx === effectivePanels - 1;

                  const sashId = `SASH 0${idx + 1}`;
                  const sashLabelText = isLastPanelMesh
                    ? 'SS 304 MESH'
                    : isActiveSliding
                    ? `${sashId} (Active)`
                    : `${sashId} (Fixed)`;

                  return (
                    <g key={idx} id={`sash-${idx}`}>
                      {/* Sash Profile Outer */}
                      <rect
                        x={sashX}
                        y={sashY}
                        width={individualW}
                        height={sashH}
                        rx="2"
                        fill={isLastPanelMesh ? '#f1f5f9' : profileFill}
                        stroke={isActiveSliding ? '#004ac6' : profileBorder}
                        strokeWidth="2"
                      />
                      {/* Glass or Mesh fill */}
                      <rect
                        x={sashX + sashBorderThick}
                        y={sashY + sashBorderThick}
                        width={individualW - sashBorderThick * 2}
                        height={sashH - sashBorderThick * 2}
                        rx="1"
                        fill={isLastPanelMesh ? 'url(#meshPattern)' : glassFill}
                        stroke={isLastPanelMesh ? '#94a3b8' : '#2563eb'}
                        strokeWidth="1"
                      />

                      {/* Glass reflection highlight streaks */}
                      {!isLastPanelMesh && !isFrosted && (
                        <>
                          <line
                            x1={sashX + 16}
                            y1={sashY + 16}
                            x2={sashX + Math.min(individualW - 20, 50)}
                            y2={sashY + Math.min(sashH - 20, 50)}
                            stroke="#ffffff"
                            strokeWidth="2"
                            strokeLinecap="round"
                            opacity="0.8"
                          />
                          <line
                            x1={sashX + 24}
                            y1={sashY + 16}
                            x2={sashX + Math.min(individualW - 20, 40)}
                            y2={sashY + Math.min(sashH - 20, 32)}
                            stroke="#ffffff"
                            strokeWidth="1"
                            strokeLinecap="round"
                            opacity="0.6"
                          />
                        </>
                      )}

                      {/* Roller Wheel indicators at sash bottom */}
                      {hasRollers && (
                        <g>
                          <circle cx={sashX + 16} cy={sashY + sashH - 4} r="2.5" fill="#d97706" />
                          <circle cx={sashX + individualW - 16} cy={sashY + sashH - 4} r="2.5" fill="#d97706" />
                        </g>
                      )}

                      {/* Crescent Lock on Meeting Stile */}
                      {hasLock && idx === 0 && (
                        <g transform={`translate(${sashX + individualW - 5}, ${sashY + sashH / 2 - 14})`}>
                          <rect width="8" height="28" rx="2" fill="#004ac6" />
                          <circle cx="4" cy="14" r="2" fill="#ffffff" />
                        </g>
                      )}

                      {/* Door handle for Sliding Doors */}
                      {isDoor && idx === (openingDirection === 'slide-right' ? 0 : 1) && (
                        <g transform={`translate(${sashX + (openingDirection === 'slide-right' ? individualW - 10 : 6)}, ${sashY + sashH / 2 - 22})`}>
                          <rect width="5" height="44" rx="2.5" fill="#0b1c30" stroke="#cbd5e1" strokeWidth="0.8" />
                          <circle cx="2.5" cy="14" r="1.5" fill="#ffffff" />
                        </g>
                      )}

                      {/* SLIDING ARROWS FOR MOVING PANELS */}
                      {isActiveSliding && (
                        <g transform={`translate(${sashX + individualW / 2 - 38}, ${sashY + sashH - 32})`}>
                          <rect width="76" height="20" rx="4" fill="#004ac6" fillOpacity="0.95" />
                          {openingDirection === 'slide-right' ? (
                            <>
                              <text x="34" y="14" fill="#ffffff" fontFamily="Inter" fontSize="8" fontWeight="bold" textAnchor="middle">
                                SLIDE RIGHT
                              </text>
                              <line x1="56" y1="10" x2="68" y2="10" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                              <polyline points="64,7 68,10 64,13" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </>
                          ) : openingDirection === 'slide-bi' ? (
                            <>
                              <text x="38" y="14" fill="#ffffff" fontFamily="Inter" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                                BI-PARTING
                              </text>
                              <polyline points="10,8 6,10 10,12" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
                              <polyline points="66,8 70,10 66,12" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
                            </>
                          ) : (
                            <>
                              <text x="42" y="14" fill="#ffffff" fontFamily="Inter" fontSize="8" fontWeight="bold" textAnchor="middle">
                                SLIDE LEFT
                              </text>
                              <line x1="8" y1="10" x2="20" y2="10" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                              <polyline points="12,7 8,10 12,13" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </>
                          )}
                        </g>
                      )}

                      {/* Central Label Badge for Sash */}
                      {showLabels && (
                        <g transform={`translate(${sashX + individualW / 2 - 48}, ${sashY + sashH / 2 - 24})`}>
                          <rect
                            width="96"
                            height="44"
                            rx="5"
                            fill="#ffffff"
                            fillOpacity="0.95"
                            stroke={isActiveSliding ? '#004ac6' : '#cbd5e1'}
                            strokeWidth="1.5"
                          />
                          <text
                            x="48"
                            y="16"
                            fill={isActiveSliding ? '#004ac6' : '#0b1c30'}
                            fontFamily="Inter"
                            fontSize="10"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            {sashLabelText}
                          </text>
                          <text
                            x="48"
                            y="29"
                            fill="#565e74"
                            fontFamily="JetBrains Mono"
                            fontSize="8.5"
                            textAnchor="middle"
                          >
                            W: {(safeW / effectivePanels).toFixed(1)}&quot; • {isLastPanelMesh ? 'SS304' : 'Glass'}
                          </text>
                          <text
                            x="48"
                            y="39"
                            fill="#006242"
                            fontFamily="JetBrains Mono"
                            fontSize="7.5"
                            fontWeight="semibold"
                            textAnchor="middle"
                          >
                            Track #{Math.min(idx + 1, effectiveTracks)}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            )}

            {/* 2. CASEMENT OPENABLE WINDOW OR OPEN DOOR WITH HINGE INDICATORS */}
            {(isCasement || typologyId === 'casement-door' || isTopHung) && !isFrench && (
              <g id="casementSash">
                <rect
                  x={innerX + 4}
                  y={innerY + 4}
                  width={innerW - 8}
                  height={innerH - 8}
                  rx="2"
                  fill={profileFill}
                  stroke="#004ac6"
                  strokeWidth="2.5"
                />
                <rect
                  x={innerX + 4 + sashBorderThick}
                  y={innerY + 4 + sashBorderThick}
                  width={innerW - 8 - sashBorderThick * 2}
                  height={innerH - 8 - sashBorderThick * 2}
                  rx="1"
                  fill={glassFill}
                  stroke="#2563eb"
                  strokeWidth="1"
                />

                {/* ISO Fenestration Swing Indicators (Dashed) */}
                {isTopHung ? (
                  // Top hung awning indicator pointing downward to bottom latch
                  <>
                    <line x1={innerX + 8} y1={innerY + 8} x2={innerX + innerW / 2} y2={innerY + innerH - 8} stroke="#004ac6" strokeWidth="2" strokeDasharray="5 3" />
                    <line x1={innerX + innerW - 8} y1={innerY + 8} x2={innerX + innerW / 2} y2={innerY + innerH - 8} stroke="#004ac6" strokeWidth="2" strokeDasharray="5 3" />
                    {/* Top hinges */}
                    <rect x={innerX + 24} y={innerY + 2} width="22" height="4" rx="1.5" fill="#006242" stroke="#ffffff" strokeWidth="0.8" />
                    <rect x={innerX + innerW - 46} y={innerY + 2} width="22" height="4" rx="1.5" fill="#006242" stroke="#ffffff" strokeWidth="0.8" />
                    {/* Bottom Handle */}
                    <rect x={innerX + innerW / 2 - 12} y={innerY + innerH - 12} width="24" height="6" rx="2" fill="#0b1c30" stroke="#cbd5e1" strokeWidth="0.8" />
                  </>
                ) : openingDirection === 'swing-left' ? (
                  // Hinges on right, swing apex pointing left to handle
                  <>
                    <line x1={innerX + innerW - 8} y1={innerY + 6} x2={innerX + 8} y2={innerY + innerH / 2} stroke="#004ac6" strokeWidth="2" strokeDasharray="5 3" />
                    <line x1={innerX + innerW - 8} y1={innerY + innerH - 6} x2={innerX + 8} y2={innerY + innerH / 2} stroke="#004ac6" strokeWidth="2" strokeDasharray="5 3" />
                    {/* Butt Hinges on Right Stile */}
                    <rect x={innerX + innerW - 6} y={innerY + 24} width="5" height="24" rx="2" fill="#006242" stroke="#ffffff" strokeWidth="0.8" />
                    <rect x={innerX + innerW - 6} y={innerY + innerH - 48} width="5" height="24" rx="2" fill="#006242" stroke="#ffffff" strokeWidth="0.8" />
                    {/* Handle on Left */}
                    <g transform={`translate(${innerX + 8}, ${innerY + innerH / 2 - 16})`}>
                      <rect width="6" height="32" rx="2" fill="#0b1c30" stroke="#cbd5e1" strokeWidth="1" />
                      <circle cx="3" cy="10" r="1.5" fill="#ffffff" />
                    </g>
                  </>
                ) : (
                  // Default: Hinges on left, swing apex pointing right to handle
                  <>
                    <line x1={innerX + 8} y1={innerY + 6} x2={innerX + innerW - 8} y2={innerY + innerH / 2} stroke="#004ac6" strokeWidth="2" strokeDasharray="5 3" />
                    <line x1={innerX + 8} y1={innerY + innerH - 6} x2={innerX + innerW - 8} y2={innerY + innerH / 2} stroke="#004ac6" strokeWidth="2" strokeDasharray="5 3" />
                    {/* Butt Hinges on Left Stile */}
                    <rect x={innerX + 1} y={innerY + 24} width="5" height="24" rx="2" fill="#006242" stroke="#ffffff" strokeWidth="0.8" />
                    <rect x={innerX + 1} y={innerY + innerH - 48} width="5" height="24" rx="2" fill="#006242" stroke="#ffffff" strokeWidth="0.8" />
                    {/* Handle on Right */}
                    <g transform={`translate(${innerX + innerW - 14}, ${innerY + innerH / 2 - 16})`}>
                      <rect width="6" height="32" rx="2" fill="#0b1c30" stroke="#cbd5e1" strokeWidth="1" />
                      <circle cx="3" cy="10" r="1.5" fill="#ffffff" />
                    </g>
                  </>
                )}

                {/* Casement Status Badge */}
                {showLabels && (
                  <g transform={`translate(${innerX + innerW / 2 - 55}, ${innerY + innerH / 2 - 20})`}>
                    <rect width="110" height="40" rx="5" fill="#ffffff" fillOpacity="0.95" stroke="#004ac6" strokeWidth="1.5" />
                    <text x="55" y="16" fill="#004ac6" fontFamily="Inter" fontSize="10" fontWeight="bold" textAnchor="middle">
                      {isTopHung ? 'TOP HUNG AWNING' : 'CASEMENT OPENABLE'}
                    </text>
                    <text x="55" y="29" fill="#565e74" fontFamily="JetBrains Mono" fontSize="8.5" textAnchor="middle">
                      {isTopHung ? 'Top Axis Outward' : openingDirection === 'swing-left' ? 'Hinge Right • Open Left' : 'Hinge Left • Open Right'}
                    </text>
                  </g>
                )}
              </g>
            )}

            {/* 3. TILT AND TURN WINDOW WITH DUAL ACTION INDICATORS */}
            {isTiltTurn && (
              <g id="tiltTurnSash">
                <rect
                  x={innerX + 4}
                  y={innerY + 4}
                  width={innerW - 8}
                  height={innerH - 8}
                  rx="2"
                  fill={profileFill}
                  stroke="#004ac6"
                  strokeWidth="2.5"
                />
                <rect
                  x={innerX + 4 + sashBorderThick}
                  y={innerY + 4 + sashBorderThick}
                  width={innerW - 8 - sashBorderThick * 2}
                  height={innerH - 8 - sashBorderThick * 2}
                  rx="1"
                  fill={glassFill}
                  stroke="#2563eb"
                  strokeWidth="1"
                />

                {/* Dual Axis Swing Lines: Side Swing + Bottom Tilt V */}
                <line x1={innerX + 6} y1={innerY + 6} x2={innerX + innerW - 10} y2={innerY + innerH / 2} stroke="#004ac6" strokeWidth="1.8" strokeDasharray="4 3" />
                <line x1={innerX + 6} y1={innerY + innerH - 6} x2={innerX + innerW - 10} y2={innerY + innerH / 2} stroke="#004ac6" strokeWidth="1.8" strokeDasharray="4 3" />
                <line x1={innerX + 8} y1={innerY + innerH - 8} x2={innerX + innerW / 2} y2={innerY + 8} stroke="#006242" strokeWidth="1.8" strokeDasharray="4 2" />
                <line x1={innerX + innerW - 8} y1={innerY + innerH - 8} x2={innerX + innerW / 2} y2={innerY + 8} stroke="#006242" strokeWidth="1.8" strokeDasharray="4 2" />

                {/* Hinges & Dual-Action Espag Handle */}
                <rect x={innerX + 1} y={innerY + 20} width="5" height="24" rx="2" fill="#006242" stroke="#ffffff" strokeWidth="0.8" />
                <rect x={innerX + 1} y={innerY + innerH - 44} width="5" height="24" rx="2" fill="#006242" stroke="#ffffff" strokeWidth="0.8" />

                <g transform={`translate(${innerX + innerW - 14}, ${innerY + innerH / 2 - 16})`}>
                  <rect width="6" height="32" rx="2" fill="#0b1c30" stroke="#cbd5e1" strokeWidth="1" />
                  <circle cx="3" cy="10" r="1.5" fill="#ffffff" />
                </g>

                {showLabels && (
                  <g transform={`translate(${innerX + innerW / 2 - 55}, ${innerY + innerH / 2 - 20})`}>
                    <rect width="110" height="40" rx="5" fill="#ffffff" fillOpacity="0.95" stroke="#004ac6" strokeWidth="1.5" />
                    <text x="55" y="16" fill="#004ac6" fontFamily="Inter" fontSize="10" fontWeight="bold" textAnchor="middle">
                      TILT &amp; TURN SASH
                    </text>
                    <text x="55" y="29" fill="#006242" fontFamily="JetBrains Mono" fontSize="8.5" fontWeight="bold" textAnchor="middle">
                      Dual Action Mechanism
                    </text>
                  </g>
                )}
              </g>
            )}

            {/* 4. FIXED GLAZED FRAME / PARTITION */}
            {(isFixed || typologyId === 'fixed-glass-partition') && (
              <g id="fixedGlazed">
                <rect
                  x={innerX + 2}
                  y={innerY + 2}
                  width={innerW - 4}
                  height={innerH - 4}
                  rx="1"
                  fill={glassFill}
                  stroke="#2563eb"
                  strokeWidth="1.5"
                />

                {/* Center vertical mullion for partitions or large fixed frames */}
                {(typologyId === 'fixed-glass-partition' || safeW > 48) && (
                  <g>
                    <rect
                      x={innerX + innerW / 2 - 6}
                      y={innerY}
                      width="12"
                      height={innerH}
                      fill={profileFill}
                      stroke={profileBorder}
                      strokeWidth="1.5"
                    />
                  </g>
                )}

                {/* Picture Glass Diagonal Reflective Lines */}
                <line x1={innerX + 25} y1={innerY + 20} x2={innerX + innerW - 25} y2={innerY + innerH - 20} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="5 5" opacity="0.6" />
                <line x1={innerX + innerW - 25} y1={innerY + 20} x2={innerX + 25} y2={innerY + innerH - 20} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="5 5" opacity="0.6" />

                {showLabels && (
                  <g transform={`translate(${innerX + innerW / 2 - 45}, ${innerY + innerH / 2 - 16})`}>
                    <rect width="90" height="32" rx="4" fill="#ffffff" fillOpacity="0.92" stroke="#cbd5e1" strokeWidth="1" />
                    <text x="45" y="15" fill="#0b1c30" fontFamily="Inter" fontSize="10" fontWeight="bold" textAnchor="middle">
                      FIXED GLAZED
                    </text>
                    <text x="45" y="26" fill="#64748b" fontFamily="JetBrains Mono" fontSize="8" textAnchor="middle">
                      Picture Section
                    </text>
                  </g>
                )}
              </g>
            )}

            {/* 5. FRENCH DOUBLE DOOR WITH DUAL MEETING SWING INDICATORS */}
            {isFrench && (
              <g id="frenchDoorSashes">
                {/* Left Leaf */}
                <rect x={innerX + 2} y={innerY + 2} width={innerW / 2 - 3} height={innerH - 4} rx="2" fill={profileFill} stroke="#004ac6" strokeWidth="2" />
                <rect x={innerX + 2 + sashBorderThick} y={innerY + 2 + sashBorderThick} width={innerW / 2 - 3 - sashBorderThick * 2} height={innerH - 4 - sashBorderThick * 2} rx="1" fill={glassFill} stroke="#2563eb" strokeWidth="1" />
                {/* Left swing triangle pointing to center */}
                <line x1={innerX + 4} y1={innerY + 4} x2={innerX + innerW / 2 - 5} y2={innerY + innerH / 2} stroke="#004ac6" strokeWidth="1.5" strokeDasharray="3 3" />
                <line x1={innerX + 4} y1={innerY + innerH - 4} x2={innerX + innerW / 2 - 5} y2={innerY + innerH / 2} stroke="#004ac6" strokeWidth="1.5" strokeDasharray="3 3" />
                {/* Outer Left Hinges */}
                <rect x={innerX + 1} y={innerY + 24} width="4" height="24" rx="1.5" fill="#006242" stroke="#ffffff" strokeWidth="0.8" />
                <rect x={innerX + 1} y={innerY + innerH - 48} width="4" height="24" rx="1.5" fill="#006242" stroke="#ffffff" strokeWidth="0.8" />

                {/* Right Leaf */}
                <rect x={innerX + innerW / 2 + 1} y={innerY + 2} width={innerW / 2 - 3} height={innerH - 4} rx="2" fill={profileFill} stroke="#004ac6" strokeWidth="2" />
                <rect x={innerX + innerW / 2 + 1 + sashBorderThick} y={innerY + 2 + sashBorderThick} width={innerW / 2 - 3 - sashBorderThick * 2} height={innerH - 4 - sashBorderThick * 2} rx="1" fill={glassFill} stroke="#2563eb" strokeWidth="1" />
                {/* Right swing triangle pointing to center */}
                <line x1={innerX + innerW - 4} y1={innerY + 4} x2={innerX + innerW / 2 + 3} y2={innerY + innerH / 2} stroke="#004ac6" strokeWidth="1.5" strokeDasharray="3 3" />
                <line x1={innerX + innerW - 4} y1={innerY + innerH - 4} x2={innerX + innerW / 2 + 3} y2={innerY + innerH / 2} stroke="#004ac6" strokeWidth="1.5" strokeDasharray="3 3" />
                {/* Outer Right Hinges */}
                <rect x={innerX + innerW - 5} y={innerY + 24} width="4" height="24" rx="1.5" fill="#006242" stroke="#ffffff" strokeWidth="0.8" />
                <rect x={innerX + innerW - 5} y={innerY + innerH - 48} width="4" height="24" rx="1.5" fill="#006242" stroke="#ffffff" strokeWidth="0.8" />

                {/* Meeting Stile and Twin Lever Handles */}
                <g transform={`translate(${innerX + innerW / 2 - 6}, ${innerY + innerH / 2 - 18})`}>
                  <rect x="0" y="0" width="4" height="36" rx="2" fill="#0b1c30" stroke="#cbd5e1" strokeWidth="0.8" />
                  <rect x="8" y="0" width="4" height="36" rx="2" fill="#0b1c30" stroke="#cbd5e1" strokeWidth="0.8" />
                  <circle cx="2" cy="12" r="1.5" fill="#ffffff" />
                  <circle cx="10" cy="12" r="1.5" fill="#ffffff" />
                </g>

                {showLabels && (
                  <g transform={`translate(${innerX + innerW / 2 - 50}, ${innerY + 30})`}>
                    <rect width="100" height="28" rx="4" fill="#ffffff" fillOpacity="0.94" stroke="#004ac6" strokeWidth="1.2" />
                    <text x="50" y="18" fill="#004ac6" fontFamily="Inter" fontSize="10" fontWeight="bold" textAnchor="middle">
                      FRENCH PAIR
                    </text>
                  </g>
                )}
              </g>
            )}

            {/* 6. FOLDING / BI-FOLD DOOR WITH ACCORDION INDICATORS */}
            {isBifold && (
              <g id="bifoldDoor">
                {Array.from({ length: 3 }).map((_, idx) => {
                  const leafW = (innerW - 6) / 3;
                  const leafX = innerX + 2 + idx * (leafW + 1);
                  return (
                    <g key={idx}>
                      <rect x={leafX} y={innerY + 2} width={leafW} height={innerH - 4} rx="2" fill={profileFill} stroke="#004ac6" strokeWidth="2" />
                      <rect x={leafX + 5} y={innerY + 7} width={leafW - 10} height={innerH - 14} rx="1" fill={glassFill} stroke="#2563eb" strokeWidth="1" />
                      {/* Accordion hinge folding zig-zag indicators */}
                      <path
                        d={`M ${leafX + 10} ${innerY + innerH / 2} L ${leafX + leafW / 2} ${innerY + innerH / 2 - (idx % 2 === 0 ? 15 : -15)} L ${leafX + leafW - 10} ${innerY + innerH / 2}`}
                        fill="none"
                        stroke="#004ac6"
                        strokeWidth="1.8"
                        strokeDasharray="3 3"
                      />
                    </g>
                  );
                })}
                {showLabels && (
                  <g transform={`translate(${innerX + innerW / 2 - 55}, ${innerY + innerH / 2 - 18})`}>
                    <rect width="110" height="36" rx="4" fill="#ffffff" fillOpacity="0.95" stroke="#004ac6" strokeWidth="1.2" />
                    <text x="55" y="16" fill="#004ac6" fontFamily="Inter" fontSize="9.5" fontWeight="bold" textAnchor="middle">
                      3-LEAF BI-FOLD
                    </text>
                    <text x="55" y="28" fill="#006242" fontFamily="JetBrains Mono" fontSize="8" textAnchor="middle">
                      Slide &amp; Fold Track
                    </text>
                  </g>
                )}
              </g>
            )}

            {/* 7. COMBINATION WINDOW */}
            {isCombination && (
              <g id="combinationWin">
                {(() => {
                  const transomY = innerY + innerH * 0.32;
                  const topH = innerH * 0.32;
                  const bottomH = innerH - topH - 10;
                  const bottomY = transomY + 10;

                  return (
                    <>
                      {/* Top Fixed Transom Glass */}
                      <rect x={innerX + 2} y={innerY + 2} width={innerW - 4} height={topH - 4} rx="1" fill={glassFill} stroke="#2563eb" strokeWidth="1" />
                      <text x={innerX + innerW / 2} y={innerY + topH / 2 + 4} fill="#0b1c30" fontFamily="Inter" fontSize="9.5" fontWeight="bold" textAnchor="middle">
                        FIXED TRANSOM ARCH
                      </text>

                      {/* Transom Profile Bar */}
                      <rect x={innerX} y={transomY} width={innerW} height="10" fill={profileFill} stroke={profileBorder} strokeWidth="1.5" />

                      {/* Bottom 2-Track Sliding section */}
                      <g transform={`translate(0, 0)`}>
                        <rect x={innerX + 3} y={bottomY + 2} width={innerW / 2 + 5} height={bottomH - 4} rx="2" fill={profileFill} stroke={profileBorder} strokeWidth="2" />
                        <rect x={innerX + 3 + sashBorderThick} y={bottomY + 2 + sashBorderThick} width={innerW / 2 + 5 - sashBorderThick * 2} height={bottomH - 4 - sashBorderThick * 2} rx="1" fill={glassFill} stroke="#2563eb" strokeWidth="1" />

                        <rect x={innerX + innerW / 2 - 5} y={bottomY + 2} width={innerW / 2 + 2} height={bottomH - 4} rx="2" fill={profileFill} stroke="#004ac6" strokeWidth="2" />
                        <rect x={innerX + innerW / 2 - 5 + sashBorderThick} y={bottomY + 2 + sashBorderThick} width={innerW / 2 + 2 - sashBorderThick * 2} height={bottomH - 4 - sashBorderThick * 2} rx="1" fill={glassFill} stroke="#2563eb" strokeWidth="1" />
                      </g>
                    </>
                  );
                })()}
              </g>
            )}

            {/* 8. UPVC LOUVERED VENTILATOR */}
            {isLouverVent && (
              <g id="louverBlades">
                {Array.from({ length: 5 }).map((_, idx) => {
                  const bladeH = (innerH - 8) / 5;
                  const bladeY = innerY + 4 + idx * bladeH;
                  return (
                    <g key={idx}>
                      <rect
                        x={innerX + 4}
                        y={bladeY}
                        width={innerW - 8}
                        height={bladeH - 3}
                        rx="1"
                        fill="url(#glassFrosted)"
                        stroke="#94a3b8"
                        strokeWidth="1.2"
                      />
                      <line
                        x1={innerX + 10}
                        y1={bladeY + (bladeH - 3) / 2}
                        x2={innerX + innerW - 10}
                        y2={bladeY + (bladeH - 3) / 2}
                        stroke="#64748b"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                      />
                    </g>
                  );
                })}

                {/* Optional Circular Exhaust Fan Provision Ring */}
                {hasExhaustCutout && (
                  <g transform={`translate(${innerX + innerW / 2}, ${innerY + innerH / 2})`}>
                    <circle r={Math.min(32, innerW / 3.5)} fill="#ffffff" fillOpacity="0.9" stroke="#004ac6" strokeWidth="2.5" />
                    <circle r={Math.min(32, innerW / 3.5) - 4} fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />
                    <text y="4" fill="#004ac6" fontFamily="JetBrains Mono" fontSize="8" fontWeight="bold" textAnchor="middle">
                      Ø EXHAUST CUTOUT
                    </text>
                  </g>
                )}

                {showLabels && (
                  <g transform={`translate(${innerX + innerW / 2 - 45}, ${innerY + 14})`}>
                    <rect width="90" height="24" rx="4" fill="#ffffff" fillOpacity="0.95" stroke="#cbd5e1" strokeWidth="1" />
                    <text x="45" y="16" fill="#0b1c30" fontFamily="Inter" fontSize="9" fontWeight="bold" textAnchor="middle">
                      LOUVERED VENT
                    </text>
                  </g>
                )}
              </g>
            )}

            {/* BOTTOM SILL & DRAINAGE WEEP HOLES */}
            <g id="bottomSill">
              <rect
                x={frameX}
                y={frameY + frameH}
                width={frameW}
                height="8"
                rx="1"
                fill={isDoor ? '#94a3b8' : '#dae2fd'}
                stroke="#737686"
                strokeWidth="1"
              />
              {/* Integrated Weep Drain Holes */}
              <circle cx={frameX + frameW * 0.3} cy={frameY + frameH + 4} r="1.5" fill="#006242" />
              <circle cx={frameX + frameW * 0.7} cy={frameY + frameH + 4} r="1.5" fill="#006242" />

              {/* Sill specification sub-label */}
              <text
                x={frameX + frameW / 2}
                y={frameY + frameH + 19}
                fill="#565e74"
                fontFamily="JetBrains Mono"
                fontSize="8.5"
                fontWeight="bold"
                textAnchor="middle"
              >
                {effectiveTracks}-TRACK ANODIZED SILL • INTEGRATED WEEP DRAIN HOLES
              </text>
            </g>
          </svg>
        </div>
      )}

      {/* Technical Quality & Certification Strip below diagram */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col">
          <span className="text-[11px] text-slate-500 uppercase font-semibold">Profile Wall</span>
          <span className="text-xs font-bold text-slate-900 font-mono">2.5mm ±0.2</span>
          <span className="font-mono text-[10px] text-emerald-700 font-semibold">Class A DIN EN 12608</span>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col">
          <span className="text-[11px] text-slate-500 uppercase font-semibold">Chambers</span>
          <span className="text-xs font-bold text-slate-900 font-mono">3-Chamber Heavy</span>
          <span className="font-mono text-[10px] text-blue-700 font-semibold">Thermal U: 1.8 W/m²K</span>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col">
          <span className="text-[11px] text-slate-500 uppercase font-semibold">Steel Core</span>
          <span className="text-xs font-bold text-slate-900 font-mono">1.2mm GI Galvanized</span>
          <span className="font-mono text-[10px] text-slate-500">Anti-sag stiffener</span>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col">
          <span className="text-[11px] text-slate-500 uppercase font-semibold">Wind Load</span>
          <span className="text-xs font-bold text-slate-900 font-mono">Class C3 (160 km/h)</span>
          <span className="font-mono text-[10px] text-emerald-700 font-semibold">Coastal Rated</span>
        </div>
      </div>
    </div>
  );
};
