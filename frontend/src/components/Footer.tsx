'use client';
import { useLanguage } from '@/context/LanguageContext';
import { Heart } from 'lucide-react';

export const Footer = () => {
    const { t } = useLanguage();

    return (
        <footer className="w-full mt-auto py-4 px-4 md:px-8 text-sm text-muted-foreground">
            <div className="container mx-auto max-w-[1600px] flex flex-col md:flex-row justify-center items-center gap-2 md:gap-4">
                <div className="flex items-center gap-1">
                    <span>{t('footer_made_with')}</span>
                    <Heart className="h-4 w-4 text-red-500" />
                    <span>{t('footer_by')} <a href="https://github.com/Icksir" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">Icksir</a>.</span>
                </div>
                <p className="text-center md:text-left">{t('footer_ankama_images')}</p>
            </div>
        </footer>
    );
};
