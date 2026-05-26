import { useMemo, useState } from 'react';
import { SummaryCards } from './SummaryCards';
import { TrendChart } from './TrendChart';
import { PracticeChart } from './PracticeChart';
import { storage } from '../../utils/storage';
import { normalizeRecord } from '../../utils/recordCompat';
import { useBankStore } from '../../store';
import { BarChart3, ArrowLeft, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../shared/ConfirmDialog';

interface StatisticsProps {
  onBack: () => void;
}

export function Statistics({ onBack }: StatisticsProps) {
  const { banks } = useBankStore();
  const [selectedBankId, setSelectedBankId] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const allRecords = useMemo(() => storage.getRecords(), [refreshKey]);

  const filteredRecords = useMemo(() => {
    if (selectedBankId === 'all') return allRecords;
    return allRecords.filter((r) => normalizeRecord(r).bankIds.includes(selectedBankId));
  }, [allRecords, selectedBankId]);

  const totals = useMemo(() => {
    const totalQ = filteredRecords.reduce((sum, r) => sum + r.totalCount, 0);
    const totalC = filteredRecords.reduce((sum, r) => sum + r.correctCount, 0);
    const avg = filteredRecords.length > 0
      ? Math.round(
          filteredRecords.reduce((sum, r) => sum + ((r.endTime || r.startTime) - r.startTime), 0) /
            filteredRecords.length / 60000
        )
      : 0;
    const acc = totalQ > 0 ? Math.round((totalC / totalQ) * 100) : 0;
    return { totalQuestions: totalQ, totalCorrect: totalC, avgTime: avg, accuracy: acc };
  }, [filteredRecords]);

  return (
    <div className="animate-scale-in">
      <button onClick={onBack} className="btn-ghost mb-6 flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" />
        返回
      </button>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-400 rounded-xl flex items-center justify-center shadow-sm">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-2xl font-display font-bold text-surface-500 dark:text-surface-100">练习统计</h2>
        </div>
        {allRecords.length > 0 && (
          <button
            onClick={() => setConfirmOpen(true)}
            className="btn-ghost text-sm text-red-400 hover:text-red-600 flex items-center gap-1"
          >
            <Trash2 className="h-4 w-4" />
            {selectedBankId === 'all' ? '清空全部统计' : '清空该题库统计'}
          </button>
        )}
      </div>

      {/* 题库过滤 */}
      <div className="card p-2 mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedBankId('all')}
          className={`px-4 py-2 rounded-xl text-sm font-body font-bold transition-all duration-200 shadow-xs ${
            selectedBankId === 'all' ? 'btn-primary' : 'btn-ghost'
          }`}
        >
          全部题库
        </button>
        {banks.map((bank) => (
          <button
            key={bank.id}
            onClick={() => setSelectedBankId(bank.id)}
            className={`px-4 py-2 rounded-xl text-sm font-body font-bold transition-all duration-200 shadow-xs ${
              selectedBankId === bank.id ? 'btn-primary' : 'btn-ghost'
            }`}
          >
            {bank.name}
          </button>
        ))}
      </div>

      {allRecords.length === 0 ? (
        <div className="text-center py-20 card">
          <p className="text-lg text-surface-400 dark:text-surface-300 font-body">
            还没有练习记录，开始刷题吧！
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <SummaryCards
            totalQuestions={totals.totalQuestions}
            totalCorrect={totals.totalCorrect}
            avgTime={totals.avgTime}
            accuracy={totals.accuracy}
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TrendChart records={filteredRecords} />
            <PracticeChart records={filteredRecords} />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        message={selectedBankId === 'all' ? '确定清空所有练习统计数据吗？题库和错题不受影响。' : '确定清空该题库的练习统计数据吗？其他题库数据不受影响。'}
        onConfirm={() => {
          if (selectedBankId === 'all') {
            storage.setRecords([]);
          } else {
            const remaining = allRecords.filter(
              (r) => !normalizeRecord(r).bankIds.includes(selectedBankId)
            );
            storage.setRecords(remaining);
          }
          setRefreshKey(k => k + 1);
          setConfirmOpen(false);
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}