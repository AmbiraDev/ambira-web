'use client';

import React from 'react';

interface DataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

interface ActivityChartProps {
  data: DataPoint[];
  type?: 'bar' | 'line';
  height?: number;
  color?: string;
  secondaryColor?: string;
  showGrid?: boolean;
  showLabels?: boolean;
  valueFormatter?: (value: number) => string;
}

export const ActivityChart: React.FC<ActivityChartProps> = ({
  data,
  type = 'bar',
  height = 200,
  color = '#3b82f6',
  secondaryColor = '#10b981',
  showGrid = true,
  showLabels = true,
  valueFormatter = (v) => v.toString()
}) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => Math.max(d.value, d.secondaryValue || 0)));
  const padding = 40;
  const chartWidth = Math.max(600, data.length * 40);
  const barWidth = Math.max(20, (chartWidth - padding * 2) / data.length - 10);

  return (
    <div className="w-full overflow-x-auto">
      <svg width={chartWidth} height={height + 60} className="font-sans">
        {/* Grid lines */}
        {showGrid && (
          <g>
            {[0, 0.25, 0.5, 0.75, 1].map((percent, i) => {
              const y = height - percent * height + padding;
              return (
                <g key={i}>
                  <line
                    x1={padding}
                    y1={y}
                    x2={chartWidth - padding}
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                  />
                  <text
                    x={padding - 10}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="12"
                    fill="#6b7280"
                  >
                    {valueFormatter(maxValue * percent)}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* Bars or Line */}
        {type === 'bar' ? (
          <g>
            {data.map((point, index) => {
              const x = padding + index * ((chartWidth - padding * 2) / data.length);
              const barHeight = (point.value / maxValue) * height;
              const y = height + padding - barHeight;

              return (
                <g key={index}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill={color}
                    rx="4"
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <title>{`${point.label}: ${valueFormatter(point.value)}`}</title>
                  </rect>
                  
                  {point.secondaryValue !== undefined && (
                    <rect
                      x={x + barWidth + 4}
                      y={height + padding - (point.secondaryValue / maxValue) * height}
                      width={barWidth}
                      height={(point.secondaryValue / maxValue) * height}
                      fill={secondaryColor}
                      rx="4"
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                    >
                      <title>{`${point.label}: ${valueFormatter(point.secondaryValue)}`}</title>
                    </rect>
                  )}
                </g>
              );
            })}
          </g>
        ) : (
          <g>
            {/* Line path */}
            <path
              d={data.map((point, index) => {
                const x = padding + index * ((chartWidth - padding * 2) / (data.length - 1));
                const y = height + padding - (point.value / maxValue) * height;
                return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Data points */}
            {data.map((point, index) => {
              const x = padding + index * ((chartWidth - padding * 2) / (data.length - 1));
              const y = height + padding - (point.value / maxValue) * height;
              
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="4"
                  fill={color}
                  className="hover:r-6 transition-all cursor-pointer"
                >
                  <title>{`${point.label}: ${valueFormatter(point.value)}`}</title>
                </circle>
              );
            })}
          </g>
        )}

        {/* X-axis labels */}
        {showLabels && (
          <g>
            {data.map((point, index) => {
              const x = padding + index * ((chartWidth - padding * 2) / data.length) + barWidth / 2;
              return (
                <text
                  key={index}
                  x={x}
                  y={height + padding + 20}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#6b7280"
                >
                  {point.label}
                </text>
              );
            })}
          </g>
        )}
      </svg>
    </div>
  );
};
