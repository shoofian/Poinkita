'use client';

import { StoreProvider } from '@/lib/context/StoreContext';
import { LanguageProvider } from '@/lib/context/LanguageContext';
import { DialogProvider } from '@/components/ui/ConfirmDialog';
import { ThemeProvider } from '@/lib/context/ThemeContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <LanguageProvider>
                <StoreProvider>
                    <DialogProvider>
                        {children}
                    </DialogProvider>
                </StoreProvider>
            </LanguageProvider>
        </ThemeProvider>
    );
}
