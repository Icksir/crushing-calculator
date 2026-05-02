'use client';
import React, { useState, useEffect } from 'react';
import { X, Send, MessageSquare, Loader2, ThumbsUp, ThumbsDown, CheckCircle, XCircle, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/LanguageContext';
import { postSuggestion, getSuggestions, voteSuggestion, SuggestionResponse } from '@/lib/api';
import { formatShortDate } from '@/lib/utils';

interface SuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SuggestionModal: React.FC<SuggestionModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestionResponse[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [sort, setSort] = useState<'newest' | 'top'>('newest');

  useEffect(() => {
    if (isOpen) {
      fetchSuggestions();
      setText('');
      setSuccess(false);
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchSuggestions();
    }
  }, [sort]);

  const fetchSuggestions = async () => {
    setLoadingList(true);
    try {
      const data = await getSuggestions(50, 0, sort);
      setSuggestions(data);
    } catch {
      // Silently fail for list fetch
    } finally {
      setLoadingList(false);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess(false);
    const trimmed = text.trim();
    if (trimmed.length < 5) {
      setError(t('suggest_too_short'));
      return;
    }
    if (trimmed.length > 500) {
      setError(t('suggest_too_long'));
      return;
    }

    setLoading(true);
    try {
      await postSuggestion(trimmed);
      setSuccess(true);
      setText('');
      await fetchSuggestions();
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError(t('suggest_limit_reached'));
      } else if (err.response?.data?.detail === 'suggestion_too_short') {
        setError(t('suggest_too_short'));
      } else if (err.response?.data?.detail === 'suggestion_too_long') {
        setError(t('suggest_too_long'));
      } else if (err.response?.data?.detail === 'suggestion_contains_url') {
        setError('URLs are not allowed.');
      } else {
        setError(t('suggest_error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (id: number, vote: 1 | -1) => {
    try {
      const result = await voteSuggestion(id, vote);
      setSuggestions(prev =>
        prev.map(s =>
          s.id === id
            ? { ...s, likes: result.likes, dislikes: result.dislikes, user_vote: result.user_vote }
            : s
        )
      );
    } catch {
      // Silently fail for vote errors
    }
  };

  const isResolved = (status: string) => status === 'completed' || status === 'dismissed';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-lg max-h-[85vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{t('suggest_title')}</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 overflow-hidden">
          {/* Submit section */}
          <div className="flex flex-col gap-2">
            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t('suggest_placeholder')}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                maxLength={500}
              />
              <span className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                {text.length}/500
              </span>
            </div>
            {/* Honeypot: hidden field */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0, width: 0 }}
              value=""
              readOnly
            />
            <div className="flex items-center justify-between">
              <div className="text-xs space-y-0.5">
                {success && <span className="text-green-600 dark:text-green-400 block">{t('suggest_success')}</span>}
                {error && <span className="text-red-600 dark:text-red-400 block">{error}</span>}
                <span className="text-muted-foreground">{t('suggest_limit_hint')}</span>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={loading || !text.trim()}
                size="sm"
                className="gap-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {t('suggest_submit')}
              </Button>
            </div>
          </div>

          {/* List section */}
          <div className="flex flex-col gap-2 min-h-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground">{t('suggest_list_title')}</h3>
              <div className="flex gap-1">
                <Button
                  variant={sort === 'newest' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setSort('newest')}
                >
                  {t('suggest_sort_newest')}
                </Button>
                <Button
                  variant={sort === 'top' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setSort('top')}
                >
                  {t('suggest_sort_top')}
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1 h-64 rounded-md border">
              {loadingList ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : suggestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-sm text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mb-2 opacity-40" />
                  {t('suggest_empty')}
                </div>
              ) : (
                <div className="flex flex-col gap-2 p-3">
                  {suggestions.map((s) => (
                    <div
                      key={s.id}
                      className={`rounded-lg border bg-card p-3 text-sm shadow-sm ${isResolved(s.status) ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={`whitespace-pre-wrap break-words flex-1 ${s.status === 'dismissed' ? 'line-through text-muted-foreground' : ''}`}>
                          {s.text}
                        </p>
                        {s.status === 'completed' && (
                          <Badge variant="outline" className="shrink-0 gap-1 text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800">
                            <CheckCircle className="h-3 w-3" />
                            {t('suggest_completed')}
                          </Badge>
                        )}
                        {s.status === 'dismissed' && (
                          <Badge variant="outline" className="shrink-0 gap-1 text-xs bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800">
                            <XCircle className="h-3 w-3" />
                            {t('suggest_dismissed')}
                          </Badge>
                        )}
                      </div>

                      {/* Comments */}
                      {s.comments && s.comments.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                          {s.comments.map((c) => (
                            <div key={c.id} className="flex items-start gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-md px-2 py-1.5">
                              <MessageCircle className="h-3 w-3 mt-0.5 shrink-0" />
                              <div>
                                <span className="whitespace-pre-wrap break-words">{c.text}</span>
                                {c.created_at && (
                                  <span className="text-[10px] text-muted-foreground/70 ml-1">
                                    {formatShortDate(c.created_at)}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1">
                          <Button
                            variant={s.user_vote === 1 ? 'default' : 'ghost'}
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleVote(s.id, 1)}
                            disabled={isResolved(s.status)}
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                          </Button>
                          <span className="text-xs font-medium min-w-[1.5rem] text-center">{s.likes}</span>
                          <Button
                            variant={s.user_vote === -1 ? 'default' : 'ghost'}
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleVote(s.id, -1)}
                            disabled={isResolved(s.status)}
                          >
                            <ThumbsDown className="h-3.5 w-3.5" />
                          </Button>
                          <span className="text-xs font-medium min-w-[1.5rem] text-center">{s.dislikes}</span>
                        </div>
                        {s.created_at && (
                          <span className="text-xs text-muted-foreground">
                            {formatShortDate(s.created_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuggestionModal;