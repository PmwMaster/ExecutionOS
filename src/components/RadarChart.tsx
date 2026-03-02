'use client';

import React from 'react';

interface RadarChartProps {
    data: { label: string; value: number }[];
    size?: number;
}

export function RadarChart({ data, size = 300 }: RadarChartProps) {
    const padding = 60;
    const radius = (size - padding * 2) / 2;
    const center = size / 2;
    const angleStep = (Math.PI * 2) / Math.max(data.length, 3);

    // Normalize data values to a scale of 0-1 based on the maximum value
    const maxValue = Math.max(...data.map(d => d.value), 1);

    const points = data.map((d, i) => {
        const r = (d.value / maxValue) * radius;
        const x = center + r * Math.cos(i * angleStep - Math.PI / 2);
        const y = center + r * Math.sin(i * angleStep - Math.PI / 2);
        return `${x},${y}`;
    }).join(' ');

    const gridLevels = [0.25, 0.5, 0.75, 1];

    return (
        <div className="flex items-center justify-center p-4">
            <svg width={size} height={size} className="overflow-visible">
                {/* Background Grid */}
                {gridLevels.map((level) => {
                    const r = level * radius;
                    const gridPoints = Array.from({ length: Math.max(data.length, 3) }).map((_, i) => {
                        const x = center + r * Math.cos(i * angleStep - Math.PI / 2);
                        const y = center + r * Math.sin(i * angleStep - Math.PI / 2);
                        return `${x},${y}`;
                    }).join(' ');

                    return (
                        <polygon
                            key={level}
                            points={gridPoints}
                            fill="none"
                            stroke="white"
                            strokeOpacity="0.05"
                        />
                    );
                })}

                {/* Axes */}
                {data.map((_, i) => {
                    const x = center + radius * Math.cos(i * angleStep - Math.PI / 2);
                    const y = center + radius * Math.sin(i * angleStep - Math.PI / 2);
                    return (
                        <line
                            key={i}
                            x1={center}
                            y1={center}
                            x2={x}
                            y2={y}
                            stroke="white"
                            strokeOpacity="0.1"
                        />
                    );
                })}

                {/* Data Area */}
                <polygon
                    points={points}
                    fill="rgb(99, 102, 241)"
                    fillOpacity="0.3"
                    stroke="rgb(129, 140, 248)"
                    strokeWidth="2"
                    className="transition-all duration-700 ease-in-out"
                />

                {/* Points */}
                {data.map((d, i) => {
                    const r = (d.value / maxValue) * radius;
                    const x = center + r * Math.cos(i * angleStep - Math.PI / 2);
                    const y = center + r * Math.sin(i * angleStep - Math.PI / 2);
                    return (
                        <circle
                            key={i}
                            cx={x}
                            cy={y}
                            r="4"
                            fill="rgb(129, 140, 248)"
                            className="transition-all duration-700 ease-in-out"
                        />
                    );
                })}

                {/* Labels */}
                {data.map((d, i) => {
                    const labelRadius = radius + 25;
                    const x = center + labelRadius * Math.cos(i * angleStep - Math.PI / 2);
                    const y = center + labelRadius * Math.sin(i * angleStep - Math.PI / 2);

                    let textAnchor: "middle" | "end" | "start" = "middle";
                    if (x < center - 10) textAnchor = "end";
                    if (x > center + 10) textAnchor = "start";

                    return (
                        <text
                            key={i}
                            x={x}
                            y={y}
                            fill="rgb(161, 161, 170)"
                            fontSize="12"
                            fontWeight="bold"
                            textAnchor={textAnchor}
                            dominantBaseline="middle"
                            className="uppercase tracking-tighter"
                        >
                            {d.label}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
}
