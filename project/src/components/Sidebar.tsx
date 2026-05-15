import { useState } from 'react';
import {
  Leaf, Plus, BookOpen, HelpCircle, RotateCcw, Layers,
  Trash2, ChevronRight, BarChart2, X, Menu, Trash
} from 'lucide-react';
import type { StudySession, StudyMode } from '../types/database';

interface SidebarProps {
  sessions: StudySession[];
  activeSession: StudySession | null;
  monthlyCount: number;
  remainingSessions: number;
  freeLimit: number;
  onNewSession: (mode: StudyMode) => void;
  onLoadSession: (session: StudySession) => void;
  onDeleteSession: (id: string) => void;
  canCreate: boolean;
}

const modeConfig: Record<StudyMode, { label: string; Icon: React.ElementType; color: string }> = {
  explain: { label: 'Explicar', Icon: BookOpen, color: 'text-blue-400' },
  quiz: { label: 'Quiz', Icon: HelpCircle, color: 'text-amber-400' },
  review: { label: 'Revisar', Icon: RotateCcw, color: 'text-mint-400' },
  flashcard: { label: 'Flashcard', Icon: Layers, color: 'text-rose-400' },
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Ontem';
  if (days < 7) return `${days} dias atras`;
  return date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
}

export default function Sidebar({
  sessions, activeSession, monthlyCount, remainingSessions, freeLimit,
  onNewSession, onLoadSession, onDeleteSession, canCreate,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const usagePercent = Math.min((monthlyCount / freeLimit) * 100, 100);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
    onDeleteSession(id);
    setDeletingId(null);
  };

  const handleClearAll = () => {
    if (window.confirm('Tem certeza que deseja apagar todas as sessoes?')) {
      sessions.forEach(s => onDeleteSession(s.id));
    }
  };

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-forest-800 border border-forest-600 rounded-lg text-forest-300 hover:text-white"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
      </button>

      <aside
        className={`
          fixed lg:relative inset-y-0 left-0 z-40
          flex flex-col h-full
          bg-forest-950 border-r border-forest-800
          transition-all duration-300 ease-in-out
          ${collapsed ? '-translate-x-full lg:translate-x-0 lg:w-16' : 'translate-x-0 w-72'}
        `}
      >
        <div className={`flex items-center px-4 py-5 border-b border-forest-800 ${collapsed ? 'lg:justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-forest-800 border border-forest-600 flex items-center justify-center">
                <Leaf className="w-4 h-4 text-mint-400" strokeWidth={1.5} />
              </div>
              <span className="font-lora text-white text-lg font-semibold">Flora</span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-forest-800 border border-forest-600 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-mint-400" strokeWidth={1.5} />
            </div>
          )}
          <button
            className={`hidden lg:flex p-1.5 rounded-lg text-forest-500 hover:text-forest-300 hover:bg-forest-800 transition-colors ${collapsed ? 'absolute right-3' : ''}`}
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`} />
          </button>
        </div>

        <div className={`px-3 py-3 ${collapsed ? 'flex justify-center' : ''}`}>
          {collapsed ? (
            <button
              onClick={() => { setCollapsed(false); setShowModeMenu(true); }}
              disabled={!canCreate}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-mint-600 hover:bg-mint-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowModeMenu(!showModeMenu)}
                disabled={!canCreate}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-mint-700 hover:bg-mint-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-mono text-sm font-medium transition-all duration-200 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                Nova Sessao
                <ChevronRight className={`w-3.5 h-3.5 ml-auto transition-transform ${showModeMenu ? 'rotate-90' : ''}`} />
              </button>

              {showModeMenu && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-forest-800 border border-forest-600 rounded-xl overflow-hidden shadow-xl z-10">
                  {(Object.entries(modeConfig) as [StudyMode, typeof modeConfig.explain][]).map(([mode, { label, Icon, color }]) => (
                    <button
                      key={mode}
                      onClick={() => { onNewSession(mode); setShowModeMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-forest-700 transition-colors"
                    >
                      <Icon className={`w-4 h-4 ${color}`} strokeWidth={1.5} />
                      <span className="font-mono text-forest-200 text-sm">{label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {!collapsed && (
          <div className="flex-1 overflow-y-auto px-3 pb-2 space-y-1 scrollbar-thin">
            {sessions.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <p className="font-mono text-forest-600 text-xs">Nenhuma sessao ainda.<br />Crie uma nova acima.</p>
              </div>
            ) : (
              sessions.map(session => {
                const { Icon, color } = modeConfig[session.mode];
                const isActive = activeSession?.id === session.id;
                return (
                  <button
                    key={session.id}
                    onClick={() => onLoadSession(session)}
                    className={`
                      w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group
                      ${isActive ? 'bg-forest-700 border border-forest-600' : 'hover:bg-forest-800 border border-transparent'}
                    `}
                  >
                    <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${color}`} strokeWidth={1.5} />
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-forest-200 text-xs font-medium truncate">
                        {session.topic || `Sessao de ${modeConfig[session.mode].label}`}
                      </p>
                      <p className="font-mono text-forest-600 text-xs mt-0.5">{formatDate(session.created_at)}</p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, session.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-forest-600 hover:text-rose-400 transition-all flex-shrink-0"
                    >
                      {deletingId === session.id ? (
                        <div className="w-3 h-3 border border-forest-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  </button>
                );
              })
            )}
          </div>
        )}

        <div className={`border-t border-forest-800 ${collapsed ? 'p-3 flex flex-col items-center gap-3' : 'p-4 space-y-3'}`}>
          {!collapsed && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5 text-forest-500" />
                  <span className="font-mono text-forest-500 text-xs">Uso mensal</span>
                </div>
                <span className="font-mono text-forest-400 text-xs">{monthlyCount}/{freeLimit}</span>
              </div>
              <div className="h-1.5 bg-forest-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${usagePercent >= 90 ? 'bg-rose-500' : usagePercent >= 70 ? 'bg-amber-500' : 'bg-mint-500'}`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              {remainingSessions <= 5 && remainingSessions > 0 && (
                <p className="font-mono text-amber-500 text-xs">{remainingSessions} sessoes restantes</p>
              )}
              {remainingSessions === 0 && (
                <p className="font-mono text-rose-400 text-xs">Limite mensal atingido</p>
              )}
            </div>
          )}

          {!collapsed && sessions.length > 0 && (
            <button
              onClick={handleClearAll}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-forest-600 hover:text-rose-400 hover:bg-forest-800 transition-colors"
            >
              <Trash className="w-3.5 h-3.5" />
              <span className="font-mono text-xs">Limpar tudo</span>
            </button>
          )}
        </div>
      </aside>

      {!collapsed && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setCollapsed(true)}
        />
      )}
    </>
  );
}
