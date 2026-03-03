'use client';

import React, { useState } from 'react';

interface AreaChartDataPoint {
    label: string;
    value: number;
    area: string;
}

interface AreaChartProps {
    data: AreaChartDataPoint[];
    areaColors?: Record<string, string>;
    height?: number;
}

const DEFAULT_COLORS = [
    { fill: 'rgba(99, 102, 241, 0.35)', stroke: 'rgb(129, 140, 248)', gradient: ['rgba(99, 102, 241, 0.5)', 'rgba(99, 102, 241, 0.02)'] },
    { fill: 'rgba(245, 158, 11, 0.35)', stroke: 'rgb(251, 191, 36)', gradient: ['rgba(245, 158, 11, 0.5)', 'rgba(245, 158, 11, 0.02)'] },
    { fill: 'rgba(16, 185, 129, 0.35)', stroke: 'rgb(52, 211, 153)', gradient: ['rgba(16, 185, 129, 0.5)', 'rgba(16, 185, 129, 0.02)'] },
    { fill: 'rgba(236, 72, 153, 0.35)', stroke: 'rgb(244, 114, 182)', gradient: ['rgba(236, 72, 153, 0.5)', 'rgba(236, 72, 153, 0.02)'] },
    { fill: 'rgba(139, 92, 246, 0.35)', stroke: 'rgb(167, 139, 250)', gradient: ['rgba(139, 92, 246, 0.5)', 'rgba(139, 92, 246, 0.02)'] },
    { fill: 'rgba(6, 182, 212, 0.35)', stroke: 'rgb(34, 211, 238)', gradient: ['rgba(6, 182, 212, 0.5)', 'rgba(6, 182, 212, 0.02)'] },
];

