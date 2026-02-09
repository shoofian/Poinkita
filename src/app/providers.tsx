'use client';

import { StoreProvider } from '@/lib/context/StoreContext';
import { LanguageProvider } from '@/lib/context/LanguageContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <LanguageProvider>
            <StoreProvider>
                {children}
            </StoreProvider>
        </LanguageProvider>
    );
}
