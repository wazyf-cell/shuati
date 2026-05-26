import { useState, useRef } from 'react';
import { Upload, Download, BarChart3, Sparkles, BookOpen, Cpu, Settings as SettingsIcon } from 'lucide-react';
import { useBankStore, useToastStore } from '../../store';
import { storage } from '../../utils/storage';


interface HeaderProps {
  onNavigate: (page: string) => void;
}

export function Header({ onNavigate }: HeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [editBankName, setEditBankName] = useState('');
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState<any>(null);
  const [importRawContent, setImportRawContent] = useState('');

  const { updateBank } = useBankStore();
  const { addToast } = useToastStore();

  const handleSaveEdit = () => {
    if (!editBankName.trim() || !editingBankId) return;
    updateBank(editingBankId, editBankName.trim());
    setEditingBankId(null);
    setEditBankName('');
    addToast('题库名称已更新', 'success');
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      try {
        const data = JSON.parse(content);
        const bankCount = data.banks?.length || 0;
        const questionCount = data.banks?.reduce((sum: number, b: any) => sum + (b.questions?.length || 0), 0) || 0;
        const wrongCount = data.wrong?.length || 0;
        const recordCount = data.records?.length || 0;

        setImportPreviewData({ bankCount, questionCount, wrongCount, recordCount });
        setImportRawContent(content);
        setShowImportPreview(true);
      } catch (e) {
        const msg = e instanceof Error ? e.message : '未知错误';
        addToast(`JSON 格式无效：${msg}`, 'error');
      }
    };
    reader.readAsText(file);
    // 重置 input value 使同一文件可重复选择
    e.target.value = '';
  };

  const handleConfirmImport = () => {
    const result = storage.importData(importRawContent);
    if (result.success) {
      addToast('数据导入成功！', 'success');
      setShowImportPreview(false);
      setTimeout(() => {
        window.location.href = window.location.href;
      }, 200);
    } else {
      addToast(result.error || '导入失败，请检查数据格式', 'error');
      setShowImportPreview(false);
    }
  };

  const handleExport = async () => {
    const data = storage.exportData();
    const filename = `题库备份_${new Date().toISOString().split('T')[0]}.json`;

    const win = window as any;

    // Tauri 桌面端：原生保存对话框
    try {
      addToast('[T]', 'success');
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');
      const filePath = await save({
        defaultPath: filename,
        filters: [{ name: 'JSON 备份', extensions: ['json'] }],
      });
      if (filePath) {
        await writeTextFile(filePath, data);
        addToast('数据导出成功！', 'success');
      }
      return;
    } catch (e: any) {
      addToast(`[T] ${e?.message || e}`, 'error');
    }

    // Capacitor Android
    if (win.Capacitor?.isNativePlatform?.()) {
      // Capacitor Android：写缓存 → 系统分享
      try {
        const [{ Filesystem, Directory, Encoding }, { Share }] = await Promise.all([
          import('@capacitor/filesystem'),
          import('@capacitor/share'),
        ]);
        const result = await Filesystem.writeFile({
          path: filename,
          data: data,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        });
        await Share.share({
          title: '题库备份',
          text: '刷题助手题库备份数据',
          files: [result.uri],
          dialogTitle: '导出题库数据',
        });
        addToast('数据导出成功！', 'success');
      } catch (e: any) {
        addToast(`导出失败: ${e.message || '请重试'}`, 'error');
      }
    } else {
      // 纯 Web 浏览器：Blob 下载
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast('数据导出成功！', 'success');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-surface-50/80 dark:bg-surface-800/80 backdrop-blur-xl border-b-2 border-surface-500/10 dark:border-surface-100/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-400 rounded-xl flex items-center justify-center shadow-sm">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-display font-bold gradient-text">刷题助手</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('dashboard')}
              className="p-2 text-accent-500 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/20 rounded-xl transition-colors"
              title="题库广场"
            >
              <Sparkles className="h-5 w-5" />
            </button>

            <button
              onClick={handleImport}
              className="p-2 text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/20 rounded-xl transition-colors"
              title="导入数据"
            >
              <Download className="h-5 w-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="absolute opacity-0 pointer-events-none"
              tabIndex={-1}
            />

            <button
              onClick={handleExport}
              className="p-2 text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/20 rounded-xl transition-colors"
              title="导出数据"
            >
              <Upload className="h-5 w-5" />
            </button>

            <button
              onClick={() => onNavigate('wrong')}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
              title="错题本"
            >
              <BookOpen className="h-5 w-5" />
            </button>

            <button
              onClick={() => onNavigate('statistics')}
              className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors"
              title="练习统计"
            >
              <BarChart3 className="h-5 w-5" />
            </button>

            <button
              onClick={() => onNavigate('settings')}
              className="p-2 text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-xl transition-colors"
              title="设置与更新"
            >
              <SettingsIcon className="h-5 w-5" />
            </button>

            <button
              onClick={() => onNavigate('ai')}
              className="p-2 text-accent-500 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/20 rounded-xl transition-colors"
              title="AI 配置"
            >
              <Cpu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {editingBankId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setEditingBankId(null)}>
          <div className="card p-6 w-full max-w-md mx-4 animate-bounce-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-display font-bold text-surface-800 dark:text-surface-200 mb-4">重命名题库</h3>
            <input
              value={editBankName}
              onChange={(e) => setEditBankName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
              className="input mb-4"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setEditingBankId(null)} className="btn-ghost">取消</button>
              <button onClick={handleSaveEdit} className="btn-primary">保存</button>
            </div>
          </div>
        </div>
      )}
    {showImportPreview && importPreviewData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowImportPreview(false)}>
          <div className="card p-6 w-full max-w-md mx-4 animate-bounce-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-display font-bold text-surface-800 dark:text-surface-200 mb-4">
              <Upload className="inline h-5 w-5 mr-2 text-accent-600" />
              确认导入数据
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-accent-50 dark:bg-accent-900/20 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-accent-600">{importPreviewData.bankCount}</div>
                <div className="text-xs text-surface-600 dark:text-surface-400">题库数</div>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-emerald-500">{importPreviewData.questionCount}</div>
                <div className="text-xs text-surface-600 dark:text-surface-400">题目总数</div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-amber-500">{importPreviewData.wrongCount}</div>
                <div className="text-xs text-surface-600 dark:text-surface-400">错题数</div>
              </div>
              <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-rose-400">{importPreviewData.recordCount}</div>
                <div className="text-xs text-surface-600 dark:text-surface-400">练习记录</div>
              </div>
            </div>
            <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700 rounded-lg p-3 mb-4 text-sm text-rose-500 dark:text-rose-300">
              导入将覆盖现有所有数据，不可撤销！
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowImportPreview(false)} className="btn-ghost">取消</button>
              <button onClick={handleConfirmImport} className="btn-primary">确认导入</button>
            </div>
          </div>
        </div>
      )}

    </header>
  );
}