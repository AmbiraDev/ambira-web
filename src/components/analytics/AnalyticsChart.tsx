import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ComposedChart,
  Area,
} from 'recharts';
import { ChartTooltip } from './ChartTooltip';
import { ChartEmptyState } from './ChartEmptyState';

export interface ChartDataPoint {
  name: string;
  hours?: number;
  sessions?: number;
  avgDuration?: number;
  value?: number;
}

export interface AnalyticsChartProps {
  title: string;
  data: ChartDataPoint[];
  chartType: 'bar' | 'line';
  height?: string;
  dataKey: string;
  dataLabel: string;
  color: string;
  emptyStateIcon: React.ElementType;
  emptyStateTitle: string;
  emptyStateDescription: string;
  onEmptyStateAction?: () => void;
  isLoading?: boolean;
  margin?: {
    top?: number;
    right?: number;
    left?: number;
    bottom?: number;
  };
}

export function AnalyticsChart({
  title,
  data,
  chartType,
  height = 'h-72',
  dataKey,
  dataLabel,
  color,
  emptyStateIcon,
  emptyStateTitle,
  emptyStateDescription,
  onEmptyStateAction,
  isLoading = false,
  margin = { top: 10, right: 10, left: -20, bottom: 0 },
}: AnalyticsChartProps) {
  const isEmpty =
    data.length === 0 ||
    data.every(d => (d[dataKey as keyof typeof d] ?? 0) === 0);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <div className={height}>
        {isLoading ? (
          <div className="h-full bg-gray-50 rounded animate-pulse" />
        ) : isEmpty ? (
          <ChartEmptyState
            icon={emptyStateIcon}
            title={emptyStateTitle}
            description={emptyStateDescription}
            onAction={onEmptyStateAction}
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={data} margin={margin}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#666' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#666' }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <ChartTooltip />
                <Bar
                  dataKey={dataKey}
                  fill={color}
                  radius={[4, 4, 0, 0]}
                  name={dataLabel}
                />
              </BarChart>
            ) : (
              <ComposedChart data={data} margin={margin}>
                <defs>
                  <linearGradient
                    id={`color${dataKey}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#666' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#666' }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <ChartTooltip />
                <Area
                  type="monotone"
                  dataKey={dataKey}
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#color${dataKey})`}
                  name={dataLabel}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
