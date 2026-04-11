/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, ArrowRight, Volume2, HelpCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TOEIC_WORDS, Word } from '@/src/data/words';
import { UserProfile, Progress as ProgressType } from '@/src/hooks/useLearningStore';

interface QuizProps {
  settings: UserProfile;
  progress: Record<string, ProgressType>;
  onComplete: (wordId: string, isCorrect: boolean, format: string) => void;
  onExit: () => void;
}

type QuestionType = 'multiple_choice' | 'spelling' | 'meaning' | 'listening';

interface Question {
  word: Word;
  type: QuestionType;
  options?: string[];
}

export function Quiz({ settings, progress, onComplete, onExit }: QuizProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);

  const isReviewMode = useMemo(() => {
    // If any word in the current set has been failed before, consider it a review session
    // (This is a simple heuristic since we don't pass an explicit flag)
    return questions.some(q => q.word.id === settings.currentSetIds[0]); 
  }, [questions, settings.currentSetIds]);

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  // Generate questions on mount
  useEffect(() => {
    // Use current set if available, otherwise fallback to random
    const pool = settings.currentSetIds.length > 0 
      ? TOEIC_WORDS.filter(w => settings.currentSetIds.includes(w.id))
      : TOEIC_WORDS.filter(w => w.level <= settings.targetScore).sort(() => Math.random() - 0.5).slice(0, 5);
    
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
        const distractors = TOEIC_WORDS
          .filter(w => w.id !== word.id && w.meaning !== word.meaning && w.term !== word.term)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map(w => type === 'multiple_choice' ? w.term : w.meaning);
        
        options = [...distractors, type === 'multiple_choice' ? word.term : word.meaning].sort(() => Math.random() - 0.5);
      }
      
      return { word, type, options };
    });
    
    setQuestions(generatedQuestions);
  }, [settings.targetScore, settings.currentSetIds]);

  const currentQuestion = questions[currentIndex];

  // Auto-play for listening questions
  useEffect(() => {
    if (currentQuestion?.type === 'listening' && !isAnswered) {
      speak(currentQuestion.word.term);
    }
  }, [currentIndex, currentQuestion, isAnswered]);

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
                    variant="outline" 
                    size="icon" 
                    className="rounded-full h-12 w-12 hover:bg-primary hover:text-white transition-colors"
                    onClick={() => speak(currentQuestion.word.term)}
                  >
                    <Volume2 size={24} />
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
                      variant={isAnswered ? (opt === currentQuestion.word.meaning ? 'default' : (userAnswer === opt ? 'destructive' : 'outline')) : 'outline'}
                      className={`h-14 text-lg justify-start px-6 rounded-xl transition-all ${!isAnswered && 'hover:bg-primary/5 hover:border-primary'}`}
                      onClick={() => {
                        setUserAnswer(opt);
                        handleAnswer(opt);
                      }}
                      disabled={isAnswered}
                    >
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
                        variant={isAnswered ? (opt === currentQuestion.word.term ? 'default' : (userAnswer === opt ? 'destructive' : 'outline')) : 'outline'}
                        className={`h-14 text-lg justify-start px-6 rounded-xl transition-all ${!isAnswered && 'hover:bg-primary/5 hover:border-primary'}`}
                        onClick={() => {
                          setUserAnswer(opt);
                          handleAnswer(opt);
                        }}
                        disabled={isAnswered}
                      >
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
          <Button size="lg" onClick={nextQuestion} className="h-14 px-8 rounded-xl shadow-lg">
            {currentIndex === questions.length - 1 ? 'Finish' : 'Next Question'} <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
