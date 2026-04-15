/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, ArrowRight, Volume2, HelpCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Word } from '@/src/data/words';
import { UserProfile, Progress as ProgressType } from '@/src/hooks/useLearningStore';

interface QuizProps {
  settings: UserProfile;
  progress: Record<string, ProgressType>;
  allWords: Word[];
  onComplete: (wordId: string, isCorrect: boolean, format: string) => void;
  onExit: () => void;
}

type QuestionType = 'multiple_choice' | 'spelling' | 'meaning' | 'listening';

interface Question {
  word: Word;
  type: QuestionType;
  options?: string[];
}

export function Quiz({ settings, progress, allWords, onComplete, onExit }: QuizProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);

  // キーボードナビゲーション用 refs
  const inputRef    = useRef<HTMLInputElement>(null);
  const nextBtnRef  = useRef<HTMLButtonElement>(null);
  const optionRefs  = useRef<(HTMLButtonElement | null)[]>([]);
  // 最新の関数を保持（クロージャ問題を回避）
  const handleAnswerRef  = useRef<(ans: string) => void>(() => {});
  const nextQuestionRef  = useRef<() => void>(() => {});

  const isReviewMode = useMemo(() => {
    // If any word in the current set has been failed before, consider it a review session
    // (This is a simple heuristic since we don't pass an explicit flag)
    return questions.some(q => q.word.id === settings.currentSetIds[0]); 
  }, [questions, settings.currentSetIds]);

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    // 前の発話をキャンセルしてからキューに追加
    window.speechSynthesis.cancel();

    const doSpeak = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      // 英語音声を優先選択
      const voices = window.speechSynthesis.getVoices();
      const enVoice = voices.find(v => v.lang.startsWith('en') && v.localService)
                   ?? voices.find(v => v.lang.startsWith('en'));
      if (enVoice) utterance.voice = enVoice;
      window.speechSynthesis.speak(utterance);
    };

    // voices がまだ読み込まれていない場合は待機
    if (window.speechSynthesis.getVoices().length > 0) {
      doSpeak();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        doSpeak();
      };
    }
  };

  // Generate questions on mount
  useEffect(() => {
    // Use current set if available, otherwise fallback to random
    const pool = settings.currentSetIds.length > 0 
      ? allWords.filter(w => settings.currentSetIds.includes(w.id))
      : allWords.filter(w => w.level <= settings.targetScore).sort(() => Math.random() - 0.5).slice(0, 5);
    
    // Duplicate pool to make 10 questions if needed, or just use pool
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    
    const generatedQuestions: Question[] = shuffled.map(word => {
      const p = progress[word.id];
      const masteredFormats = p?.masteredFormats || [];
      const requiredFormats: QuestionType[] = ['multiple_choice', 'spelling', 'meaning', 'listening'];
      
      // Filter formats that are not yet mastered
      const unmasteredFormats = requiredFormats.filter(f => !masteredFormats.includes(f));
      
      // If there are unmastered formats, pick one of them. Otherwise, pick any.
      const availableFormats = unmasteredFormats.length > 0 ? unmasteredFormats : requiredFormats;
      const type = availableFormats[Math.floor(Math.random() * availableFormats.length)];
      
      let options: string[] = [];
      if (type === 'multiple_choice' || type === 'meaning' || type === 'listening') {
        const getValue = (w: Word) => type === 'multiple_choice' ? w.term : w.meaning;
        const correctVal = getValue(word);

        // 選択肢の候補: 正解以外の単語
        const pool = allWords.filter(w => w.id !== word.id && getValue(w) !== correctVal);
        const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);

        // 優先度1: 同カテゴリ & 同レベル（最も紛らわしい）
        const tier1 = shuffle(pool.filter(w => w.category === word.category && w.level === word.level));
        // 優先度2: 同レベル（異カテゴリ）
        const tier2 = shuffle(pool.filter(w => w.level === word.level && w.category !== word.category));
        // 優先度3: 任意（フォールバック）
        const tier3 = shuffle(pool.filter(w => w.level !== word.level));

        // 高品質な選択肢を優先して3つ選ぶ（明らかに違う選択肢は最大1つ）
        const distractorWords: Word[] = [];
        for (const tier of [tier1, tier2, tier3]) {
          for (const w of tier) {
            if (distractorWords.length >= 3) break;
            distractorWords.push(w);
          }
          if (distractorWords.length >= 3) break;
        }

        const distractors = distractorWords.map(getValue);
        options = [...distractors, correctVal].sort(() => Math.random() - 0.5);
      }
      
      return { word, type, options };
    });
    
    setQuestions(generatedQuestions);
  }, [settings.targetScore, settings.currentSetIds]);

  const currentQuestion = questions[currentIndex];

  // Auto-play for listening questions（モバイルでブロックされる場合は手動ボタンで対応）
  useEffect(() => {
    if (currentQuestion?.type === 'listening' && !isAnswered) {
      // 少し遅延を入れてアニメーション後に再生
      const timer = setTimeout(() => speak(currentQuestion.word.term), 300);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, currentQuestion?.type]);

  const handleAnswer = (answer: string) => {
    if (isAnswered) return;
    
    const correct = answer.toLowerCase().trim() === (
      currentQuestion.type === 'multiple_choice' ? currentQuestion.word.term.toLowerCase() :
      currentQuestion.type === 'meaning' || currentQuestion.type === 'listening' ? currentQuestion.word.meaning.toLowerCase() :
      currentQuestion.word.term.toLowerCase()
    );
    
    setIsCorrect(correct);
    setIsAnswered(true);
    if (correct) setScore(s => s + 1);
    onComplete(currentQuestion.word.id, correct, currentQuestion.type);
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserAnswer('');
      setIsAnswered(false);
    } else {
      onExit();
    }
  };

  // 最新の関数を ref に保持
  handleAnswerRef.current = handleAnswer;
  nextQuestionRef.current = nextQuestion;

  // 問題切り替え時: 適切な要素を自動フォーカス
  useEffect(() => {
    if (!currentQuestion) return;
    optionRefs.current = [];
    const timer = setTimeout(() => {
      if (currentQuestion.type === 'spelling') {
        inputRef.current?.focus();
      } else {
        optionRefs.current[0]?.focus();
      }
    }, 350); // アニメーション完了後
    return () => clearTimeout(timer);
  }, [currentIndex, currentQuestion?.type]);

  // 回答後: Next ボタンにフォーカス
  useEffect(() => {
    if (isAnswered) {
      setTimeout(() => nextBtnRef.current?.focus(), 150);
    }
  }, [isAnswered]);

  // グローバルキーボードショートカット
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const q = currentQuestion;
      if (!q) return;

      // 回答済み: Enter で次の問題へ
      if (isAnswered) {
        if (e.key === 'Enter') {
          e.preventDefault();
          nextQuestionRef.current();
        }
        return;
      }

      // 選択問題: 1〜4 キーで即選択
      if (q.type !== 'spelling' && q.options) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= q.options.length) {
          e.preventDefault();
          const opt = q.options[num - 1];
          setUserAnswer(opt);
          handleAnswerRef.current(opt);
          return;
        }
        // ↑↓ キーで選択肢間を移動
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault();
          const cur = optionRefs.current.findIndex(r => r === document.activeElement);
          optionRefs.current[(cur + 1) % optionRefs.current.filter(Boolean).length]?.focus();
        }
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const refs = optionRefs.current.filter(Boolean);
          const cur  = refs.findIndex(r => r === document.activeElement);
          refs[(cur - 1 + refs.length) % refs.length]?.focus();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isAnswered, currentQuestion]);

  if (questions.length === 0) return <div className="flex items-center justify-center h-64">Loading questions...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" onClick={onExit}>Exit Quiz</Button>
        <div className="flex items-center gap-3">
          {isReviewMode && (
            <Badge variant="outline" className="border-red-200 text-red-600 bg-red-50">
              <AlertCircle className="mr-1 h-3 w-3" /> Review Mode
            </Badge>
          )}
          <div className="text-sm font-medium text-muted-foreground">Question {currentIndex + 1} of {questions.length}</div>
        </div>
      </div>
      
      <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-2" />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-none shadow-xl bg-white overflow-hidden">
            <CardHeader className="bg-primary/5 pb-8">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary opacity-70">
                    {currentQuestion.type.replace('_', ' ')}
                  </span>
                  <CardTitle className="text-3xl font-bold">
                    {currentQuestion.type === 'meaning' ? currentQuestion.word.term : 
                     currentQuestion.type === 'listening' ? 'Listen and choose the meaning' : 
                     'What is the meaning of this?'}
                  </CardTitle>
                </div>
                {currentQuestion.type === 'listening' && (
                  <Button
                    variant="default"
                    className="rounded-full h-14 w-14 bg-primary hover:bg-primary/80 shadow-md flex-shrink-0"
                    onClick={() => speak(currentQuestion.word.term)}
                    title="タップして再生"
                  >
                    <Volume2 size={26} />
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="p-8 space-y-8">
              {(currentQuestion.type === 'meaning' || currentQuestion.type === 'listening') && (
                <div className="grid grid-cols-1 gap-3">
                  {currentQuestion.options?.map((opt, i) => (
                    <Button
                      key={i}
                      ref={(el) => { optionRefs.current[i] = el; }}
                      variant={isAnswered ? (opt === currentQuestion.word.meaning ? 'default' : (userAnswer === opt ? 'destructive' : 'outline')) : 'outline'}
                      className={`h-14 text-lg justify-start px-6 rounded-xl transition-all ${!isAnswered && 'hover:bg-primary/5 hover:border-primary'}`}
                      onClick={() => { setUserAnswer(opt); handleAnswer(opt); }}
                      disabled={isAnswered}
                    >
                      <span className="mr-3 text-sm font-bold opacity-40 tabular-nums">{i + 1}</span>
                      {opt}
                    </Button>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'multiple_choice' && (
                <div className="space-y-6">
                  <div className="p-6 bg-gray-50 rounded-2xl text-xl text-center italic">
                    "{currentQuestion.word.meaning}"
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {currentQuestion.options?.map((opt, i) => (
                      <Button
                        key={i}
                        ref={(el) => { optionRefs.current[i] = el; }}
                        variant={isAnswered ? (opt === currentQuestion.word.term ? 'default' : (userAnswer === opt ? 'destructive' : 'outline')) : 'outline'}
                        className={`h-14 text-lg justify-start px-6 rounded-xl transition-all ${!isAnswered && 'hover:bg-primary/5 hover:border-primary'}`}
                        onClick={() => { setUserAnswer(opt); handleAnswer(opt); }}
                        disabled={isAnswered}
                      >
                        <span className="mr-3 text-sm font-bold opacity-40 tabular-nums">{i + 1}</span>
                        {opt}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {currentQuestion.type === 'spelling' && (
                <div className="space-y-6">
                  <div className="p-6 bg-gray-50 rounded-2xl text-xl text-center italic">
                    "{currentQuestion.word.meaning}"
                  </div>
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      placeholder="Type the English word..."
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      disabled={isAnswered}
                      className="h-14 text-lg rounded-xl"
                      onKeyDown={(e) => e.key === 'Enter' && handleAnswer(userAnswer)}
                    />
                    <Button 
                      size="lg" 
                      className="h-14 rounded-xl px-8"
                      onClick={() => handleAnswer(userAnswer)}
                      disabled={isAnswered || !userAnswer}
                    >
                      Check
                    </Button>
                  </div>
                </div>
              )}

              {isAnswered && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-6 rounded-2xl flex items-start gap-4 ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}
                >
                  {isCorrect ? <CheckCircle2 className="h-6 w-6 shrink-0" /> : <XCircle className="h-6 w-6 shrink-0" />}
                  <div className="space-y-1">
                    <p className="font-bold text-lg">{isCorrect ? 'Correct!' : 'Incorrect'}</p>
                    <p className="opacity-90">
                      <span className="font-bold">{currentQuestion.word.term}</span>: {currentQuestion.word.meaning}
                    </p>
                    <p className="text-sm italic mt-2 opacity-70">"{currentQuestion.word.example}"</p>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-end">
        {isAnswered && (
          <Button ref={nextBtnRef} size="lg" onClick={nextQuestion} className="h-14 px-8 rounded-xl shadow-lg">
            {currentIndex === questions.length - 1 ? 'Finish' : 'Next Question'} <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
