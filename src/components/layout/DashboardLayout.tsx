'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '@/lib/context/StoreContext';
import { FaBars } from 'react-icons/fa';
import { Sidebar } from './Sidebar';
import styles from './Layout.module.css';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { currentUser, isLoaded } = useStore();

    useEffect(() => {
        // Simple client-side route protection
        // Only redirect once authentication data is fully loaded
        if (isLoaded && !currentUser) {
            router.replace('/');
            return;
        }
    }, [pathname, currentUser, isLoaded, router]);

    // Show a premium centered loading screen while checking authentication status
    if (!isLoaded) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: 'var(--color-bg)',
                color: 'var(--color-text-main)',
                fontFamily: 'sans-serif'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        border: '3px solid var(--color-primary-light)',
                        borderTopColor: 'var(--color-primary)',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>Memuat...</span>
                </div>
                <style>{`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className={styles.container}>
            {/* Mobile Header / Hamburger */}
            <div className={styles.mobileHeader}>
                <button
                    className={styles.hamburgerBtn}
                    onClick={() => setIsSidebarOpen(true)}
                >
                    <FaBars />
                </button>
                <span className={styles.mobileLogo}>Poinkita</span>
            </div>

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div
                    className={styles.overlay}
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <main className={styles.main}>
                {children}
            </main>
        </div>
    );
};
