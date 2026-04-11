/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, BookOpen, Star, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { UserProfile, Progress as ProgressType } from '@/src/hooks/useLearningStore';
import { TOEIC_WORDS } from '@/src/data/words';
import { useEffect } from 'react';

interface DashboardProps {
  settings: UserProfile;
  progress: Record<string, ProgressType>;
  onStartQuiz: () => void;
  onRotateSet: (words: any[]) => void;
  onUpdateSettings: (settings: Partial<UserProfile>) => void;
  onStartReview: (words: any[]) => boolean;
  onReplaceWord: (wordId: string, words: any[]) => boolean;
}

export function Dashboard({ settings, progress, onStartQuiz, onRotateSet, onUpdateSettings, onStartReview, onReplaceWord }: DashboardProps) {
  const targetWords = TOEIC_WORDS.filter(w => w.level <= settings.targetScore);
  
  const weakWordsCount = Object.values(progress).filter(p => p.incorrectCount > 0).length;

  const handleStartReview = () => {
    const success = onStartReview(TOEIC_WORDS);
    if (success) {
      onStartQuiz();
    }
  };
  
  // Initialize set if empty
  useEffect(() => {
    if (settings.currentSetIds.length === 0) {
      onRotateSet(TOEIC_WORDS);
    }
  }, [settings.currentSetIds, onRotateSet]);

  const handleLevelSwitch = (level: number) => {
    onUpdateSettings({ 
      targetScore: level as 600 | 730 | 860 | 990,
      currentSetIds: [] // Clear current set to trigger a new one for the new level
    });
  };

  const currentSetWords = TOEIC_WORDS.filter(w => settings.currentSetIds.includes(w.id));
  const requiredFormats = ['multiple_choice', 'spelling', 'meaning', 'listening'];
  
  const masteredInSet = currentSetWords.filter(w => {
    const p = progress[w.id];
    return p && p.masteredFormats && requiredFormats.every(f => p.masteredFormats.includes(f));
  });

  const isSetMastered = masteredInSet.length === currentSetWords.length && currentSetWords.length > 0;

  const learnedCount = Object.keys(progress).filter(id => {
    const p = progress[id];
    return p && p.masteredFormats && requiredFormats.every(f => p.masteredFormats.includes(f));
  }).length;
  
  const progressPercentage = Math.round((learnedCount / targetWords.length) * 100) || 0;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <section className="flex flex-col md:flex-row gap-6 items-start justify-between">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Welcome back, {settings.name}!</h2>
          <p className="text-muted-foreground text-lg">You're on your way to reaching TOEIC {settings.targetScore}.</p>
        </div>
        <div className="flex gap-3">
          {weakWordsCount > 0 && (
            <Button variant="outline" size="lg" onClick={handleStartReview} className="h-14 px-6 rounded-2xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
              <AlertCircle className="mr-2 h-5 w-5" /> Review ({weakWordsCount})
            </Button>
          )}
          <Button variant="outline" size="lg" onClick={() => onRotateSet(TOEIC_WORDS)} className="h-14 px-6 rounded-2xl">
            <RefreshCw className="mr-2 h-5 w-5" /> New Set
          </Button>
          <Button size="lg" onClick={onStartQuiz} className="h-14 px-8 text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all">
            <BookOpen className="mr-2 h-5 w-5" /> Start Learning
          </Button>
        </div>
      </section>

      {/* Current Set Section */}
      <Card className="border-none shadow-md bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Current Learning Set</CardTitle>
            <CardDescription>Focus on these 5 words to master them</CardDescription>
          </div>
          {isSetMastered && (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 px-3 py-1 text-sm">
              <CheckCircle className="mr-1 h-4 w-4" /> All Mastered!
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {currentSetWords.map(word => {
              const p = progress[word.id];
              const mastered = p && p.masteredFormats && requiredFormats.every(f => p.masteredFormats.includes(f));
              return (
                <div key={word.id} className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center relative group ${mastered ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-transparent'}`}>
                  {mastered && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-white shadow-sm border border-green-100 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onReplaceWord(word.id, TOEIC_WORDS)}
                      title="Replace with new word"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                  <p className="font-bold text-center">{word.term}</p>
                  <p className="text-xs text-center text-muted-foreground mt-1 truncate w-full">{word.meaning}</p>
                  <div className="flex gap-1 mt-3">
                    {requiredFormats.map(f => {
                      const isFormatMastered = p?.masteredFormats?.includes(f);
                      return (
                        <div 
                          key={f} 
                          className={`w-2 h-2 rounded-full ${isFormatMastered ? 'bg-green-500' : 'bg-gray-300'}`}
                          title={f.replace('_', ' ')}
                        />
                      );
                    })}
                  </div>
                  {mastered && <CheckCircle className="h-4 w-4 text-green-500 mt-2" />}
                </div>
              );
            })}
          </div>
          {isSetMastered && (
            <div className="mt-6 p-4 bg-primary/5 rounded-xl flex items-center justify-between">
              <p className="text-sm font-medium">You've mastered this set! Ready for new words?</p>
              <Button size="sm" onClick={() => onRotateSet(TOEIC_WORDS)}>
                Get Next Set
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" /> Progress to Goal
            </CardDescription>
            <CardTitle className="text-4xl font-bold">{progressPercentage}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progressPercentage} className="h-2" />
            <p className="mt-2 text-sm text-muted-foreground">{learnedCount} / {targetWords.length} words mastered</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" /> Current Level
            </CardDescription>
            <CardTitle className="text-4xl font-bold">{settings.targetScore}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
              Target Score
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-orange-500" /> Mastery
            </CardDescription>
            <CardTitle className="text-4xl font-bold">{learnedCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Words with positive score</p>
          </CardContent>
        </Card>
      </div>

      {/* Categories / Levels */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold">Learning Paths</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[600, 730, 860, 990].map((level) => (
            <Card 
              key={level} 
              onClick={() => handleLevelSwitch(level)}
              className={`cursor-pointer transition-all hover:scale-[1.02] border-2 ${
                settings.targetScore === level ? 'border-primary bg-primary/5' : 'border-transparent'
              }`}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Level {level}</span>
                  {settings.targetScore === level && <Badge>Target</Badge>}
                </CardTitle>
                <CardDescription>
                  {TOEIC_WORDS.filter(w => w.level === level).length} words
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
