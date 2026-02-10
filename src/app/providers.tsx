'use client';

import { StoreProvider } from '@/lib/context/StoreContext';
import { LanguageProvider } from '@/lib/context/LanguageContext';
import { DialogProvider } from '@/components/ui/ConfirmDialog';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <LanguageProvider>
            <StoreProvider>
                <DialogProvider>
                    {children}
                </DialogProvider>
            </StoreProvider>
        </LanguageProvider>
    );
}
