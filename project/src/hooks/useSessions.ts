import { useState, useEffect, useCallback } from 'react';
import type { StudySession, StudyMode, Message } from '../types/database';

const STORAGE_KEY = 'flora_sessions';
const USAGE_KEY = 'flora_usage';
const FREE_SESSION_LIMIT = 20;

function getMonthYear() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function loadFromStorage(): StudySession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(sessions: StudySession[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

function loadUsage(): Record<string, number> {
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveUsage(usage: Record<string, number>) {
  localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
}

export function useSessions() {
  const [sessions, setSessions] = useState<StudySession[]>(loadFromStorage);
  const [activeSession, setActiveSession] = useState<StudySession | null>(null);
  const loading = false;

  const monthYear = getMonthYear();
  const usage = loadUsage();
  const monthlyCount = usage[monthYear] ?? 0;

  const canCreateSession = monthlyCount < FREE_SESSION_LIMIT;
  const remainingSessions = FREE_SESSION_LIMIT - monthlyCount;

  useEffect(() => {
    saveToStorage(sessions);
  }, [sessions]);

  const createSession = useCallback((mode: StudyMode, topic: string): StudySession | null => {
    if (!canCreateSession) return null;

    const session: StudySession = {
      id: crypto.randomUUID(),
      user_id: '',
      mode,
      topic,
      messages: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedUsage = { ...usage, [monthYear]: monthlyCount + 1 };
    saveUsage(updatedUsage);

    setSessions(prev => [session, ...prev]);
    setActiveSession(session);
    return session;
  }, [canCreateSession, usage, monthYear, monthlyCount]);

  const updateSession = useCallback((sessionId: string, messages: Message[]) => {
    const updatedAt = new Date().toISOString();
    setSessions(prev =>
      prev.map(s => s.id === sessionId ? { ...s, messages, updated_at: updatedAt } : s)
    );
    if (activeSession?.id === sessionId) {
      setActiveSession(prev => prev ? { ...prev, messages, updated_at: updatedAt } : null);
    }
  }, [activeSession?.id]);

  const updateSessionTopic = useCallback((sessionId: string, topic: string) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, topic } : s));
    if (activeSession?.id === sessionId) {
      setActiveSession(prev => prev ? { ...prev, topic } : null);
    }
  }, [activeSession?.id]);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeSession?.id === sessionId) setActiveSession(null);
  }, [activeSession?.id]);

  const loadSession = useCallback((session: StudySession) => {
    setActiveSession(session);
  }, []);

  return {
    sessions,
    activeSession,
    monthlyCount,
    remainingSessions,
    canCreateSession,
    loading,
    createSession,
    updateSession,
    updateSessionTopic,
    deleteSession,
    loadSession,
    FREE_SESSION_LIMIT,
  };
}
