import { useState } from 'react';
import { BookOpen, HelpCircle, RotateCcw, Layers } from 'lucide-react';
import type { StudyMode } from '../types/database';
import { useSessions } from '../hooks/useSessions';
import Sidebar from '../components/Sidebar';
import ChatInterface from '../components/ChatInterface';
import ModePanel from '../components/ModePanel';

const modeConfig: Record<StudyMode, { label: string; Icon: React.ElementType; color: string; accent: string }> = {
  explain: { label: 'Explicar', Icon: BookOpen, color: 'text-blue-400', accent: 'border-blue-600' },
  quiz: { label: 'Quiz', Icon: HelpCircle, color: 'text-amber-400', accent: 'border-amber-600' },
  review: { label: 'Revisar', Icon: RotateCcw, color: 'text-mint-400', accent: 'border-mint-600' },
  flashcard: { label: 'Flashcard', Icon: Layers, color: 'text-rose-400', accent: 'border-rose-600' },
};

export default function StudyPage() {
  const {
    sessions, activeSession, monthlyCount, remainingSessions, canCreateSession,
    loading, createSession, updateSession, updateSessionTopic, deleteSession, loadSession,
    FREE_SESSION_LIMIT,
  } = useSessions();

  const [activeTab, setActiveTab] = useState<'chat' | 'images'>('chat');
  const [creating, setCreating] = useState(false);

  const handleNewSession = (mode: StudyMode) => {
    if (!canCreateSession) return;
    setCreating(true);
    createSession(mode, '');
    setCreating(false);
    setActiveTab('chat');
  };

  const handleMessagesUpdate = (messages: Message[]) => {
    if (!activeSession) return;
    updateSession(activeSession.id, messages);
  };

  const handleTopicDetected = (topic: string) => {
    if (!activeSession || activeSession.topic) return;
    updateSessionTopic(activeSession.id, topic);
  };

  return (
    <div className="flex h-screen bg-forest-950 overflow-hidden">
      <Sidebar
        sessions={sessions}
        activeSession={activeSession}
        monthlyCount={monthlyCount}
        remainingSessions={remainingSessions}
        freeLimit={FREE_SESSION_LIMIT}
        onNewSession={handleNewSession}
        onLoadSession={loadSession}
        onDeleteSession={deleteSession}
        canCreate={canCreateSession}
      />

      <main className="flex-1 flex overflow-hidden">
        {activeSession ? (
          <>
            <div className="flex-1 flex flex-col min-w-0">
              <header className="flex items-center gap-3 px-6 py-4 border-b border-forest-800 bg-forest-950/80 backdrop-blur-sm">
                {(() => {
                  const { Icon, color, label, accent } = modeConfig[activeSession.mode];
                  return (
                    <>
                      <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg bg-forest-800 border ${accent}`}>
                        <Icon className={`w-3.5 h-3.5 ${color}`} strokeWidth={1.5} />
                        <span className={`font-mono text-xs font-medium ${color}`}>{label}</span>
                      </div>
                      <h1 className="font-lora text-white text-base font-medium truncate">
                        {activeSession.topic || 'Nova Sessao'}
                      </h1>
                      <span className="ml-auto font-mono text-forest-600 text-xs">
                        {activeSession.messages.length} mensagens
                      </span>
                    </>
                  );
                })()}
              </header>

              <div className="flex-1 overflow-hidden">
                {activeTab === 'chat' ? (
                  <ChatInterface
                    mode={activeSession.mode}
                    topic={activeSession.topic}
                    messages={activeSession.messages}
                    onMessagesUpdate={handleMessagesUpdate}
                    onTopicDetected={handleTopicDetected}
                  />
                ) : (
                  <div className="h-full overflow-y-auto p-4" />
                )}
              </div>
            </div>

            <div className="hidden lg:flex w-72 flex-col border-l border-forest-800 overflow-hidden">
              <ModePanel
                mode={activeSession.mode}
                topic={activeSession.topic}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            </div>
          </>
        ) : (
          <WelcomeScreen
            loading={loading}
            creating={creating}
            canCreate={canCreateSession}
            remainingSessions={remainingSessions}
            freeLimit={FREE_SESSION_LIMIT}
            onNewSession={handleNewSession}
          />
        )}
      </main>
    </div>
  );
}

import type { Message } from '../types/database';

interface WelcomeScreenProps {
  loading: boolean;
  creating: boolean;
  canCreate: boolean;
  remainingSessions: number;
  freeLimit: number;
  onNewSession: (mode: StudyMode) => void;
}

function WelcomeScreen({ loading, creating, canCreate, remainingSessions, freeLimit, onNewSession }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
      <div className="text-center">
        <h1 className="font-lora text-4xl font-semibold text-white mb-3">
          O que voce gostaria de estudar?
        </h1>
        <p className="font-mono text-forest-500 text-sm">
          Escolha um modo para iniciar sua sessao
        </p>
      </div>

      {!loading && (
        <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
          {(Object.entries(modeConfig) as [StudyMode, typeof modeConfig.explain][]).map(([mode, { label, Icon, color, accent }]) => (
            <button
              key={mode}
              onClick={() => onNewSession(mode)}
              disabled={!canCreate || creating}
              className={`
                group flex flex-col items-start gap-3 p-5 rounded-2xl
                bg-forest-900 border border-forest-700 hover:border-opacity-100
                hover:bg-forest-800 disabled:opacity-40 disabled:cursor-not-allowed
                transition-all duration-200 active:scale-[0.98] text-left
                hover:${accent}
              `}
            >
              <div className={`w-10 h-10 rounded-xl bg-forest-800 border ${accent} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <Icon className={`w-5 h-5 ${color}`} strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-lora text-white text-base font-medium">{label}</p>
                <p className="font-mono text-forest-500 text-xs mt-0.5">
                  {mode === 'explain' && 'Explicacoes detalhadas'}
                  {mode === 'quiz' && 'Testes interativos'}
                  {mode === 'review' && 'Resumos estruturados'}
                  {mode === 'flashcard' && 'Cartoes de memorizacao'}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-mint-600 border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-forest-500 text-sm">Carregando...</span>
        </div>
      )}

      {!loading && !canCreate && (
        <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl px-6 py-4 text-center max-w-sm">
          <p className="font-mono text-amber-300 text-sm font-medium">Limite mensal atingido</p>
          <p className="font-mono text-amber-600 text-xs mt-1">
            Voce usou todas as {freeLimit} sessoes gratuitas deste mes. Reinicia no dia 1.
          </p>
        </div>
      )}

      {!loading && canCreate && (
        <p className="font-mono text-forest-700 text-xs">
          {remainingSessions} de {freeLimit} sessoes restantes este mes
        </p>
      )}
    </div>
  );
}
