import { memo } from 'react';
import { Target, Clock, Award, TrendingUp } from 'lucide-react';

interface SummaryCardsProps {
  totalQuestions: number;
  totalCorrect: number;
  avgTime: number;
  accuracy: number;
}

const cards = [
  { key: 'total', icon: Target, label: '总做题数', color: 'from-accent-500 to-accent-600', iconBg: 'bg-accent-100 dark:bg-accent-900/30', iconColor: 'text-accent-500' },
  { key: 'correct', icon: Award, label: '正确题数', color: 'from-accent-400 to-accent-500', iconBg: 'bg-accent-100 dark:bg-accent-900/30', iconColor: 'text-accent-400' },
  { key: 'accuracy', icon: TrendingUp, label: '正确率', color: 'from-surface-400 to-surface-500', iconBg: 'bg-surface-100 dark:bg-surface-900/30', iconColor: 'text-surface-500' },
  { key: 'avgTime', icon: Clock, label: '平均用时', color: 'from-surface-400 to-surface-500', iconBg: 'bg-surface-100 dark:bg-surface-700', iconColor: 'text-surface-400 dark:text-surface-300' },
] as const;

export const SummaryCards = memo(function SummaryCards({ totalQuestions, totalCorrect, avgTime, accuracy }: SummaryCardsProps) {
  const values = {
    total: `${totalQuestions} 题`,
    correct: `${totalCorrect} 题`,
    accuracy: `${accuracy}%`,
    avgTime: `${avgTime} 分钟`,
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.key} className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 ${card.iconBg} rounded-xl flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
              <span className="text-xs font-bold text-surface-400 dark:text-surface-300 font-body">{card.label}</span>
            </div>
            <p className={`text-2xl font-display font-bold bg-gradient-to-r ${card.color} bg-clip-text text-transparent`}>
              {values[card.key]}
            </p>
          </div>
        );
      })}
    </div>
  );
});