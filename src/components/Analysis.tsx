/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, TrendingUp, Award, BookOpen } from 'lucide-react';
import { Progress as ProgressType } from '@/src/hooks/useLearningStore';
import { TOEIC_WORDS } from '@/src/data/words';

interface AnalysisProps {
  progress: Record<string, ProgressType>;
  onStartReview: (words: any[]) => boolean;
  onStartQuiz: () => void;
}

export function Analysis({ progress, onStartReview, onStartQuiz }: AnalysisProps) {
  const statsByLevel = useMemo(() => {
    const levels = [600, 730, 860, 990];
    return levels.map(level => {
      const levelWords = TOEIC_WORDS.filter(w => w.level === level);
      const mastered = levelWords.filter(w => {
        const p = progress[w.id];
        const requiredFormats = ['multiple_choice', 'spelling', 'meaning', 'listening'];
        return p && p.masteredFormats && requiredFormats.every(f => p.masteredFormats.includes(f));
      }).length;
      
      return {
        level: `Level ${level}`,
        mastered,
        total: levelWords.length,
        percentage: Math.round((mastered / levelWords.length) * 100) || 0
      };
    });
  }, [progress]);

  const weakWords = useMemo(() => {
    return Object.values(progress)
      .filter(p => p.incorrectCount > 0)
      .sort((a, b) => b.incorrectCount - a.incorrectCount)
      .slice(0, 5)
      .map(p => {
        const word = TOEIC_WORDS.find(w => w.id === p.wordId);
        return { ...p, word };
      })
      .filter(item => item.word !== undefined);
  }, [progress]);

  const totalMastered = statsByLevel.reduce((acc, curr) => acc + curr.mastered, 0);
  const totalWords = TOEIC_WORDS.length;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Mastery Chart */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Mastery by Level
            </CardTitle>
            <CardDescription>Progress across different TOEIC score targets</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsByLevel}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="level" axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#f8f9fa' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-100">
                          <p className="font-bold">{data.level}</p>
                          <p className="text-sm text-muted-foreground">{data.mastered} / {data.total} words ({data.percentage}%)</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                  {statsByLevel.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.percentage > 70 ? '#10b981' : entry.percentage > 30 ? '#3b82f6' : '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weak Points */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" /> Weak Points
                </CardTitle>
                <CardDescription>Words you've struggled with recently</CardDescription>
              </div>
              {weakWords.length > 0 && (
                <Button size="sm" variant="outline" onClick={() => onStartReview(TOEIC_WORDS) && onStartQuiz()} className="border-red-200 text-red-600 hover:bg-red-50">
                  Review All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              {weakWords.length > 0 ? (
                <div className="space-y-4">
                  {weakWords.map((item) => (
                    <div key={item.wordId} className="flex items-center justify-between p-4 rounded-xl bg-red-50/50 border border-red-100">
                      <div className="space-y-1">
                        <p className="font-bold text-lg">{item.word?.term}</p>
                        <p className="text-sm text-muted-foreground">{item.word?.meaning}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive" className="mb-1">
                          {item.incorrectCount} Errors
                        </Badge>
                        <p className="text-[10px] uppercase tracking-wider font-bold opacity-50">Level {item.word?.level}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
                  <Award className="h-12 w-12 text-yellow-500 opacity-20" />
                  <p className="text-muted-foreground">No weak points detected yet. Keep learning!</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="bg-primary text-white border-none shadow-lg">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm opacity-80">Total Mastered</p>
              <p className="text-2xl font-bold">{totalMastered} / {totalWords}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-none shadow-sm">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-xl">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Overall Accuracy</p>
              <p className="text-2xl font-bold">
                {Math.round((Object.values(progress).reduce((a, b) => a + b.correctCount, 0) / 
                (Object.values(progress).reduce((a, b) => a + b.correctCount + b.incorrectCount, 0) || 1)) * 100)}%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-sm">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-xl">
              <Award className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Learning Streak</p>
              <p className="text-2xl font-bold">1 Day</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