export function AreaChart({ data, height = 280 }: AreaChartProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    if (data.length === 0) return null;

    const paddingLeft = 50;
    const paddingRight = 20;
    const paddingTop = 30;
    const paddingBottom = 60;
    const width = 600;

    const chartW = width - paddingLeft - paddingRight;
    const chartH = height - paddingTop - paddingBottom;

    const maxValue = Math.max(...data.map(d => d.value), 1);

    // Group by area for legend
    const uniqueAreas = [...new Set(data.map(d => d.area))];
    const areaColorMap: Record<string, typeof DEFAULT_COLORS[0]> = {};
    uniqueAreas.forEach((area, i) => {
        areaColorMap[area] = DEFAULT_COLORS[i % DEFAULT_COLORS.length];
    });

    const xStep = data.length > 1 ? chartW / (data.length - 1) : chartW;

    // Build the area path and line path
    const getX = (i: number) => paddingLeft + (data.length > 1 ? i * xStep : chartW / 2);
    const getY = (value: number) => paddingTop + chartH - (value / maxValue) * chartH;

    // Create path per area group with smooth curves
    // For a simple stacked look, we render each area's data points as area fills
    const areaPoints = data.map((d, i) => ({
        x: getX(i),
        y: getY(d.value),
        ...d,
        index: i,
    }));

    // Build a single area path for all data (as a continuous wave)
    const linePath = areaPoints
        .map((p, i) => {
            if (i === 0) return `M ${p.x},${p.y}`;
            const prev = areaPoints[i - 1];
            const cpX = (prev.x + p.x) / 2;
            return `C ${cpX},${prev.y} ${cpX},${p.y} ${p.x},${p.y}`;
        })
        .join(' ');

    const areaPath = `${linePath} L ${areaPoints[areaPoints.length - 1].x},${paddingTop + chartH} L ${areaPoints[0].x},${paddingTop + chartH} Z`;

    // Y-axis grid lines
    const gridLines = 4;
    const gridValues = Array.from({ length: gridLines + 1 }, (_, i) => (maxValue / gridLines) * i);

    const formatXP = (val: number) => {
        if (val >= 10000) return `${(val / 1000).toFixed(0)}k`;
        if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
        return Math.round(val).toString();
    };

    return (
        <div className="w-full">
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full overflow-visible"
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    {uniqueAreas.map((area, i) => (
                        <linearGradient key={area} id={`area-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={areaColorMap[area].gradient[0]} />
                            <stop offset="100%" stopColor={areaColorMap[area].gradient[1]} />
                        </linearGradient>
                    ))}
                    <linearGradient id="area-grad-main" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(99, 102, 241, 0.4)" />
                        <stop offset="100%" stopColor="rgba(99, 102, 241, 0.02)" />
                    </linearGradient>
                </defs>

                {/* Grid lines */}
                {gridValues.map((val, i) => {
                    const y = getY(val);
                    return (
                        <g key={i}>
                            <line
                                x1={paddingLeft}
                                y1={y}
                                x2={paddingLeft + chartW}
                                y2={y}
                                stroke="white"
                                strokeOpacity="0.05"
                                strokeDasharray="4 4"
                            />
                            <text
                                x={paddingLeft - 10}
                                y={y + 4}
                                fill="rgb(113, 113, 122)"
                                fontSize="10"
                                textAnchor="end"
                                fontWeight="600"
                            >
                                {formatXP(val)}
                            </text>
                        </g>
                    );
                })}

                {/* Render separate area for each "area" group to color them differently */}
                {uniqueAreas.map((area, areaIdx) => {
                    const areaDataPoints = areaPoints.filter(p => p.area === area);
                    if (areaDataPoints.length === 0) return null;

                    // Build continuous segments for this area
                    const segments = areaDataPoints.map(p => ({ x: p.x, y: p.y }));

                    if (segments.length === 1) {
                        // Single point: draw a filled circle
                        return (
                            <circle
                                key={area}
                                cx={segments[0].x}
                                cy={segments[0].y}
                                r="6"
                                fill={areaColorMap[area].stroke}
                                fillOpacity="0.5"
                            />
                        );
                    }

                    const segLinePath = segments
                        .map((p, i) => {
                            if (i === 0) return `M ${p.x},${p.y}`;
                            const prev = segments[i - 1];
                            const cpX = (prev.x + p.x) / 2;
                            return `C ${cpX},${prev.y} ${cpX},${p.y} ${p.x},${p.y}`;
                        })
                        .join(' ');

                    const segAreaPath = `${segLinePath} L ${segments[segments.length - 1].x},${paddingTop + chartH} L ${segments[0].x},${paddingTop + chartH} Z`;

                    return (
                        <g key={area}>
                            <path
                                d={segAreaPath}
                                fill={`url(#area-grad-${areaIdx})`}
                                className="transition-all duration-700 ease-in-out"
                            />
                            <path
                                d={segLinePath}
                                fill="none"
                                stroke={areaColorMap[area].stroke}
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                className="transition-all duration-700 ease-in-out"
                            />
                        </g>
                    );
                })}

                {/* Data Points & Labels */}
                {areaPoints.map((p, i) => {
                    const color = areaColorMap[p.area];
                    return (
                        <g
                            key={i}
                            onMouseEnter={() => setHoveredIndex(i)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            className="cursor-pointer"
                        >
                            {/* Hover vertical line */}
                            {hoveredIndex === i && (
                                <line
                                    x1={p.x}
                                    y1={paddingTop}
                                    x2={p.x}
                                    y2={paddingTop + chartH}
                                    stroke="white"
                                    strokeOpacity="0.1"
                                    strokeDasharray="3 3"
                                />
                            )}

                            {/* Hit area */}
                            <rect
                                x={p.x - xStep / 2}
                                y={paddingTop}
                                width={xStep}
                                height={chartH}
                                fill="transparent"
                            />

                            {/* Glow */}
                            <circle
                                cx={p.x}
                                cy={p.y}
                                r={hoveredIndex === i ? 12 : 0}
                                fill={color.stroke}
                                fillOpacity="0.15"
                                className="transition-all duration-300"
                            />

                            {/* Point */}
                            <circle
                                cx={p.x}
                                cy={p.y}
                                r={hoveredIndex === i ? 5 : 3.5}
                                fill={color.stroke}
                                className="transition-all duration-300"
                            />

                            {/* X-axis Label */}
                            <text
                                x={p.x}
                                y={paddingTop + chartH + 20}
                                fill={hoveredIndex === i ? 'white' : 'rgb(113, 113, 122)'}
                                fontSize="9"
                                textAnchor="middle"
                                fontWeight="700"
                                className="uppercase tracking-wider transition-all duration-300"
                            >
                                {p.label.length > 10 ? p.label.substring(0, 10) + '…' : p.label}
                            </text>

                            {/* Tooltip */}
                            {hoveredIndex === i && (
                                <g>
                                    <rect
                                        x={p.x - 45}
                                        y={p.y - 38}
                                        width="90"
                                        height="28"
                                        rx="8"
                                        fill="rgb(24, 24, 27)"
                                        stroke={color.stroke}
                                        strokeWidth="1"
                                        strokeOpacity="0.5"
                                    />
                                    <text
                                        x={p.x}
                                        y={p.y - 20}
                                        fill="white"
                                        fontSize="11"
                                        textAnchor="middle"
                                        fontWeight="800"
                                    >
                                        {formatXP(p.value)} XP
                                    </text>
                                </g>
                            )}
                        </g>
                    );
                })}
            </svg>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
                {uniqueAreas.map(area => (
                    <div key={area} className="flex items-center gap-2">
                        <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: areaColorMap[area].stroke }}
                        />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                            {area}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
