/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, BarChart2, Settings, Trophy, Brain, Users, Library } from 'lucide-react';
import { useLearningStore } from '@/src/hooks/useLearningStore';
import { Dashboard } from '@/src/components/Dashboard';
import { Quiz } from '@/src/components/Quiz';
import { Analysis } from '@/src/components/Analysis';
import { UserManagement } from '@/src/components/UserManagement';
import { WordManager } from '@/src/components/WordManager';
import { Button } from '@/components/ui/button';

type View = 'dashboard' | 'quiz' | 'analysis' | 'settings' | 'users' | 'words';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const {
    progress,
    settings,
    users,
    currentUserId,
    allWords,
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
    deleteWord,
  } = useLearningStore();

  const renderView = () => {
    // If no user exists and not on user management, force user management
    if (!currentUserId && currentView !== 'users') {
      return (
        <UserManagement 
          users={users} 
          currentUserId={currentUserId} 
          onAddUser={addUser} 
          onSwitchUser={switchUser} 
          onDeleteUser={deleteUser}
          onClose={() => setCurrentView('dashboard')}
        />
      );
    }

    switch (currentView) {
      case 'users':
        return (
          <UserManagement 
            users={users} 
            currentUserId={currentUserId} 
            onAddUser={addUser} 
            onSwitchUser={switchUser} 
            onDeleteUser={deleteUser}
            onClose={() => setCurrentView('dashboard')}
          />
        );
      case 'dashboard':
        return (
          <Dashboard
            settings={settings}
            progress={progress}
            allWords={allWords}
            onStartQuiz={() => setCurrentView('quiz')}
            onRotateSet={rotateSet}
            onUpdateSettings={updateSettings}
            onStartReview={startReview}
            onReplaceWord={replaceWord}
          />
        );
      case 'quiz':
        return <Quiz settings={settings} progress={progress} allWords={allWords} onComplete={(wordId, isCorrect, format) => updateProgress(wordId, isCorrect, format)} onExit={() => setCurrentView('dashboard')} />;
      case 'analysis':
        return <Analysis progress={progress} onStartReview={startReview} onStartQuiz={() => setCurrentView('quiz')} />;
      case 'words':
        return <WordManager allWords={allWords} onAddWord={addWord} onEditWord={editWord} onDeleteWord={deleteWord} />;
      case 'settings':
        return (
          <div className="p-6 max-w-md mx-auto space-y-6">
            <h2 className="text-2xl font-bold">Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Target Score</label>
                <select 
                  className="w-full p-2 border rounded-md bg-background"
                  value={settings.targetScore}
                  onChange={(e) => updateSettings({ targetScore: Number(e.target.value) as any })}
                >
                  <option value={600}>600</option>
                  <option value={730}>730</option>
                  <option value={860}>860</option>
                  <option value={990}>990</option>
                </select>
              </div>
            </div>
            <Button onClick={() => setCurrentView('dashboard')} className="w-full">Save & Back</Button>
          </div>
        );
      default:
        return (
          <Dashboard
            settings={settings}
            progress={progress}
            allWords={allWords}
            onStartQuiz={() => setCurrentView('quiz')}
            onRotateSet={rotateSet}
            onUpdateSettings={updateSettings}
            onStartReview={startReview}
            onReplaceWord={replaceWord}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-bottom border-[#E5E5E5] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
          <div className="bg-primary text-white p-2 rounded-xl">
            <Brain size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">TOEIC Master</h1>
        </div>
        
        <nav className="hidden md:flex items-center gap-1">
          <NavButton active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} icon={<Trophy size={18} />} label="Dashboard" />
          <NavButton active={currentView === 'analysis'} onClick={() => setCurrentView('analysis')} icon={<BarChart2 size={18} />} label="Analysis" />
          <NavButton active={currentView === 'words'} onClick={() => setCurrentView('words')} icon={<Library size={18} />} label="Words" />
          <NavButton active={currentView === 'users'} onClick={() => setCurrentView('users')} icon={<Users size={18} />} label="Profiles" />
          <NavButton active={currentView === 'settings'} onClick={() => setCurrentView('settings')} icon={<Settings size={18} />} label="Settings" />
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 md:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E5E5] px-6 py-3 flex items-center justify-around z-50">
        <MobileNavButton active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} icon={<Trophy size={24} />} />
        <MobileNavButton active={currentView === 'quiz'} onClick={() => setCurrentView('quiz')} icon={<BookOpen size={24} />} />
        <MobileNavButton active={currentView === 'analysis'} onClick={() => setCurrentView('analysis')} icon={<BarChart2 size={24} />} />
        <MobileNavButton active={currentView === 'words'} onClick={() => setCurrentView('words')} icon={<Library size={24} />} />
        <MobileNavButton active={currentView === 'users'} onClick={() => setCurrentView('users')} icon={<Users size={24} />} />
        <MobileNavButton active={currentView === 'settings'} onClick={() => setCurrentView('settings')} icon={<Settings size={24} />} />
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
        active ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-500 hover:bg-gray-100'
      }`}
    >
      {icon}
      <span>{label}</span>
    </Button>
  );
}

function MobileNavButton({ active, onClick, icon }: { active: boolean; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-xl transition-all ${
        active ? 'text-primary bg-primary/10' : 'text-gray-400'
      }`}
    >
      {icon}
    </button>
  );
}

