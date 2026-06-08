'use client';

import React, { useMemo, useRef, useState } from 'react';

interface SparkSeries {
  name: string;
  color: string;
  points: number[]; // y-values, x is index
}

interface InlineSparklineProps {
  width?: number | string;
  height?: number;
  series: SparkSeries[];
  labels?: string[]; // optional x-axis labels for tooltip
}

export default function InlineSparkline({ width = 220, height = 60, series, labels }: InlineSparklineProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const renderWidth = typeof width === 'number' ? width : 1000; // internal drawing width when responsive
  const padding = 10;
  const innerW = renderWidth - padding * 2;
  const innerH = height - padding * 2;

  const allValues = useMemo(() => series.flatMap(s => s.points), [series]);
  const minY = Math.min(...allValues, 0);
  const maxY = Math.max(...allValues, 1);

  const numPoints = useMemo(() => Math.max(0, ...series.map(s => s.points.length)), [series]);
  const stepX = numPoints > 1 ? innerW / (numPoints - 1) : innerW;

  const yScale = (v: number) => {
    if (maxY === minY) return padding + innerH / 2;
    const t = (v - minY) / (maxY - minY);
    return padding + (1 - t) * innerH;
  };

  const xAt = (i: number) => padding + i * stepX;

  const toPath = (points: number[]) => {
    const n = points.length;
    if (n === 0) return '';
    if (n === 1) return `M ${padding} ${padding + innerH / 2} L ${renderWidth - padding} ${padding + innerH / 2}`;
    return points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yScale(v)}`).join(' ');
  };

  const handleMouseMove: React.MouseEventHandler<SVGRectElement> = (e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const displayedWidth = rect.width;
    const scaleX = displayedWidth > 0 ? renderWidth / displayedWidth : 1;
    const offsetX = (e.clientX - rect.left) * scaleX; // in SVG coords
    const i = Math.round((offsetX - padding) / stepX);
    const clamped = Math.max(0, Math.min(numPoints - 1, i));
    if (numPoints > 0) setHoverIndex(clamped);
  };

  const handleMouseLeave = () => setHoverIndex(null);

  const tooltipLabel = (i: number) => {
    if (labels && labels[i]) return labels[i];
    return `Point ${i + 1}`;
  };

  return (
    <svg 
      ref={svgRef}
      width={typeof width === 'number' ? width : '100%'} 
      height={height} 
      viewBox={`0 0 ${renderWidth} ${height}`}
      preserveAspectRatio="none"
    >
      <rect x={0} y={0} width={renderWidth} height={height} rx={10} ry={10} fill="#fafafa" stroke="#eee" />

      {series.map((s, idx) => (
        <path key={idx} d={toPath(s.points)} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      ))}

      {hoverIndex != null && numPoints > 0 && (
        <g>
          {/* Crosshair line */}
          <line x1={xAt(hoverIndex)} y1={padding} x2={xAt(hoverIndex)} y2={height - padding} stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" />
          {/* Point markers */}
          {series.map((s, i) => (
            s.points[hoverIndex] != null ? (
              <circle key={i} cx={xAt(hoverIndex)} cy={yScale(s.points[hoverIndex])} r={3.5} fill={s.color} stroke="#fff" strokeWidth={1} />
            ) : null
          ))}
          {/* Tooltip box */}
          {(() => {
            const x = Math.min(renderWidth - padding - 140, Math.max(padding, xAt(hoverIndex) + 8));
            const y = padding + 8;
            const line1 = tooltipLabel(hoverIndex);
            const line2 = `${series[0]?.name || 'Current'}: ${series[0]?.points[hoverIndex] ?? '-'}`;
            const line3 = `${series[1]?.name || 'Prev'}: ${series[1]?.points[hoverIndex] ?? '-'}`;
            return (
              <g>
                <rect x={x} y={y} width={140} height={52} rx={6} ry={6} fill="#111827" opacity={0.9} />
                <text x={x + 8} y={y + 16} fill="#e5e7eb" fontSize={10}>{line1}</text>
                <text x={x + 8} y={y + 32} fill={series[0]?.color || '#60a5fa'} fontSize={11} fontWeight={600}>{line2}</text>
                <text x={x + 8} y={y + 46} fill={series[1]?.color || '#9ca3af'} fontSize={11} fontWeight={600}>{line3}</text>
              </g>
            );
          })()}
        </g>
      )}

      {/* Interaction capture */}
      <rect 
        x={padding} y={padding} width={innerW} height={innerH} 
        fill="transparent" 
        onMouseMove={handleMouseMove} 
        onMouseLeave={handleMouseLeave} 
      />
    </svg>
  );
}
