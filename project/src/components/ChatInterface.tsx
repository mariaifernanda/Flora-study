import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Copy, Check } from 'lucide-react';
import type { Message, StudyMode } from '../types/database';
import { callFloraAI } from '../lib/floraAI';

interface ChatInterfaceProps {
  mode: StudyMode;
  topic: string;
  messages: Message[];
  onMessagesUpdate: (messages: Message[]) => void;
  onTopicDetected?: (topic: string) => void;
}

const placeholders: Record<StudyMode, string> = {
  explain: 'O que voce gostaria de entender? (ex: "Como funciona a fotossintese?")',
  quiz: 'Digite um tema para ser testado (ex: "Segunda Guerra Mundial")',
  review: 'O que devemos revisar? (ex: "Basico de quimica organica")',
  flashcard: 'Gerar flashcards sobre... (ex: "Verbos irregulares em ingles")',
};

function MessageContent({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = content.split('\n');
  const rendered = lines.map((line, i) => {
    if (line.startsWith('# ')) return <h1 key={i} className="font-lora text-lg font-semibold text-white mt-3 mb-1">{line.slice(2)}</h1>;
    if (line.startsWith('## ')) return <h2 key={i} className="font-lora text-base font-semibold text-forest-200 mt-2 mb-1">{line.slice(3)}</h2>;
    if (line.startsWith('### ')) return <h3 key={i} className="font-lora text-sm font-semibold text-forest-300 mt-2 mb-0.5">{line.slice(4)}</h3>;
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return <li key={i} className="font-mono text-forest-200 text-sm ml-4 list-disc">{renderInline(line.slice(2))}</li>;
    }
    if (line.match(/^\d+\. /)) {
      return <li key={i} className="font-mono text-forest-200 text-sm ml-4 list-decimal">{renderInline(line.replace(/^\d+\. /, ''))}</li>;
    }
    if (line.startsWith('**Q:**') || line.startsWith('**Q: **')) {
      return (
        <div key={i} className="bg-forest-800 border border-forest-600 rounded-lg px-4 py-3 my-2">
          <span className="font-mono text-mint-400 text-xs font-medium uppercase tracking-wider">P</span>
          <p className="font-mono text-white text-sm mt-1">{line.replace(/\*\*Q:\*\*\s*|\*\*Q: \*\*\s*/g, '')}</p>
        </div>
      );
    }
    if (line.startsWith('**A:**') || line.startsWith('**A: **')) {
      return (
        <div key={i} className="bg-forest-900 border border-forest-700 rounded-lg px-4 py-3 my-2">
          <span className="font-mono text-amber-400 text-xs font-medium uppercase tracking-wider">R</span>
          <p className="font-mono text-forest-200 text-sm mt-1">{line.replace(/\*\*A:\*\*\s*|\*\*A: \*\*\s*/g, '')}</p>
        </div>
      );
    }
    if (line === '') return <br key={i} />;
    return <p key={i} className="font-mono text-forest-200 text-sm leading-relaxed">{renderInline(line)}</p>;
  });

  return (
    <div className="group relative">
      <div className="space-y-0.5">{rendered}</div>
      <button
        onClick={handleCopy}
        className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-forest-700 text-forest-400 hover:text-white transition-all"
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      </button>
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="bg-forest-800 text-mint-300 px-1 py-0.5 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

export default function ChatInterface({
  mode, topic, messages, onMessagesUpdate, onTopicDetected,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setError(null);
    const userMsg: Message = { role: 'user', content: trimmed, timestamp: new Date().toISOString() };
    const newMessages = [...messages, userMsg];
    onMessagesUpdate(newMessages);
    setInput('');

    if (messages.length === 0 && onTopicDetected && !topic) {
      const words = trimmed.split(' ').slice(0, 6).join(' ');
      onTopicDetected(words);
    }

    setLoading(true);
    try {
      const content = await callFloraAI(
        newMessages.map(m => ({ role: m.role, content: m.content })),
        mode,
        topic
      );
      const assistantMsg: Message = { role: 'assistant', content, timestamp: new Date().toISOString() };
      onMessagesUpdate([...newMessages, assistantMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao obter resposta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const adjustHeight = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
            <p className="font-lora text-forest-500 text-lg text-center max-w-sm">
              Comece uma conversa para iniciar sua sessao de estudo.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-forest-800 border border-forest-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="font-lora text-mint-400 text-xs font-bold">F</span>
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-forest-700 border border-forest-600'
                : 'bg-forest-900 border border-forest-700'
            }`}>
              {msg.role === 'assistant' ? (
                <MessageContent content={msg.content} />
              ) : (
                <p className="font-mono text-white text-sm leading-relaxed">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-lg bg-forest-800 border border-forest-600 flex items-center justify-center flex-shrink-0">
              <span className="font-lora text-mint-400 text-xs font-bold">F</span>
            </div>
            <div className="bg-forest-900 border border-forest-700 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 text-mint-400 animate-spin" />
                <span className="font-mono text-forest-500 text-xs">Flora esta pensando...</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-rose-950/50 border border-rose-800 rounded-xl px-4 py-3">
            <p className="font-mono text-rose-300 text-xs">{error}</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="px-4 pb-4">
        <div className="flex items-end gap-2 bg-forest-900 border border-forest-700 rounded-2xl px-4 py-3 focus-within:border-mint-600 transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); adjustHeight(); }}
            onKeyDown={handleKeyDown}
            placeholder={placeholders[mode]}
            rows={1}
            className="flex-1 bg-transparent font-mono text-white text-sm placeholder-forest-600 resize-none outline-none leading-relaxed"
            style={{ minHeight: '24px', maxHeight: '120px' }}
            disabled={loading}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || loading}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-mint-600 hover:bg-mint-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all duration-200 active:scale-95 flex-shrink-0"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
        <p className="font-mono text-forest-700 text-xs mt-1.5 text-center">
          Enter para enviar · Shift+Enter para nova linha
        </p>
      </div>
    </div>
  );
}
