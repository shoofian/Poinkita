'use client';

import React, { useState } from 'react';
import { FaBars } from 'react-icons/fa';
import { Sidebar } from './Sidebar';
import styles from './Layout.module.css';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
