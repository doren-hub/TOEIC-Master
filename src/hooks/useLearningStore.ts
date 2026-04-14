/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';

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
}

export interface UserData {
  profile: UserProfile;
  progress: Record<string, Progress>;
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

  return { 
    progress, 
    settings, 
    users,
    currentUserId,
    addUser,
    switchUser,
    deleteUser,
    updateProgress, 
    updateSettings, 
    rotateSet, 
    startReview, 
    replaceWord 
  };
}
