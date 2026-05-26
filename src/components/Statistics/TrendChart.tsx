import { useMemo, useId } from 'react';
import { PracticeRecord } from '../../types';
import { TrendingUp } from 'lucide-react';

interface TrendChartProps {
  records: PracticeRecord[];
}

export function TrendChart({ records }: TrendChartProps) {
  const uid = useId();
  const lineGradId = `lineGrad-${uid}`;
  const areaGradId = `areaGrad-${uid}`;
  const chartData = useMemo(() => {
    const sorted = [...records].sort((a, b) => a.endTime - b.endTime);
    return sorted.slice(-14).map((record) => ({
      date: new Date(record.endTime).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
      accuracy: Math.round((record.correctCount / Math.max(record.totalCount, 1)) * 100),
      count: record.totalCount,
    }));
  }, [records]);

  if (chartData.length === 0) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-5 w-5 text-accent-600" />
          <h3 className="text-lg font-display font-bold text-surface-800 dark:text-surface-200">正确率趋势</h3>
        </div>
        <p className="text-sm text-surface-600 dark:text-surface-400 text-center py-12">暂无数据</p>
      </div>
    );
  }

  const W = 600;
  const H = 250;
  const padding = { top: 20, right: 30, bottom: 40, left: 50 };
  const innerW = W - padding.left - padding.right;
  const innerH = H - padding.top - padding.bottom;

  const yMax = 100;
  const yTicks = [0, 20, 40, 60, 80, 100];

  const points = chartData.map((d, i) => {
    const x = padding.left + (i / Math.max(chartData.length - 1, 1)) * innerW;
    const y = padding.top + innerH - (d.accuracy / yMax) * innerH;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + innerH} L ${points[0].x} ${padding.top + innerH} Z`;

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-accent-600" />
        <h3 className="text-lg font-display font-bold text-surface-800 dark:text-surface-200">正确率趋势</h3>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        {/* Y axis grid lines + labels */}
        {yTicks.map((tick) => {
          const y = padding.top + innerH - (tick / yMax) * innerH;
          return (
            <g key={`y-${tick}`}>
              <line x1={padding.left} y1={y} x2={W - padding.right} y2={y}
                stroke="currentColor" strokeWidth="0.5" opacity="0.1" className="text-surface-800 dark:text-surface-200" />
              <text x={padding.left - 8} y={y + 4} textAnchor="end"
                className="text-[10px] fill-surface-600 dark:fill-surface-400" fontFamily="system-ui">
                {tick}%
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill={`url(#${areaGradId})`} opacity="0.3" />

        {/* Line */}
        <path d={linePath} fill="none"
          stroke={`url(#${lineGradId})`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {points.map((p, i) => (
          <g key={`pt-${i}`}>
            <circle cx={p.x} cy={p.y} r="4" fill="white" stroke="#FF2D78" strokeWidth="2" />
            <text x={p.x} y={p.y - 10} textAnchor="middle"
              className="text-[11px] font-bold fill-accent-600" fontFamily="system-ui">
              {p.accuracy}%
            </text>
          </g>
        ))}

        {/* X axis labels */}
        {points.filter((_, i) => points.length <= 7 || i % 2 === 0).map((p, i) => (
          <text key={`xl-${i}`} x={p.x} y={H - 8} textAnchor="middle"
            className="text-[10px] fill-surface-600 dark:fill-surface-400" fontFamily="system-ui">
            {p.date}
          </text>
        ))}

        {/* Gradients */}
        <defs>
          <linearGradient id={lineGradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FF2D78" />
            <stop offset="100%" stopColor="#00E5CC" />
          </linearGradient>
          <linearGradient id={areaGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF2D78" />
            <stop offset="100%" stopColor="#00E5CC" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}