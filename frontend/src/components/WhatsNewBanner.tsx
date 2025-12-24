'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';
import { PartyPopper } from 'lucide-react';

export const WhatsNewBanner = () => {
    const { t } = useLanguage();

    return (
        <Card className="border-primary/20 bg-primary/5 animate-in fade-in-0 zoom-in-95 duration-500">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
                <div className="p-3 rounded-full bg-primary/10 border border-primary/20">
                    <PartyPopper className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-primary text-xl font-bold">{t('whats_new_title')}</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                    <li>{t('whats_new_item_1')}</li>
                    <li>{t('whats_new_item_2')}</li>
                </ul>
            </CardContent>
        </Card>
    );
};
