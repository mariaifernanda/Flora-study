import { BookOpen, HelpCircle, RotateCcw, Layers, Image as ImageIcon, MessageSquare } from 'lucide-react';
import type { StudyMode } from '../types/database';
import ImageSearch from './ImageSearch';

interface ModePanelProps {
  mode: StudyMode;
  topic: string;
  activeTab: 'chat' | 'images';
  onTabChange: (tab: 'chat' | 'images') => void;
}

const modeInfo: Record<StudyMode, {
  label: string;
  Icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  description: string;
  tips: string[];
}> = {
  explain: {
    label: 'Explicar',
    Icon: BookOpen,
    color: 'text-blue-400',
    bg: 'bg-blue-950/30',
    border: 'border-blue-800/50',
    description: 'Peca a Flora para explicar qualquer conceito em profundidade.',
    tips: ['Faca perguntas de acompanhamento', 'Peca explicacoes mais simples', 'Peca exemplos'],
  },
  quiz: {
    label: 'Quiz',
    Icon: HelpCircle,
    color: 'text-amber-400',
    bg: 'bg-amber-950/30',
    border: 'border-amber-800/50',
    description: 'Teste seus conhecimentos com perguntas interativas.',
    tips: ['Flora se adapta ao seu nivel', 'Peca dicas se travar', 'Peca perguntas mais dificeis'],
  },
  review: {
    label: 'Revisar',
    Icon: RotateCcw,
    color: 'text-mint-400',
    bg: 'bg-forest-800/50',
    border: 'border-forest-600/50',
    description: 'Obtenha resumos estruturados e material de revisao.',
    tips: ['Peca pontos-chave', 'Peca revisao focada em prova', 'Peca truques de memorizacao'],
  },
  flashcard: {
    label: 'Flashcard',
    Icon: Layers,
    color: 'text-rose-400',
    bg: 'bg-rose-950/30',
    border: 'border-rose-800/50',
    description: 'Gere pares de flashcards para repeticao espacada.',
    tips: ['Especifique o numero de cartoes', 'Peca subtopicos especificos', 'Peca nivel de dificuldade'],
  },
};

export default function ModePanel({ mode, topic, activeTab, onTabChange }: ModePanelProps) {
  const info = modeInfo[mode];
  const { Icon } = info;

  return (
    <div className="flex flex-col h-full">
      <div className={`mx-3 mt-3 mb-2 rounded-xl border p-3 ${info.bg} ${info.border}`}>
        <div className="flex items-center gap-2 mb-1">
          <Icon className={`w-4 h-4 ${info.color}`} strokeWidth={1.5} />
          <span className={`font-mono text-xs font-medium uppercase tracking-wider ${info.color}`}>Modo {info.label}</span>
        </div>
        <p className="font-mono text-forest-400 text-xs">{info.description}</p>
        <div className="flex flex-wrap gap-1 mt-2">
          {info.tips.map((tip, i) => (
            <span key={i} className="font-mono text-forest-600 text-xs bg-forest-900/50 border border-forest-800 px-2 py-0.5 rounded-full">
              {tip}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1 px-3 pb-2">
        <button
          onClick={() => onTabChange('chat')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs transition-colors ${
            activeTab === 'chat' ? 'bg-forest-700 text-white' : 'text-forest-500 hover:text-forest-300'
          }`}
        >
          <MessageSquare className="w-3 h-3" />
          Chat
        </button>
        <button
          onClick={() => onTabChange('images')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs transition-colors ${
            activeTab === 'images' ? 'bg-forest-700 text-white' : 'text-forest-500 hover:text-forest-300'
          }`}
        >
          <ImageIcon className="w-3 h-3" />
          Imagens
        </button>
      </div>

      {activeTab === 'images' && (
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <ImageSearch defaultQuery={topic} />
        </div>
      )}
    </div>
  );
}
