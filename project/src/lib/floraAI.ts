import type { Message, StudyMode } from '../types/database';

export async function callFloraAI(
  messages: Message[],
  mode: StudyMode,
  topic: string
): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages, mode, topic }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(err.error || 'Falha ao obter resposta da IA');
  }

  const data = await res.json();
  return data.content as string;
}
