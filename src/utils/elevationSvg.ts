import React from 'react';
import { QuotationItem } from '../types';

/**
 * Generates an SVG string of the UPVC window/door elevation with proportional dimensions and hardware annotations.
 * Self-contained and usable in standalone printable HTML documents without React dependencies.
 */
export function generateElevationSvgString(item: QuotationItem): string {
  const safeW = Math.max(12, item.widthInInches || item.rawWidth || 48);
  const safeH = Math.max(12, item.heightInInches || item.rawHeight || 60);

  const typologyId = (item.typologyId || '').toLowerCase();
  const colorFoil = item.colorFoil || 'white';

  const isDoor = typologyId.includes('door');
  const isCasement =
    typologyId.includes('casement') ||
    typologyId.includes('openable') ||
    typologyId.includes('tilt');
  const isVent = typologyId.includes('louver') || typologyId.includes('vent');
  const isFixed = typologyId.includes('fixed') && !typologyId.includes('sliding');
  const is3Track = typologyId.includes('3track');
  const is4Track = typologyId.includes('4track');

  // SVG canvas setup (Total ViewBox: 180 x 130)
  // Dimensions layout:
  // Top: width annotation (pill + dimension line with boundary ticks)
  // Right: height annotation (pill + dimension line with boundary ticks)
  const maxW = 105;
  const maxH = 80;
  const cx = 68;
  const cy = 72;

  const aspectRatio = safeW / safeH;
  let w = maxW;
  let h = maxH;

  if (aspectRatio > maxW / maxH) {
    w = maxW;
    h = Math.max(34, Math.min(maxH, Math.round(maxW / aspectRatio)));
  } else {
    h = maxH;
    w = Math.max(34, Math.min(maxW, Math.round(maxH * aspectRatio)));
  }

  const x0 = Math.round(cx - w / 2);
  const y0 = Math.round(cy - h / 2);
  const border = Math.max(3, Math.min(5, Math.round(w * 0.05)));

  // Profile Colors
  let frameFill = '#f8fafc';
  let frameStroke = '#334155';
  let sashFill = '#eff6ff';
  let sashStroke = '#2563eb';

  if (colorFoil === 'wooden') {
    frameFill = '#fef3c7';
    frameStroke = '#78350f';
    sashFill = '#fde68a';
    sashStroke = '#92400e';
  } else if (colorFoil === 'grey') {
    frameFill = '#f1f5f9';
    frameStroke = '#1e293b';
    sashFill = '#cbd5e1';
    sashStroke = '#334155';
  }

  // Inner elements based on typology
  let innerHtml = '';

  if (isVent) {
    // Louver blades
    const bladeStep = Math.max(7, Math.round((h - 2 * border) / 5));
    let lines = '';
    for (let ly = y0 + border + bladeStep; ly < y0 + h - border; ly += bladeStep) {
      lines += `<line x1="${x0 + border}" y1="${ly}" x2="${x0 + w - border}" y2="${ly}" stroke="#64748b" stroke-width="1.3" />`;
    }
    const exhaustCircle = item.accessories?.exhaustFanCutout
      ? `<circle cx="${x0 + w / 2}" cy="${y0 + h / 2}" r="${Math.min(w, h) * 0.22}" fill="#ffffff" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="2.5 2"/>`
      : '';
    innerHtml = `<rect x="${x0 + border}" y="${y0 + border}" width="${w - 2 * border}" height="${h - 2 * border}" fill="#f8fafc" />${lines}${exhaustCircle}`;
  } else if (isCasement) {
    // Casement sash with swing dashes & handle
    innerHtml = `
      <rect x="${x0 + border}" y="${y0 + border}" width="${w - 2 * border}" height="${h - 2 * border}" fill="${sashFill}" stroke="${sashStroke}" stroke-width="1.2" />
      <polyline points="${x0 + border + 2},${y0 + border + 2} ${x0 + w - border - 2},${y0 + h / 2} ${x0 + border + 2},${y0 + h - border - 2}" fill="none" stroke="#2563eb" stroke-width="1.1" stroke-dasharray="3 2" />
      <circle cx="${x0 + w - border - 5}" cy="${y0 + h / 2}" r="2" fill="#0f172a" />
      <line x1="${x0 + border + 5}" y1="${y0 + border + 6}" x2="${x0 + border + 16}" y2="${y0 + border + 20}" stroke="#93c5fd" stroke-width="1.5" stroke-linecap="round" />
    `;
  } else if (isFixed) {
    // Fixed Picture glazing with highlight reflection lines
    innerHtml = `
      <rect x="${x0 + border}" y="${y0 + border}" width="${w - 2 * border}" height="${h - 2 * border}" fill="#f0f9ff" stroke="#94a3b8" stroke-width="1" />
      <line x1="${x0 + border + 5}" y1="${y0 + border + 6}" x2="${x0 + border + 18}" y2="${y0 + border + 22}" stroke="#93c5fd" stroke-width="1.5" stroke-linecap="round" />
      <line x1="${x0 + border + 10}" y1="${y0 + border + 6}" x2="${x0 + border + 24}" y2="${y0 + border + 22}" stroke="#bfdbfe" stroke-width="1" stroke-linecap="round" />
    `;
  } else if (is3Track) {
    // 3-Track Sliding with mesh sash
    const pw = Math.round((w - 2 * border) / 3);
    innerHtml = `
      <rect x="${x0 + border}" y="${y0 + border}" width="${pw}" height="${h - 2 * border}" fill="${sashFill}" stroke="${sashStroke}" stroke-width="1.1" />
      <rect x="${x0 + border + pw}" y="${y0 + border}" width="${pw}" height="${h - 2 * border}" fill="#dbeafe" stroke="${sashStroke}" stroke-width="1.1" />
      <rect x="${x0 + border + 2 * pw}" y="${y0 + border}" width="${w - 2 * border - 2 * pw}" height="${h - 2 * border}" fill="#e2e8f0" stroke="#64748b" stroke-width="1.1" stroke-dasharray="2 2" />
      <circle cx="${x0 + border + pw - 4}" cy="${y0 + h / 2}" r="1.6" fill="#1e293b" />
      <circle cx="${x0 + border + 2 * pw - 4}" cy="${y0 + h / 2}" r="1.6" fill="#1e293b" />
    `;
  } else if (is4Track) {
    // 4-Track Sliding
    const pw = Math.round((w - 2 * border) / 4);
    innerHtml = `
      <rect x="${x0 + border}" y="${y0 + border}" width="${pw}" height="${h - 2 * border}" fill="${sashFill}" stroke="${sashStroke}" stroke-width="1" />
      <rect x="${x0 + border + pw}" y="${y0 + border}" width="${pw}" height="${h - 2 * border}" fill="#dbeafe" stroke="${sashStroke}" stroke-width="1" />
      <rect x="${x0 + border + 2 * pw}" y="${y0 + border}" width="${pw}" height="${h - 2 * border}" fill="#dbeafe" stroke="${sashStroke}" stroke-width="1" />
      <rect x="${x0 + border + 3 * pw}" y="${y0 + border}" width="${w - 2 * border - 3 * pw}" height="${h - 2 * border}" fill="${sashFill}" stroke="${sashStroke}" stroke-width="1" />
    `;
  } else {
    // Standard 2-Track Sliding
    const pw = Math.round((w - border) / 2) + 2;
    innerHtml = `
      <rect x="${x0 + border}" y="${y0 + border}" width="${pw}" height="${h - 2 * border}" fill="${sashFill}" stroke="${sashStroke}" stroke-width="1.1" />
      <rect x="${x0 + w - border - pw}" y="${y0 + border}" width="${pw}" height="${h - 2 * border}" fill="#dbeafe" stroke="${sashStroke}" stroke-width="1.3" />
      <line x1="${x0 + border + 6}" y1="${y0 + h / 2}" x2="${x0 + border + pw - 8}" y2="${y0 + h / 2}" stroke="#2563eb" stroke-width="1" stroke-dasharray="3 1.5" />
      <polygon points="${x0 + border + pw - 8},${y0 + h / 2 - 3} ${x0 + border + pw - 3},${y0 + h / 2} ${x0 + border + pw - 8},${y0 + h / 2 + 3}" fill="#2563eb" />
      <circle cx="${x0 + w - border - pw + 4}" cy="${y0 + h / 2}" r="1.8" fill="#0f172a" />
    `;
  }

  // Door bottom threshold line
  const doorLine = isDoor
    ? `<line x1="${x0 - 3}" y1="${y0 + h}" x2="${x0 + w + 3}" y2="${y0 + h}" stroke="#0f172a" stroke-width="3" />`
    : '';

  // Width dimension annotation (above frame with boundary ticks & navy pill)
  const widthDim = `
    <g>
      <line x1="${x0}" y1="${y0 - 9}" x2="${x0 + w}" y2="${y0 - 9}" stroke="#0284c7" stroke-width="1.2" />
      <line x1="${x0}" y1="${y0 - 15}" x2="${x0}" y2="${y0 - 3}" stroke="#0284c7" stroke-width="1.3" />
      <line x1="${x0 + w}" y1="${y0 - 15}" x2="${x0 + w}" y2="${y0 - 3}" stroke="#0284c7" stroke-width="1.3" />
      <rect x="${Math.round(x0 + w / 2 - 20)}" y="${y0 - 21}" width="40" height="17" rx="3.5" fill="#1e3a8a" />
      <text x="${Math.round(x0 + w / 2)}" y="${y0 - 9}" text-anchor="middle" font-size="10.5" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-weight="800" fill="#ffffff">${safeW}"</text>
    </g>
  `;

  // Height dimension annotation (right side of frame with boundary ticks & navy pill)
  const heightDim = `
    <g>
      <line x1="${x0 + w + 8}" y1="${y0}" x2="${x0 + w + 8}" y2="${y0 + h}" stroke="#0284c7" stroke-width="1.2" />
      <line x1="${x0 + w + 3}" y1="${y0}" x2="${x0 + w + 13}" y2="${y0}" stroke="#0284c7" stroke-width="1.3" />
      <line x1="${x0 + w + 3}" y1="${y0 + h}" x2="${x0 + w + 13}" y2="${y0 + h}" stroke="#0284c7" stroke-width="1.3" />
      <rect x="${x0 + w + 13}" y="${Math.round(y0 + h / 2 - 9)}" width="38" height="18" rx="3.5" fill="#1e3a8a" />
      <text x="${x0 + w + 32}" y="${Math.round(y0 + h / 2 + 4)}" text-anchor="middle" font-size="10.5" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-weight="800" fill="#ffffff">${safeH}"</text>
    </g>
  `;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 130" width="100%" height="100%" style="display:block; overflow:visible;">
      <!-- Outer UPVC Frame Profile -->
      <rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="2" fill="${frameFill}" stroke="${frameStroke}" stroke-width="1.8" />
      ${innerHtml}
      ${doorLine}
      ${widthDim}
      ${heightDim}
    </svg>
  `;
}

/**
 * React elevation component with real-time measurement dimensions for table thumbnails and print preview modals.
 */
export const ElevationDiagram: React.FC<{
  item: QuotationItem;
  className?: string;
}> = ({ item, className = 'w-[155px] h-[112px]' }) => {
  const svgMarkup = generateElevationSvgString(item);
  return React.createElement('div', {
    className: `relative inline-flex items-center justify-center p-1 rounded-lg bg-slate-50 border border-slate-200 shadow-2xs ${className}`,
    dangerouslySetInnerHTML: { __html: svgMarkup },
    title: `${item.name} (${item.widthInInches}" × ${item.heightInInches}")`,
  });
};
