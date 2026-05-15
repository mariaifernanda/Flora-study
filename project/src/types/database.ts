export type StudyMode = 'explain' | 'quiz' | 'review' | 'flashcard';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface StudySession {
  id: string;
  user_id: string;
  mode: StudyMode;
  topic: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface UsageTracking {
  id: string;
  user_id: string;
  month_year: string;
  session_count: number;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at'>;
        Update: Partial<Omit<Profile, 'id'>>;
      };
      study_sessions: {
        Row: StudySession;
        Insert: Omit<StudySession, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<StudySession, 'id' | 'created_at'>>;
      };
      usage_tracking: {
        Row: UsageTracking;
        Insert: Omit<UsageTracking, 'id'>;
        Update: Partial<Omit<UsageTracking, 'id'>>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
