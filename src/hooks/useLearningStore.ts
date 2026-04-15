/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { TOEIC_WORDS, Word } from '@/src/data/words';

export interface Progress {
  wordId: string;
  correctCount: number;
  incorrectCount: number;
  lastTested: number;
  masteredFormats: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  targetScore: 600 | 730 | 860 | 990;
  currentSetIds: string[];
  setsByLevel?: Partial<Record<string, string[]>>;
  excludedWordIds?: string[];
}

export interface UserData {
  profile: UserProfile;
  progress: Record<string, Progress>;
  customWords?: Word[];
  wordOverrides?: Record<string, Partial<Omit<Word, 'id'>>>;
}

export function useLearningStore() {
  const [users, setUsers] = useState<Record<string, UserData>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const savedUsers = localStorage.getItem('toeic_users');
    const savedCurrentId = localStorage.getItem('toeic_current_user_id');
    
    if (savedUsers) {
      const parsedUsers = JSON.parse(savedUsers);
      setUsers(parsedUsers);
      
      if (savedCurrentId && parsedUsers[savedCurrentId]) {
        setCurrentUserId(savedCurrentId);
      } else {
        const firstId = Object.keys(parsedUsers)[0];
        if (firstId) setCurrentUserId(firstId);
      }
    }
  }, []);

  const currentUser = currentUserId ? users[currentUserId] : null;
  const progress = currentUser?.progress || {};
  const settings = currentUser?.profile || {
    id: '',
    name: 'Guest',
    targetScore: 600,
    currentSetIds: []
  };

  const excludedIds = new Set(settings.excludedWordIds || []);
  const userCustomWords: Word[] = currentUser?.customWords || [];
  const wordOverrides = currentUser?.wordOverrides || {};
  const allWords: Word[] = [
    ...TOEIC_WORDS
      .filter(w => !excludedIds.has(w.id))
      .map(w => wordOverrides[w.id] ? { ...w, ...wordOverrides[w.id] } : w),
    ...userCustomWords.map(w => wordOverrides[w.id] ? { ...w, ...wordOverrides[w.id] } : w),
  ];

  const saveToStorage = (updatedUsers: Record<string, UserData>, updatedCurrentId?: string) => {
    localStorage.setItem('toeic_users', JSON.stringify(updatedUsers));
    if (updatedCurrentId) {
      localStorage.setItem('toeic_current_user_id', updatedCurrentId);
    }
  };

  const addUser = (name: string) => {
    const id = Date.now().toString();
    const newUser: UserData = {
      profile: {
        id,
        name,
        targetScore: 600,
        currentSetIds: []
      },
      progress: {}
    };
    
    const updatedUsers = { ...users, [id]: newUser };
    setUsers(updatedUsers);
    setCurrentUserId(id);
    saveToStorage(updatedUsers, id);
  };

  const switchUser = (id: string) => {
    if (users[id]) {
      setCurrentUserId(id);
      localStorage.setItem('toeic_current_user_id', id);
    }
  };

  const deleteUser = (id: string) => {
    const updatedUsers = { ...users };
    delete updatedUsers[id];
    setUsers(updatedUsers);
    
    if (currentUserId === id) {
      const nextId = Object.keys(updatedUsers)[0] || null;
      setCurrentUserId(nextId);
      saveToStorage(updatedUsers, nextId || '');
    } else {
      saveToStorage(updatedUsers);
    }
  };

  const updateProgress = (wordId: string, isCorrect: boolean, format?: string) => {
    if (!currentUserId) return;

    setUsers(prev => {
      const user = prev[currentUserId];
      const newProgress = { ...user.progress };
      const current = newProgress[wordId] || { 
        wordId, 
        correctCount: 0, 
        incorrectCount: 0, 
        lastTested: Date.now(),
        masteredFormats: []
      };

      const updated = { 
        ...current,
        masteredFormats: current.masteredFormats || []
      };
      
      if (isCorrect) {
        updated.correctCount += 1;
        if (updated.incorrectCount > 0) updated.incorrectCount -= 1;
        if (format && !updated.masteredFormats.includes(format)) {
          updated.masteredFormats = [...updated.masteredFormats, format];
        }
      } else {
        updated.incorrectCount += 1;
      }
      updated.lastTested = Date.now();
      
      newProgress[wordId] = updated;
      const updatedUsers = {
        ...prev,
        [currentUserId]: { ...user, progress: newProgress }
      };
      saveToStorage(updatedUsers);
      return updatedUsers;
    });
  };

  const updateSettings = (newSettings: Partial<UserProfile>) => {
    if (!currentUserId) return;

    setUsers(prev => {
      const user = prev[currentUserId];
      const oldProfile = user.profile;
      const setsByLevel = { ...(oldProfile.setsByLevel || {}) };
      let updatedProfile = { ...oldProfile, ...newSettings };

      if (newSettings.targetScore && newSettings.targetScore !== oldProfile.targetScore) {
        // Save current set for the old level
        setsByLevel[String(oldProfile.targetScore)] = oldProfile.currentSetIds;
        // Restore saved set for the new level (fall back to empty)
        const savedSet = setsByLevel[String(newSettings.targetScore)] ?? [];
        updatedProfile = { ...updatedProfile, currentSetIds: savedSet, setsByLevel };
      } else if ('currentSetIds' in newSettings && newSettings.currentSetIds !== undefined) {
        // Keep setsByLevel in sync whenever the current set changes
        setsByLevel[String(updatedProfile.targetScore)] = newSettings.currentSetIds;
        updatedProfile = { ...updatedProfile, setsByLevel };
      }

      const updatedUsers = {
        ...prev,
        [currentUserId]: { ...user, profile: updatedProfile }
      };
      saveToStorage(updatedUsers);
      return updatedUsers;
    });
  };

  const rotateSet = (allWords: any[]) => {
    if (!currentUserId) return;
    
    const targetWords = allWords.filter(w => w.level <= settings.targetScore);
    const requiredFormats = ['multiple_choice', 'spelling', 'meaning', 'listening'];
    
    const notMastered = targetWords.filter(w => {
      const p = progress[w.id];
      if (!p) return true;
      return !requiredFormats.every(f => (p.masteredFormats || []).includes(f));
    });

    const pool = notMastered.length > 0 ? notMastered : targetWords;
    const newSet = [...pool].sort(() => Math.random() - 0.5).slice(0, 5).map(w => w.id);

    updateSettings({ currentSetIds: newSet });
  };

  const startReview = (allWords: any[]) => {
    if (!currentUserId) return false;

    const weakWords = allWords
      .filter(w => {
        const p = progress[w.id];
        return p && p.incorrectCount > 0;
      })
      .sort((a, b) => {
        const pa = progress[a.id];
        const pb = progress[b.id];
        return (pb?.incorrectCount || 0) - (pa?.incorrectCount || 0);
      })
      .slice(0, 5)
      .map(w => w.id);

    if (weakWords.length > 0) {
      updateSettings({ currentSetIds: weakWords });
      return true;
    }
    return false;
  };

  const replaceWord = (oldWordId: string, allWords: any[]) => {
    if (!currentUserId) return false;

    const targetWords = allWords.filter(w => w.level <= settings.targetScore);
    const requiredFormats = ['multiple_choice', 'spelling', 'meaning', 'listening'];
    
    const pool = targetWords.filter(w => {
      if (settings.currentSetIds.includes(w.id)) return false;
      const p = progress[w.id];
      if (!p) return true;
      return !requiredFormats.every(f => (p.masteredFormats || []).includes(f));
    });

    if (pool.length > 0) {
      const newWord = pool[Math.floor(Math.random() * pool.length)];
      const newSet = settings.currentSetIds.map(id => id === oldWordId ? newWord.id : id);
      updateSettings({ currentSetIds: newSet });
      return true;
    }
    return false;
  };

  const addWord = (wordData: Omit<Word, 'id'>) => {
    if (!currentUserId) return;
    const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newWord: Word = { id, ...wordData };
    setUsers(prev => {
      const user = prev[currentUserId];
      const updatedUser = {
        ...user,
        customWords: [...(user.customWords || []), newWord],
      };
      const updatedUsers = { ...prev, [currentUserId]: updatedUser };
      saveToStorage(updatedUsers);
      return updatedUsers;
    });
  };

  const editWord = (wordId: string, updates: Partial<Omit<Word, 'id'>>) => {
    if (!currentUserId) return;
    const isCustom = wordId.startsWith('custom_');
    setUsers(prev => {
      const user = prev[currentUserId];
      let updatedUser: UserData;
      if (isCustom) {
        updatedUser = {
          ...user,
          customWords: (user.customWords || []).map(w =>
            w.id === wordId ? { ...w, ...updates } : w
          ),
        };
      } else {
        updatedUser = {
          ...user,
          wordOverrides: { ...(user.wordOverrides || {}), [wordId]: { ...(user.wordOverrides?.[wordId] || {}), ...updates } },
        };
      }
      const updatedUsers = { ...prev, [currentUserId]: updatedUser };
      saveToStorage(updatedUsers);
      return updatedUsers;
    });
  };

  const restoreWord = (wordId: string) => {
    if (!currentUserId) return;
    setUsers(prev => {
      const user = prev[currentUserId];
      const newOverrides = { ...(user.wordOverrides || {}) };
      delete newOverrides[wordId];
      const newExcluded = (user.profile.excludedWordIds || []).filter(id => id !== wordId);
      const updatedUser: UserData = {
        ...user,
        wordOverrides: newOverrides,
        profile: { ...user.profile, excludedWordIds: newExcluded },
      };
      const updatedUsers = { ...prev, [currentUserId]: updatedUser };
      saveToStorage(updatedUsers);
      return updatedUsers;
    });
  };

  const deleteWord = (wordId: string) => {
    if (!currentUserId) return;
    const isCustom = wordId.startsWith('custom_');
    setUsers(prev => {
      const user = prev[currentUserId];
      const updatedUser = isCustom
        ? { ...user, customWords: (user.customWords || []).filter(w => w.id !== wordId) }
        : {
            ...user,
            profile: {
              ...user.profile,
              excludedWordIds: [...(user.profile.excludedWordIds || []), wordId],
            },
          };
      const updatedUsers = { ...prev, [currentUserId]: updatedUser };
      saveToStorage(updatedUsers);
      return updatedUsers;
    });
  };

  return {
    progress,
    settings,
    users,
    currentUserId,
    allWords,
    excludedWordIds: settings.excludedWordIds || [],
    wordOverrides,
    addUser,
    switchUser,
    deleteUser,
    updateProgress,
    updateSettings,
    rotateSet,
    startReview,
    replaceWord,
    addWord,
    editWord,
    restoreWord,
    deleteWord,
  };
}
