'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { translations } from '../translations';

type Language = 'en' | 'id';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: typeof translations.en;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('id'); // Default to ID as requested ("buat switch inggris/indonesia" - implies local context)

    useEffect(() => {
        const storedLang = localStorage.getItem('language') as Language;
        // eslint-disable-next-line
        if (storedLang) setLanguage(storedLang);
    }, []);

    useEffect(() => {
        localStorage.setItem('language', language);
    }, [language]);

    const value = {
        language,
        setLanguage,
        t: translations[language],
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
