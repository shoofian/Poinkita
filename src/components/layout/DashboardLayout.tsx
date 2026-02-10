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
    const { currentUser } = useStore();

    useEffect(() => {
        // Simple client-side route protection
        if (currentUser && currentUser.role === 'CONTRIBUTOR') {
            const restrictedPaths = ['/dashboard/members', '/dashboard/rules', '/dashboard/recap', '/dashboard/archive', '/dashboard'];
            // Exactly '/dashboard' is restricted or just home? 
            // Usually we want them on transactions if they can only do transactions.
            if (restrictedPaths.includes(pathname)) {
                router.replace('/dashboard/transactions');
            }
        }
    }, [pathname, currentUser, router]);

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
