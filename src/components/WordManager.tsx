/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Search, X, BookOpen, Pencil, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Word } from '@/src/data/words';

const CATEGORIES = ['Business', 'Finance', 'Marketing', 'Office', 'General', 'Technology', 'HR', 'Legal', 'Travel', 'Management'];
const LEVELS = [600, 730, 860, 990] as const;

interface WordManagerProps {
  allWords: Word[];
  onAddWord: (word: Omit<Word, 'id'>) => void;
  onEditWord: (wordId: string, updates: Partial<Omit<Word, 'id'>>) => void;
  onDeleteWord: (wordId: string) => void;
}

const emptyForm = { term: '', meaning: '', example: '', level: 730 as (typeof LEVELS)[number], category: 'General' };

export function WordManager({ allWords, onAddWord, onEditWord, onDeleteWord }: WordManagerProps) {
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState<number | 'all'>('all');
  const [filterType, setFilterType] = useState<'all' | 'custom' | 'builtin'>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

  const filtered = allWords.filter(w => {
    if (filterLevel !== 'all' && w.level !== filterLevel) return false;
    if (filterType === 'custom' && !w.id.startsWith('custom_')) return false;
    if (filterType === 'builtin' && w.id.startsWith('custom_')) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return w.term.toLowerCase().includes(q) || w.meaning.toLowerCase().includes(q);
    }
    return true;
  });

  const customCount = allWords.filter(w => w.id.startsWith('custom_')).length;

  const handleSubmit = () => {
    if (!form.term.trim()) { setFormError('単語（英語）を入力してください'); return; }
    if (!form.meaning.trim()) { setFormError('意味（日本語）を入力してください'); return; }
    onAddWord({
      term: form.term.trim(),
      meaning: form.meaning.trim(),
      example: form.example.trim(),
      level: form.level,
      category: form.category,
    });
    setForm(emptyForm);
    setFormError('');
    setShowForm(false);
  };

  const startEdit = (word: Word) => {
    setEditingId(word.id);
    setEditForm({ term: word.term, meaning: word.meaning, example: word.example, level: word.level, category: word.category });
    setConfirmDelete(null);
  };

  const saveEdit = () => {
    if (!editingId) return;
    if (!editForm.term.trim() || !editForm.meaning.trim()) return;
    onEditWord(editingId, {
      term: editForm.term.trim(),
      meaning: editForm.meaning.trim(),
      example: editForm.example.trim(),
      level: editForm.level,
      category: editForm.category,
    });
    setEditingId(null);
  };

  const levelColor = (level: number) => {
    if (level <= 600) return 'bg-green-100 text-green-700';
    if (level <= 730) return 'bg-blue-100 text-blue-700';
    if (level <= 860) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">単語管理</h2>
          <p className="text-muted-foreground">
            全 {allWords.length} 語
            {customCount > 0 && <span className="ml-2 text-primary font-medium">(自作: {customCount} 語)</span>}
          </p>
        </div>
        <Button onClick={() => { setShowForm(true); setFormError(''); }} className="rounded-xl">
          <Plus className="mr-2 h-4 w-4" /> 単語を追加
        </Button>
      </div>

      {/* Add Word Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="border-2 border-primary/30 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">新しい単語を追加</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">英単語 *</label>
                    <Input
                      placeholder="例: leverage"
                      value={form.term}
                      onChange={e => setForm(f => ({ ...f, term: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">意味（日本語）*</label>
                    <Input
                      placeholder="例: 影響力、てこの原理"
                      value={form.meaning}
                      onChange={e => setForm(f => ({ ...f, meaning: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-sm font-medium">例文（任意）</label>
                    <Input
                      placeholder="例: The company used its financial leverage to negotiate better terms."
                      value={form.example}
                      onChange={e => setForm(f => ({ ...f, example: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">レベル</label>
                    <select
                      className="w-full h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring"
                      value={form.level}
                      onChange={e => setForm(f => ({ ...f, level: Number(e.target.value) as (typeof LEVELS)[number] }))}
                    >
                      {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">カテゴリ</label>
                    <select
                      className="w-full h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring"
                      value={form.category}
                      onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                {formError && <p className="text-sm text-red-500">{formError}</p>}
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowForm(false)}>キャンセル</Button>
                  <Button onClick={handleSubmit}>追加する</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="単語・意味で検索..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'custom', 'builtin'] as const).map(t => (
            <Button
              key={t}
              size="sm"
              variant={filterType === t ? 'default' : 'outline'}
              onClick={() => setFilterType(t)}
              className="rounded-lg"
            >
              {t === 'all' ? 'すべて' : t === 'custom' ? '自作' : '標準'}
            </Button>
          ))}
          <div className="w-px bg-border mx-1 hidden sm:block" />
          {(['all', ...LEVELS] as const).map(l => (
            <Button
              key={l}
              size="sm"
              variant={filterLevel === l ? 'default' : 'outline'}
              onClick={() => setFilterLevel(l)}
              className="rounded-lg"
            >
              {l === 'all' ? 'ALL' : l}
            </Button>
          ))}
        </div>
      </div>

      {/* Word List */}
      <Card className="border-none shadow-md">
        <CardHeader className="pb-2">
          <CardDescription>{filtered.length} 語表示中</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <BookOpen className="h-10 w-10 opacity-30" />
              <p>単語が見つかりません</p>
            </div>
          ) : (
            <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
              {filtered.map(word => (
                <div key={word.id}>
                  {editingId === word.id ? (
                    /* ── インライン編集フォーム ── */
                    <div className="px-6 py-4 bg-primary/5 border-l-2 border-primary space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">英単語</label>
                          <Input value={editForm.term} onChange={e => setEditForm(f => ({ ...f, term: e.target.value }))} className="h-8" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">意味</label>
                          <Input value={editForm.meaning} onChange={e => setEditForm(f => ({ ...f, meaning: e.target.value }))} className="h-8" />
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-xs font-medium text-muted-foreground">例文</label>
                          <Input value={editForm.example} onChange={e => setEditForm(f => ({ ...f, example: e.target.value }))} className="h-8" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">レベル</label>
                          <select
                            className="w-full h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring"
                            value={editForm.level}
                            onChange={e => setEditForm(f => ({ ...f, level: Number(e.target.value) as (typeof LEVELS)[number] }))}
                          >
                            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">カテゴリ</label>
                          <select
                            className="w-full h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring"
                            value={editForm.category}
                            onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                          >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>キャンセル</Button>
                        <Button size="sm" onClick={saveEdit} disabled={!editForm.term.trim() || !editForm.meaning.trim()}>
                          <Check className="mr-1 h-3 w-3" /> 保存
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* ── 通常表示行 ── */
                    <div className="flex items-center gap-4 px-6 py-3 hover:bg-muted/40 transition-colors group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{word.term}</span>
                          <Badge className={`text-xs px-2 py-0 ${levelColor(word.level)}`}>{word.level}</Badge>
                          <Badge variant="secondary" className="text-xs px-2 py-0">{word.category}</Badge>
                          {word.id.startsWith('custom_') && (
                            <Badge className="text-xs px-2 py-0 bg-primary/10 text-primary">自作</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 truncate">{word.meaning}</p>
                      </div>
                      <div className="shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {confirmDelete === word.id ? (
                          <>
                            <Button size="sm" variant="destructive" className="h-7 px-3 text-xs"
                              onClick={() => { onDeleteWord(word.id); setConfirmDelete(null); }}>
                              削除
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 px-3 text-xs"
                              onClick={() => setConfirmDelete(null)}>
                              キャンセル
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => startEdit(word)} title="編集">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-red-500"
                              onClick={() => setConfirmDelete(word.id)}
                              title={word.id.startsWith('custom_') ? '削除' : '非表示にする'}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
