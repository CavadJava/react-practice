import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'teslahubs_english_notes';

export type EnglishLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export const ENGLISH_LEVELS: EnglishLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export type EnglishNote = {
  id: string;
  word: string;
  // Multiple example sentences per word — a word is often worth several
  // usage examples, not just one.
  sentences: string[];
  level: EnglishLevel;
  createdAt: number;
};

type EnglishNotesContextValue = {
  notes: EnglishNote[];
  addNote: (note: Omit<EnglishNote, 'id' | 'createdAt'>) => void;
  updateNote: (id: string, note: Omit<EnglishNote, 'id' | 'createdAt'>) => void;
  removeNote: (id: string) => void;
};

const EnglishNotesContext = createContext<EnglishNotesContextValue | undefined>(undefined);

export function EnglishNotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<EnglishNote[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(stored => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            // Migrate old single-`sentence` records to `sentences: string[]`.
            const migrated = parsed.map((n: EnglishNote & { sentence?: string }) =>
              Array.isArray(n.sentences) ? n : { ...n, sentences: n.sentence ? [n.sentence] : [] },
            );
            setNotes(migrated);
          }
        } catch {
          // ignore malformed storage
        }
      }
    });
  }, []);

  const persist = (updater: (prev: EnglishNote[]) => EnglishNote[]) => {
    setNotes(prev => {
      const next = updater(prev);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const addNote = (note: Omit<EnglishNote, 'id' | 'createdAt'>) => {
    persist(prev => [{ ...note, id: `${Date.now()}`, createdAt: Date.now() }, ...prev]);
  };

  const updateNote = (id: string, note: Omit<EnglishNote, 'id' | 'createdAt'>) => {
    persist(prev => prev.map(n => (n.id === id ? { ...n, ...note } : n)));
  };

  const removeNote = (id: string) => {
    persist(prev => prev.filter(n => n.id !== id));
  };

  return <EnglishNotesContext.Provider value={{ notes, addNote, updateNote, removeNote }}>{children}</EnglishNotesContext.Provider>;
}

export function useEnglishNotes() {
  const ctx = useContext(EnglishNotesContext);
  if (!ctx) throw new Error('useEnglishNotes must be used within EnglishNotesProvider');
  return ctx;
}
