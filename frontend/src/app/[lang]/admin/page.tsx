'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Shield,
  Lock,
  ThumbsUp,
  ThumbsDown,
  CheckCircle,
  RotateCcw,
  Trash2,
  Loader2,
  ArrowLeft,
  XCircle,
  MessageCircle,
  Send,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/context/LanguageContext';
import {
  getSuggestions,
  validateAdminKey,
  completeSuggestion,
  dismissSuggestion,
  reopenSuggestion,
  deleteSuggestion,
  addComment,
  updateComment,
  deleteComment,
  SuggestionResponse,
} from '@/lib/api';
import { formatShortDate } from '@/lib/utils';

export default function AdminPage() {
  const { t } = useLanguage();
  const params = useParams();
  const lang = (params.lang as string) || 'es';

  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [suggestions, setSuggestions] = useState<SuggestionResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'completed' | 'dismissed'>('all');
  const [sort, setSort] = useState<'newest' | 'top'>('newest');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [commentText, setCommentText] = useState<Record<number, string>>({});
  const [editingComment, setEditingComment] = useState<{ suggestionId: number; commentId: number } | null>(null);
  const [editCommentText, setEditCommentText] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('suggestions_admin_key');
    if (stored) {
      validateKey(stored);
    }
  }, []);

  const validateKey = async (key: string) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      await validateAdminKey(key);
      localStorage.setItem('suggestions_admin_key', key);
      setAdminKey(key);
      setIsAuthenticated(true);
    } catch {
      setAuthError(t('admin_invalid_key'));
      localStorage.removeItem('suggestions_admin_key');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = () => {
    if (!adminKey.trim()) return;
    validateKey(adminKey.trim());
  };

  const fetchSuggestions = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const data = await getSuggestions(200, 0, sort);
      let filtered = data;
      if (statusFilter !== 'all') {
        filtered = data.filter((s) => s.status === statusFilter);
      }
      setSuggestions(filtered);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setIsAuthenticated(false);
        localStorage.removeItem('suggestions_admin_key');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSuggestions();
    }
  }, [isAuthenticated, statusFilter, sort]);

  const handleAction = async (action: 'complete' | 'dismiss' | 'reopen' | 'delete', id: number) => {
    const key = localStorage.getItem('suggestions_admin_key');
    if (!key) {
      setIsAuthenticated(false);
      return;
    }
    try {
      if (action === 'complete') await completeSuggestion(id, key);
      if (action === 'dismiss') await dismissSuggestion(id, key);
      if (action === 'reopen') await reopenSuggestion(id, key);
      if (action === 'delete') {
        await deleteSuggestion(id, key);
        setDeleteConfirm(null);
      }
      await fetchSuggestions();
    } catch (err: any) {
      if (err.response?.status === 403) {
        setIsAuthenticated(false);
        localStorage.removeItem('suggestions_admin_key');
      }
    }
  };

  const handleAddComment = async (id: number) => {
    const key = localStorage.getItem('suggestions_admin_key');
    const text = commentText[id]?.trim();
    if (!key || !text) return;
    try {
      await addComment(id, text, key);
      setCommentText(prev => ({ ...prev, [id]: '' }));
      await fetchSuggestions();
    } catch (err: any) {
      if (err.response?.status === 403) {
        setIsAuthenticated(false);
        localStorage.removeItem('suggestions_admin_key');
      }
    }
  };

  const startEditComment = (suggestionId: number, commentId: number, currentText: string) => {
    setEditingComment({ suggestionId, commentId });
    setEditCommentText(currentText);
  };

  const handleUpdateComment = async () => {
    if (!editingComment) return;
    const key = localStorage.getItem('suggestions_admin_key');
    const text = editCommentText.trim();
    if (!key || !text) return;
    try {
      await updateComment(editingComment.suggestionId, editingComment.commentId, text, key);
      setEditingComment(null);
      setEditCommentText('');
      await fetchSuggestions();
    } catch (err: any) {
      if (err.response?.status === 403) {
        setIsAuthenticated(false);
        localStorage.removeItem('suggestions_admin_key');
      }
    }
  };

  const handleDeleteComment = async (suggestionId: number, commentId: number) => {
    const key = localStorage.getItem('suggestions_admin_key');
    if (!key) {
      setIsAuthenticated(false);
      return;
    }
    try {
      await deleteComment(suggestionId, commentId, key);
      await fetchSuggestions();
    } catch (err: any) {
      if (err.response?.status === 403) {
        setIsAuthenticated(false);
        localStorage.removeItem('suggestions_admin_key');
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-lg">{t('admin_title')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Input
                type="password"
                placeholder={t('admin_login_placeholder')}
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
              {authError && (
                <p className="text-xs text-red-600 dark:text-red-400">{authError}</p>
              )}
            </div>
            <Button onClick={handleLogin} disabled={authLoading || !adminKey.trim()} className="w-full gap-2">
              {authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
              {t('admin_login_button')}
            </Button>
            <Button variant="ghost" size="sm" className="w-full" asChild>
              <a href={`/${lang}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">{t('admin_title')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchSuggestions} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '↻'}
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href={`/${lang}`}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Volver
              </a>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1">
            {(['all', 'open', 'completed', 'dismissed'] as const).map((f) => (
              <Button
                key={f}
                variant={statusFilter === f ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter(f)}
              >
                {t(`admin_status_${f}` as any)}
              </Button>
            ))}
          </div>
          <div className="flex gap-1 ml-auto">
            <Button
              variant={sort === 'newest' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSort('newest')}
            >
              {t('suggest_sort_newest')}
            </Button>
            <Button
              variant={sort === 'top' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSort('top')}
            >
              {t('suggest_sort_top')}
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card>
          <ScrollArea className="h-[70vh]">
            <div className="divide-y">
              {suggestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                  <Shield className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">No hay sugerencias</p>
                </div>
              ) : (
                suggestions.map((s) => (
                  <div
                    key={s.id}
                    className={`p-4 flex flex-col gap-2 ${s.status !== 'open' ? 'bg-muted/30' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${s.status === 'dismissed' ? 'line-through text-muted-foreground' : s.status === 'completed' ? 'text-muted-foreground' : ''}`}>
                          {s.text}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {s.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsDown className="h-3 w-3" />
                            {s.dislikes}
                          </span>
                          <span>
                            {s.created_at ? formatShortDate(s.created_at) : ''}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {s.status === 'completed' && (
                          <Badge variant="outline" className="gap-1 text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800">
                            <CheckCircle className="h-3 w-3" />
                            {t('suggest_completed')}
                          </Badge>
                        )}
                        {s.status === 'dismissed' && (
                          <Badge variant="outline" className="gap-1 text-xs bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800">
                            <XCircle className="h-3 w-3" />
                            {t('suggest_dismissed')}
                          </Badge>
                        )}
                        {s.status === 'open' && (
                          <Badge variant="secondary" className="text-xs">
                            {t('admin_status_open')}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Existing comments */}
                    {s.comments && s.comments.length > 0 && (
                      <div className="space-y-1.5">
                        {s.comments.map((c) => (
                          <div key={c.id} className="flex items-start gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-md px-2 py-1.5">
                            <MessageCircle className="h-3 w-3 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              {editingComment?.suggestionId === s.id && editingComment?.commentId === c.id ? (
                                <div className="flex items-center gap-1">
                                  <Input
                                    value={editCommentText}
                                    onChange={(e) => setEditCommentText(e.target.value)}
                                    className="h-6 text-xs"
                                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateComment()}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-[10px] px-1"
                                    onClick={handleUpdateComment}
                                  >
                                    Guardar
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-[10px] px-1"
                                    onClick={() => { setEditingComment(null); setEditCommentText(''); }}
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-start justify-between gap-2">
                                  <span className="whitespace-pre-wrap break-words">{c.text}</span>
                                  <div className="flex items-center gap-0.5 shrink-0">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5"
                                      onClick={() => startEditComment(s.id, c.id, c.text)}
                                    >
                                      <Pencil className="h-2.5 w-2.5" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 text-red-600 hover:text-red-700"
                                      onClick={() => handleDeleteComment(s.id, c.id)}
                                    >
                                      <Trash2 className="h-2.5 w-2.5" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                              {c.created_at && (
                                <span className="text-[10px] text-muted-foreground/70 block">
                                  {formatShortDate(c.created_at)}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add comment */}
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder={t('admin_comment_placeholder')}
                        value={commentText[s.id] || ''}
                        onChange={(e) => setCommentText(prev => ({ ...prev, [s.id]: e.target.value }))}
                        className="h-7 text-xs"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(s.id)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 shrink-0"
                        onClick={() => handleAddComment(s.id)}
                        disabled={!commentText[s.id]?.trim()}
                      >
                        <Send className="h-3 w-3" />
                        {t('admin_add_comment')}
                      </Button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {s.status !== 'completed' && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => handleAction('complete', s.id)}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          {t('admin_action_complete')}
                        </Button>
                      )}
                      {s.status !== 'dismissed' && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          onClick={() => handleAction('dismiss', s.id)}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          {t('admin_action_dismiss')}
                        </Button>
                      )}
                      {s.status !== 'open' && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => handleAction('reopen', s.id)}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          {t('admin_action_reopen')}
                        </Button>
                      )}
                      {deleteConfirm === s.id ? (
                        <>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleAction('delete', s.id)}
                          >
                            {t('admin_confirm_delete')}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setDeleteConfirm(null)}
                          >
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          onClick={() => setDeleteConfirm(s.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {t('admin_action_delete')}
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}
