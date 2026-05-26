import { useMemo, useId } from 'react';
import { PracticeRecord } from '../../types';
import { PieChart, BarChart3 } from 'lucide-react';

interface PracticeChartProps {
  records: PracticeRecord[];
}

export function PracticeChart({ records }: PracticeChartProps) {
  const uid = useId();
  const barGradId = `barGrad-${uid}`;
  const { correct, incorrect } = useMemo(() => {
    let c = 0, i = 0;
    records.forEach((r) => {
      c += r.correctCount;
      i += r.totalCount - r.correctCount;
    });
    return { correct: c, incorrect: i };
  }, [records]);

  const dailyData = useMemo(() => {
    const dayMap = new Map<string, number>();
    const sorted = [...records].sort((a, b) => a.endTime - b.endTime);
    sorted.forEach((r) => {
      const date = new Date(r.endTime).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
      dayMap.set(date, (dayMap.get(date) || 0) + r.totalCount);
    });
    return Array.from(dayMap.entries()).slice(-14);
  }, [records]);

  const total = correct + incorrect;
  const correctPct = total > 0 ? (correct / total) * 100 : 0;
  const circumference = 2 * Math.PI * 40;
  const correctOffset = circumference * (1 - correctPct / 100);

  const maxDaily = Math.max(...dailyData.map(([, v]) => v), 1);

  const BW = 600;
  const BH = 220;
  const bPad = { top: 20, right: 30, bottom: 45, left: 50 };
  const bInnerW = BW - bPad.left - bPad.right;
  const bInnerH = BH - bPad.top - bPad.bottom;
  const barW = Math.min(bInnerW / dailyData.length - 8, 40);
  const gap = (bInnerW - barW * dailyData.length) / (dailyData.length + 1);

  const yMaxBars = Math.ceil(maxDaily / 5) * 5 || 5;
  const yTicksBars = Array.from({ length: 6 }, (_, i) => Math.round((yMaxBars / 5) * i));

  return (
    <div className="space-y-6">
      {/* 正确/错误分布 */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-6">
          <PieChart className="h-5 w-5 text-accent-500" />
          <h3 className="text-lg font-display font-bold text-surface-900 dark:text-surface-100">答题分布</h3>
        </div>

        {total === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: 'var(--color-surface-500)' }}>暂无数据</p>
        ) : (
          <div className="flex items-center justify-center gap-8">
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10"
                  className="text-surface-100 dark:text-surface-600" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={correctOffset}
                  strokeLinecap="round"
                  className="text-accent-400 transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-display font-bold text-accent-500">{Math.round(correctPct)}%</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent-400" />
                <span className="text-sm font-body" style={{ color: 'var(--color-surface-900)' }}>
                  正确 <strong>{correct}</strong> 题
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-surface-100 dark:bg-surface-600" />
                <span className="text-sm font-body" style={{ color: 'var(--color-surface-500)' }}>
                  错误 <strong>{incorrect}</strong> 题
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 每日练习量 - SVG 柱状图 */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-surface-400" />
          <h3 className="text-lg font-display font-bold text-surface-900 dark:text-surface-100">每日练习量</h3>
        </div>

        {dailyData.length === 0 ? (
          <p className="text-sm text-center py-12" style={{ color: 'var(--color-surface-500)' }}>暂无数据</p>
        ) : (
          <svg viewBox={`0 0 ${BW} ${BH}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
            {/* Y axis grid + labels */}
            {yTicksBars.map((tick) => {
              const y = bPad.top + bInnerH - (tick / yMaxBars) * bInnerH;
              return (
                <g key={`by-${tick}`}>
                  <line x1={bPad.left} y1={y} x2={BW - bPad.right} y2={y}
                    stroke="currentColor" strokeWidth="0.5" opacity="0.1"
                    className="text-surface-900 dark:text-surface-100" />
                  <text x={bPad.left - 8} y={y + 4} textAnchor="end"
                    style={{ fontSize: '10px', fill: 'var(--color-surface-500)' }}
                    fontFamily="system-ui">
                    {tick}
                  </text>
                </g>
              );
            })}

            {/* Bars */}
            {dailyData.map(([date, count], i) => {
              const x = bPad.left + gap + i * (barW + gap);
              const barH = Math.max((count / yMaxBars) * bInnerH, 2);
              const y = bPad.top + bInnerH - barH;
              return (
                <g key={`bar-${i}`}>
                  <rect x={x} y={y} width={barW} height={barH} rx="4" ry="4"
                    fill={`url(#${barGradId})`} />
                  <text x={x + barW / 2} y={y - 6} textAnchor="middle"
                    style={{ fontSize: '10px', fontWeight: 'bold', fill: 'var(--color-surface-500)' }}
                    fontFamily="system-ui">
                    {count}
                  </text>
                  <text x={x + barW / 2} y={BH - 12} textAnchor="middle"
                    style={{ fontSize: '9px', fill: 'var(--color-surface-500)' }}
                    fontFamily="system-ui"
                    transform={`rotate(-30, ${x + barW / 2}, ${BH - 12})`}>
                    {date}
                  </text>
                </g>
              );
            })}

            <defs>
              <linearGradient id={barGradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFB800" />
                <stop offset="100%" stopColor="#FF6B35" />
              </linearGradient>
            </defs>
          </svg>
        )}
      </div>
    </div>
  );
}