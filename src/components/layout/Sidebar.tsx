'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FaHome, FaUsers, FaClipboardList, FaChartBar, FaSignOutAlt, FaUserCog, FaGlobe, FaTimes, FaArchive, FaMoon, FaSun, FaGavel, FaArrowCircleUp } from 'react-icons/fa';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useStore } from '@/lib/context/StoreContext';
import { useTheme } from '@/lib/context/ThemeContext';
import styles from './Sidebar.module.css';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const pathname = usePathname();
    const router = useRouter();
    const { t, language, setLanguage } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const { currentUser, setCurrentUser, appeals } = useStore();
    const pendingAppealsCount = (appeals || []).filter(a => a.status === 'PENDING').length;

    const allMenuItems = [
        { label: t.sidebar.dashboard, href: '/dashboard', icon: FaHome },
        { label: t.sidebar.transactions, href: '/dashboard/transactions', icon: FaChartBar },
        { label: t.sidebar.members, href: '/dashboard/members', icon: FaUsers },
        { label: t.sidebar.rules, href: '/dashboard/rules', icon: FaUserCog },
        { label: t.sidebar.archive, href: '/dashboard/archive', icon: FaArchive },
        { label: t.sidebar.appeals, href: '/dashboard/appeals', icon: FaGavel },
        { label: t.sidebar.upgrade, href: '/dashboard/upgrade', icon: FaArrowCircleUp },
    ];

    const MENU_ITEMS = allMenuItems;

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'id' : 'en');
    };

    const handleLogout = () => {
        setCurrentUser(null);
        router.push('/');
    };

    return (
        <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
            <div className={styles.logo}>
                <span className={styles.logoText}>Poinkita</span>
                <button className={styles.closeBtn} onClick={onClose}>
                    <FaTimes />
                </button>
            </div>

            <nav className={styles.nav}>
                {MENU_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                            onClick={onClose} // Close sidebar on navigation on mobile
                        >
                            <Icon className={styles.navIcon} />
                            <span>{item.label}</span>
                            {item.href === '/dashboard/appeals' && pendingAppealsCount > 0 && (
                                <span className={styles.notificationDot} />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className={styles.footer}>
                <Link href="/dashboard/profile" className={styles.userCardLink} onClick={onClose}>
                    <div className={styles.userCard}>
                        <div className={styles.userAvatar}>
                            {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className={styles.userDetails}>
                            <span className={styles.userName}>{currentUser?.name || 'User'}</span>
                            <span className={styles.userRole}>{currentUser?.role || 'Guest'}</span>
                        </div>
                    </div>
                </Link>

                <div className={styles.actions}>
                    <button onClick={toggleLanguage} className={styles.actionBtn}>
                        <FaGlobe />
                        <span>{language === 'en' ? 'ID' : 'EN'}</span>
                    </button>
                    <button onClick={toggleTheme} className={styles.actionBtn}>
                        {theme === 'light' ? <FaMoon /> : <FaSun />}
                        <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
                    </button>
                    <button onClick={handleLogout} className={`${styles.actionBtn} ${styles.logoutBtn}`}>
                        <FaSignOutAlt />
                        <span>{t.common.logout}</span>
                    </button>
                </div>
            </div>
        </aside >
    );
};
