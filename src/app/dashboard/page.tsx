'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useStore } from '@/lib/context/StoreContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import styles from './page.module.css';

export default function DashboardPage() {
    const { members } = useStore();
    const { t } = useLanguage();

    const totalPoints = members.reduce((acc, m) => acc + m.totalPoints, 0);
    const topPerformer = members.length > 0
        ? members.reduce((prev, current) => (prev.totalPoints > current.totalPoints) ? prev : current)
        : null;

    return (
        <div className={styles.container}>
            <h1 className={styles.pageTitle}>{t.dashboard.overview}</h1>

            <div className={styles.statsGrid}>
                <Card>
                    <CardHeader>
                        <CardTitle>{t.dashboard.totalMembers}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span className={styles.statValue}>{members.length}</span>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t.dashboard.totalPoints}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span className={styles.statValue}>{totalPoints}</span>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t.dashboard.topPerformer}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span className={styles.statValue}>{topPerformer ? topPerformer.name : 'N/A'}</span>
                    </CardContent>
                </Card>
            </div>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>{t.dashboard.recentActivity}</h2>
                <Card>
                    <CardContent>
                        <p className="text-muted">{t.dashboard.viewHistory}</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
