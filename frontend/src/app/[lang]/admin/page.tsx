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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/context/LanguageContext';
import {
  getSuggestions,
  completeSuggestion,
  reopenSuggestion,
  deleteSuggestion,
  SuggestionResponse,
} from '@/lib/api';

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
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'completed'>('all');
  const [sort, setSort] = useState<'newest' | 'top'>('newest');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Try to restore key from localStorage on mount
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
      // Validate by making a test admin request
      await getSuggestions(1, 0, 'newest');
      // If we get here, the backend is reachable. For a real validation,
      // we attempt an admin-only operation on a non-existent ID which should
      // return 404 (valid key) rather than 403 (invalid key).
      // Simpler: just trust the key for now and let operations fail with 403 if wrong.
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
      // Only invalidate session on 403 (invalid key)
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

  const handleAction = async (action: 'complete' | 'reopen' | 'delete', id: number) => {
    const key = localStorage.getItem('suggestions_admin_key');
    if (!key) {
      setIsAuthenticated(false);
      return;
    }
    try {
      if (action === 'complete') await completeSuggestion(id, key);
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
            {(['all', 'open', 'completed'] as const).map((f) => (
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
                    className={`p-4 flex flex-col gap-2 ${s.status === 'completed' ? 'bg-muted/30' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${s.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
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
                            {s.created_at ? new Date(s.created_at).toLocaleString() : ''}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {s.status === 'completed' ? (
                          <Badge variant="outline" className="gap-1 text-xs">
                            <CheckCircle className="h-3 w-3" />
                            {t('suggest_completed')}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            {t('admin_status_open')}
                          </Badge>
                        )}
                      </div>
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
                      {s.status === 'completed' && (
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
