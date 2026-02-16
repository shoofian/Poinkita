'use client';

import React from 'react';
import { useStore } from '@/lib/context/StoreContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import styles from './page.module.css';
import Link from 'next/link';

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';

import {
    Users,
    Zap,
    Trophy,
    TrendingUp,
    TrendingDown,
    Activity,
    Target,
    PieChart as PieChartIcon,
    ArrowUpRight,
    Search,
    AlertTriangle
} from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function DashboardPage() {
    const { members, auditLogs, warningRules, users } = useStore();
    const { t } = useLanguage();

    const totalPoints = members.reduce((acc, m) => acc + m.totalPoints, 0);
    const topPerformer = members.length > 0
        ? members.reduce((prev, current) => (prev.totalPoints > current.totalPoints) ? prev : current)
        : null;

    // --- Data Aggregation for Charts ---

    // Warning Aggregation
    const membersWithWarnings = members.map(m => {
        const activeWarnings = warningRules
            .filter(w => m.totalPoints <= w.threshold)
            .sort((a, b) => a.threshold - b.threshold); // Lowest threshold (most severe) first? Or highest? 
        // Usually if < 50 is bad and < 30 is worse. 20 triggers both. 
        // We might want to show the most severe (lowest threshold) or all.
        // Let's show the "active" ones.
        return { member: m, warnings: activeWarnings };
    }).filter(item => item.warnings.length > 0);


    // 1. Division Distribution (Pie Chart)
    const divisionDataMap = members.reduce((acc, m) => {
        acc[m.division] = (acc[m.division] || 0) + m.totalPoints;
        return acc;
    }, {} as Record<string, number>);

    const divisionData = Object.entries(divisionDataMap).map(([name, value]) => ({
        name,
        value: Math.max(0, value)
    })).filter(d => d.value > 0);

    // 2. Top 5 Performers (Bar Chart)
    const top5Data = [...members]
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .slice(0, 5)
        .map(m => ({
            name: m.name,
            points: m.totalPoints
        }));

    // 3. Activity Trend - Last 7 Days (Area Chart)
    const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - i);
        return d;
    }).reverse();

    const activityData = last7Days.map(date => {
        const count = auditLogs.filter(log => {
            const logDate = new Date(log.timestamp);
            logDate.setHours(0, 0, 0, 0);
            return logDate.getTime() === date.getTime();
        }).length;

        return {
            date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            count
        };
    });

    // 4. Comparison: Achievements vs Violations
    const comparisonData = [
        { name: 'Prestasi', value: auditLogs.filter(log => log.points > 0).reduce((acc, log) => acc + log.points, 0) },
        { name: 'Pelanggaran', value: Math.abs(auditLogs.filter(log => log.points < 0).reduce((acc, log) => acc + log.points, 0)) }
    ];

    const activeToday = auditLogs.filter(log => {
        const d = new Date(log.timestamp);
        return d.toDateString() === new Date().toDateString();
    }).length;

    const top10High = [...members]
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .slice(0, 10);

    const top10Low = [...members]
        .sort((a, b) => a.totalPoints - b.totalPoints)
        .slice(0, 10);

    // 5. Active Contributors (Admins/Contributors)
    const contributorActivityMap = auditLogs.reduce((acc, log) => {
        acc[log.contributorId] = (acc[log.contributorId] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const contributorData = Object.entries(contributorActivityMap)
        .map(([id, count]) => ({
            name: users.find(u => u.id === id)?.name || id.split('-')[0],
            count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.pageTitle}>{t.dashboard.overview}</h1>
                <p className={styles.pageSubtitle}>Pantau kinerja dan aktivitas anggota secara real-time.</p>
            </div>

            <div className={styles.bentoGrid}>
                {/* Stat: Total Members */}
                <div className={`${styles.bentoItem} ${styles.span6}`}>
                    <div className={styles.statCard}>
                        <div className={styles.statHeader}>
                            <div className={styles.statIcon} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                                <Users size={24} />
                            </div>
                            <span className={`${styles.statTrend} ${styles.trendUp}`}>
                                <TrendingUp size={14} /> +2%
                            </span>
                        </div>
                        <div className={styles.statMeta}>
                            <div className={styles.statValue}>{members.length}</div>
                            <div className={styles.statLabel}>{t.dashboard.totalMembers}</div>
                        </div>
                    </div>
                </div>

                {/* Stat: Active Today */}
                <div className={`${styles.bentoItem} ${styles.span6}`}>
                    <div className={styles.statCard}>
                        <div className={styles.statHeader}>
                            <div className={styles.statIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                                <Activity size={24} />
                            </div>
                            <span className={`${styles.statTrend} ${activeToday > 0 ? styles.trendUp : styles.trendDown}`}>
                                {activeToday > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                {activeToday} Aktivitas
                            </span>
                        </div>
                        <div className={styles.statMeta}>
                            <div className={styles.statValue}>{activeToday}</div>
                            <div className={styles.statLabel}>Aktivitas Hari Ini</div>
                        </div>
                    </div>
                </div>

                {/* Alert: Members with Warnings */}
                {membersWithWarnings.length > 0 && (
                    <div className={`${styles.bentoItem} ${styles.span12}`}>
                        <div className={styles.chartCard} style={{ borderLeft: '4px solid var(--color-danger)', background: 'var(--color-danger-light)', opacity: 0.9 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                <div style={{ padding: '0.5rem', borderRadius: '50%', background: 'var(--color-white)', color: 'var(--color-danger)' }}>
                                    <AlertTriangle size={24} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h2 className={styles.chartTitle} style={{ color: 'var(--color-danger)', marginBottom: '0.25rem' }}>Perlu Perhatian ({membersWithWarnings.length})</h2>
                                    <p className={styles.chartDesc} style={{ margin: 0, color: 'var(--color-text)' }}>Anggota berikut telah mencapai batas peringatan poin.</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'thin', width: '100%' }}>
                                {membersWithWarnings.map(({ member, warnings }) => (
                                    <div key={member.id} style={{
                                        flex: '0 0 min(250px, 80%)',
                                        padding: '1rem',
                                        borderRadius: '12px',
                                        border: '1px solid var(--color-border)',
                                        background: 'var(--color-surface)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.25rem',
                                        boxShadow: 'var(--shadow-sm)'
                                    }}>
                                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)' }}>{member.name}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{member.division}</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-danger)', margin: '0.5rem 0' }}>{member.totalPoints} <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Poin</span></div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: 'auto' }}>
                                            {warnings.map(w => (
                                                <span key={w.id} style={{
                                                    fontSize: '0.7rem',
                                                    fontWeight: 600,
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '9999px',
                                                    background: w.backgroundColor,
                                                    color: w.textColor,
                                                    border: `1px solid ${w.textColor}40`
                                                }}>
                                                    {w.message}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                <div className={`${styles.bentoItem} ${styles.span8} ${styles.row2}`}>
                    <div className={styles.chartCard}>
                        <h2 className={styles.chartTitle}>Tren Aktivitas Mingguan</h2>
                        <p className={styles.chartDesc}>Jumlah pencatatan poin selama 7 hari terakhir.</p>
                        <div className={styles.chartContainer}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={activityData}>
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: 'none',
                                            boxShadow: 'var(--shadow-lg)',
                                            background: 'var(--color-surface)',
                                            color: 'var(--color-text)'
                                        }}
                                        itemStyle={{ color: 'var(--color-primary)' }}
                                    />
                                    <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* List: Recent Activity */}
                <div className={`${styles.bentoItem} ${styles.span4} ${styles.row2}`}>
                    <div className={styles.chartCard}>
                        <h2 className={styles.chartTitle}>{t.dashboard.recentActivity}</h2>
                        <p className={styles.chartDesc}>Riwayat perubahan poin terbaru.</p>
                        <div className={styles.activityList}>
                            {auditLogs.slice(0, 5).map((log, i) => {
                                const member = members.find(m => m.id === log.memberId);
                                const isPositive = log.points > 0;
                                return (
                                    <div key={log.id} className={styles.activityItem}>
                                        <div
                                            className={styles.activityIcon}
                                            style={{ background: isPositive ? '#d1fae5' : '#fee2e2', color: isPositive ? '#059669' : '#dc2626' }}
                                        >
                                            {member?.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className={styles.activityContent} style={{ minWidth: 0 }}>
                                            <div className={styles.activityTitle}>{member?.name || 'Unknown'}</div>
                                            <div className={styles.activityTime} title={log.details}>{log.details}</div>
                                        </div>
                                        <div className={styles.activityPoints} style={{ color: isPositive ? '#059669' : '#dc2626' }}>
                                            {isPositive ? '+' : ''}{log.points}
                                        </div>
                                    </div>
                                );
                            })}
                            {auditLogs.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                                    {t.dashboard.noActivity}
                                </div>
                            )}
                            <Link href="/dashboard/transactions" style={{
                                marginTop: '1rem',
                                textAlign: 'center',
                                color: 'var(--color-primary)',
                                textDecoration: 'none',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                            }}>
                                {t.dashboard.viewHistory} <ArrowUpRight size={14} />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Chart: Distribution (Small) */}
                <div className={`${styles.bentoItem} ${styles.span4}`}>
                    <div className={styles.chartCard}>
                        <h2 className={styles.chartTitle}>Distribusi Poin</h2>
                        <div className={styles.chartContainer} style={{ minHeight: '180px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={divisionData}
                                        innerRadius={50}
                                        outerRadius={70}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {divisionData.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: 'none',
                                            boxShadow: 'var(--shadow-lg)',
                                            background: 'var(--color-surface)',
                                            color: 'var(--color-text)'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Chart: Active Contributors (Small) */}
                <div className={`${styles.bentoItem} ${styles.span4}`}>
                    <div className={styles.chartCard}>
                        <h2 className={styles.chartTitle}>Kontributor Teraktif</h2>
                        <p className={styles.chartDesc}>Admin/Petugas dengan jumlah aksi terbanyak.</p>
                        <div className={styles.chartContainer} style={{ minHeight: '180px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={contributorData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11, fill: '#64748b' }}
                                        width={80}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: 'none',
                                            boxShadow: 'var(--shadow-lg)',
                                            background: 'var(--color-surface)',
                                            color: 'var(--color-text)'
                                        }}
                                    />
                                    <Bar dataKey="count" fill="var(--color-primary)" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Top 10 Highest Points */}
                <div className={`${styles.bentoItem} ${styles.span6}`}>
                    <div className={styles.chartCard} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h2 className={styles.chartTitle} style={{ color: 'white' }}>10 Poin Tertinggi</h2>
                            <Trophy size={24} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {top10High.map((m, i) => (
                                <div key={m.id} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0.5rem 0.75rem',
                                    borderRadius: '8px',
                                    background: 'rgba(255, 255, 255, 0.1)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <span style={{ fontWeight: 800, fontSize: '0.75rem', opacity: 0.8 }}>{String(i + 1).padStart(2, '0')}</span>
                                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{m.name}</span>
                                    </div>
                                    <span style={{ fontWeight: 800, background: 'rgba(255,255,255,0.2)', padding: '0.125rem 0.5rem', borderRadius: '4px' }}>{m.totalPoints}</span>
                                </div>
                            ))}
                            {top10High.length === 0 && <div style={{ fontSize: '0.875rem', opacity: 0.7, textAlign: 'center', padding: '1rem' }}>Belum ada data.</div>}
                        </div>
                    </div>
                </div>

                {/* Top 10 Lowest Points */}
                <div className={`${styles.bentoItem} ${styles.span6}`}>
                    <div className={styles.chartCard} style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white', border: 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h2 className={styles.chartTitle} style={{ color: 'white' }}>10 Poin Terendah</h2>
                            <TrendingDown size={24} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {top10Low.map((m, i) => (
                                <div key={m.id} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0.5rem 0.75rem',
                                    borderRadius: '8px',
                                    background: 'rgba(255, 255, 255, 0.1)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <span style={{ fontWeight: 800, fontSize: '0.75rem', opacity: 0.8 }}>{String(i + 1).padStart(2, '0')}</span>
                                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{m.name}</span>
                                    </div>
                                    <span style={{ fontWeight: 800, background: 'rgba(255,255,255,0.2)', padding: '0.125rem 0.5rem', borderRadius: '4px' }}>{m.totalPoints}</span>
                                </div>
                            ))}
                            {top10Low.length === 0 && <div style={{ fontSize: '0.875rem', opacity: 0.7, textAlign: 'center', padding: '1rem' }}>Belum ada data.</div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
