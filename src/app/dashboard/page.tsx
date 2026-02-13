'use client';

import React from 'react';
import { useStore } from '@/lib/context/StoreContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import styles from './page.module.css';

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
    const { members, auditLogs, warningRules } = useStore();
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

    // Trends (Simple mock comparison)
    const activeToday = auditLogs.filter(log => {
        const d = new Date(log.timestamp);
        return d.toDateString() === new Date().toDateString();
    }).length;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.pageTitle}>{t.dashboard.overview}</h1>
                <p className={styles.pageSubtitle}>Pantau kinerja dan aktivitas anggota secara real-time.</p>
            </div>

            <div className={styles.bentoGrid}>
                {/* Stat: Total Members */}
                <div className={`${styles.bentoItem} ${styles.span3}`}>
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

                {/* Stat: Total Points */}
                <div className={`${styles.bentoItem} ${styles.span3}`}>
                    <div className={styles.statCard}>
                        <div className={styles.statHeader}>
                            <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                                <Zap size={24} />
                            </div>
                            <span className={`${styles.statTrend} ${styles.trendUp}`}>
                                <TrendingUp size={14} /> +12%
                            </span>
                        </div>
                        <div className={styles.statMeta}>
                            <div className={styles.statValue}>{totalPoints}</div>
                            <div className={styles.statLabel}>{t.dashboard.totalPoints}</div>
                        </div>
                    </div>
                </div>

                {/* Stat: Active Today */}
                <div className={`${styles.bentoItem} ${styles.span3}`}>
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

                {/* Stat: Top Performer */}
                <div className={`${styles.bentoItem} ${styles.span3}`}>
                    <div className={styles.statCard}>
                        <div className={styles.statHeader}>
                            <div className={styles.statIcon} style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                                <Trophy size={24} />
                            </div>
                            <ArrowUpRight size={18} style={{ color: 'var(--color-text-muted)' }} />
                        </div>
                        <div className={styles.statMeta}>
                            <div className={styles.statValue} style={{ fontSize: '1.5rem', paddingTop: '0.25rem' }}>
                                {topPerformer ? topPerformer.name.split(' ')[0] : 'N/A'}
                            </div>
                            <div className={styles.statLabel}>{t.dashboard.topPerformer}</div>
                        </div>
                    </div>
                </div>

                {/* Alert: Members with Warnings */}
                {membersWithWarnings.length > 0 && (
                    <div className={`${styles.bentoItem} ${styles.span12}`}>
                        <div className={styles.chartCard} style={{ borderLeft: '4px solid #ef4444', background: '#fff5f5' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                <div style={{ padding: '0.5rem', borderRadius: '50%', background: '#fee2e2', color: '#ef4444' }}>
                                    <AlertTriangle size={24} />
                                </div>
                                <div>
                                    <h2 className={styles.chartTitle} style={{ color: '#ef4444', marginBottom: '0.25rem' }}>Perlu Perhatian ({membersWithWarnings.length})</h2>
                                    <p className={styles.chartDesc} style={{ margin: 0 }}>Anggota berikut telah mencapai batas peringatan poin.</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'thin' }}>
                                {membersWithWarnings.map(({ member, warnings }) => (
                                    <div key={member.id} style={{
                                        flex: '0 0 220px',
                                        padding: '1rem',
                                        borderRadius: '12px',
                                        border: '1px solid #fecaca',
                                        background: '#fff',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.25rem',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                    }}>
                                        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1f2937' }}>{member.name}</div>
                                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{member.division}</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444', margin: '0.5rem 0' }}>{member.totalPoints} <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#991b1b' }}>Poin</span></div>
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
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
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
                                        <div className={styles.activityContent}>
                                            <div className={styles.activityTitle}>{member?.name || 'Unknown'}</div>
                                            <div className={styles.activityTime}>{log.details}</div>
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
                            <a href="/dashboard/transactions" style={{
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
                            </a>
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
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Chart: Comparison (Small) */}
                <div className={`${styles.bentoItem} ${styles.span4}`}>
                    <div className={styles.chartCard}>
                        <h2 className={styles.chartTitle}>Prestasi vs Pelanggaran</h2>
                        <div className={styles.chartContainer} style={{ minHeight: '180px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={comparisonData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={32}>
                                        {comparisonData.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Chart: Top Members (Small) */}
                <div className={`${styles.bentoItem} ${styles.span4}`}>
                    <div className={styles.chartCard} style={{ background: 'var(--color-primary)', color: 'white' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 className={styles.chartTitle} style={{ color: 'white' }}>Top Members</h2>
                            <Trophy size={18} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {top5Data.slice(0, 3).map((m, i) => (
                                <div key={m.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>{i + 1}. {m.name}</span>
                                    <span style={{ fontWeight: 800 }}>{m.points}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.75rem', opacity: 0.8 }}>
                            Anggota dengan performa terbaik bulan ini.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
