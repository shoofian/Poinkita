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
    AlertTriangle,
    Scale,
    CheckCircle2
} from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function DashboardPage() {
    const { members, auditLogs, warningRules, users, appeals } = useStore();
    const { t } = useLanguage();
    const [rankFilter, setRankFilter] = React.useState<'day' | 'week' | 'month' | 'year'>('week');

    const pendingAppeals = (appeals || []).filter(a => a.status === 'PENDING');

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

    // --- Ranking Data with Time Filter ---
    const getFilteredLogs = () => {
        const now = new Date();
        const start = new Date();
        if (rankFilter === 'day') start.setHours(0, 0, 0, 0);
        else if (rankFilter === 'week') start.setDate(now.getDate() - 7);
        else if (rankFilter === 'month') start.setMonth(now.getMonth() - 1);
        else if (rankFilter === 'year') start.setFullYear(now.getFullYear() - 1);

        return auditLogs.filter(log => new Date(log.timestamp) >= start);
    };

    const filteredLogsForRank = getFilteredLogs();

    const achievementTypeRank = Array.from(
        filteredLogsForRank
            .filter(log => log.points > 0 && log.details !== t.members.initialPoints && log.details !== 'Initial Points' && log.details !== 'Poin Awal')
            .reduce((acc, log) => {
                acc.set(log.details, (acc.get(log.details) || 0) + 1);
                return acc;
            }, new Map<string, number>())
    ).map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    const violationTypeRank = Array.from(
        filteredLogsForRank
            .filter(log => log.points < 0 && log.details !== t.members.initialPoints && log.details !== 'Initial Points' && log.details !== 'Poin Awal')
            .reduce((acc, log) => {
                acc.set(log.details, (acc.get(log.details) || 0) + 1);
                return acc;
            }, new Map<string, number>())
    ).map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

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

                {/* Alert: Pending Appeals */}
                {pendingAppeals.length > 0 && (
                    <div className={`${styles.bentoItem} ${styles.span12}`}>
                        <div className={styles.chartCard} style={{ borderLeft: '4px solid var(--color-primary)', background: 'rgba(59, 130, 246, 0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                <div style={{ padding: '0.5rem', borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                                    <Scale size={24} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h2 className={styles.chartTitle} style={{ color: 'var(--color-primary)', marginBottom: '0.25rem' }}>Banding Baru ({pendingAppeals.length})</h2>
                                    <p className={styles.chartDesc} style={{ margin: 0, color: 'var(--color-text)' }}>Beberapa anggota mengajukan banding atas transaksi poin mereka.</p>
                                </div>
                                <Link href="/dashboard/appeals" className={styles.filterBtnActive} style={{ padding: '0.5rem 1rem', borderRadius: '8px', textDecoration: 'none', fontSize: '0.875rem' }}>
                                    Kelola Semua
                                </Link>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'thin', width: '100%' }}>
                                {pendingAppeals.map((appeal) => {
                                    const member = members.find(m => m.id === appeal.memberId);
                                    return (
                                        <div key={appeal.id} style={{
                                            flex: '0 0 min(300px, 85%)',
                                            padding: '1rem',
                                            borderRadius: '12px',
                                            border: '1px solid var(--color-border)',
                                            background: 'var(--color-surface)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.5rem',
                                            boxShadow: 'var(--shadow-sm)'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)' }}>{member?.name || 'Anggota'}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{new Date(appeal.timestamp).toLocaleString()}</div>
                                                </div>
                                                <div style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.5rem', borderRadius: '999px' }}>
                                                    PENDING
                                                </div>
                                            </div>
                                            <div style={{
                                                fontSize: '0.875rem',
                                                color: 'var(--color-text)',
                                                background: 'var(--color-bg-subtle)',
                                                padding: '0.75rem',
                                                borderRadius: '8px',
                                                fontStyle: 'italic',
                                                borderLeft: '3px solid var(--color-primary)'
                                            }}>
                                                "{appeal.reason}"
                                            </div>
                                        </div>
                                    );
                                })}
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
                                const isNegative = log.points < 0;

                                // Color logic
                                const bgColor = isPositive ? 'var(--color-success-bg)' : (isNegative ? 'var(--color-danger-bg)' : 'var(--color-bg-hover)');
                                const textColor = isPositive ? 'var(--color-success)' : (isNegative ? 'var(--color-danger)' : 'var(--color-text-secondary)');

                                return (
                                    <div key={log.id} className={styles.activityItem}>
                                        <div
                                            className={styles.activityIcon}
                                            style={{ background: bgColor, color: textColor }}
                                        >
                                            {member?.name.charAt(0).toUpperCase() || 'A'}
                                        </div>
                                        <div className={styles.activityContent} style={{ minWidth: 0 }}>
                                            <div className={styles.activityTitle}>{member?.name || 'Unknown'}</div>
                                            <div className={styles.activityTime} title={log.details}>{log.details}</div>
                                        </div>
                                        <div className={styles.activityPoints} style={{ color: textColor }}>
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

                {/* --- New Ranking Charts Section --- */}
                <div className={`${styles.bentoItem} ${styles.span12}`}>
                    <div className={styles.chartCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <h2 className={styles.chartTitle}>Frekuensi Jenis Poin</h2>
                                <p className={styles.chartDesc}>Kategori pencatatan yang paling sering muncul berdasarkan periode.</p>
                            </div>
                            <div className={styles.filterGroup}>
                                {(['day', 'week', 'month', 'year'] as const).map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setRankFilter(f)}
                                        className={`${styles.filterBtn} ${rankFilter === f ? styles.filterBtnActive : ''}`}
                                    >
                                        {f === 'day' ? 'Hari' : f === 'week' ? 'Minggu' : f === 'month' ? 'Bulan' : 'Tahun'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Tick for long labels */}
                        {(() => {
                            const CustomYAxisTick = ({ x, y, payload }: any) => {
                                const name = payload.value;
                                const truncated = name.length > 30 ? name.substring(0, 27) + '...' : name;
                                return (
                                    <g transform={`translate(${x},${y})`}>
                                        <text x={-10} y={0} dy={4} textAnchor="end" fill="var(--color-text-muted)" fontSize={11} fontWeight={500}>
                                            {truncated}
                                            {name.length > 30 && <title>{name}</title>}
                                        </text>
                                    </g>
                                );
                            };

                            return (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2.5rem' }}>
                                    {/* Achievement Chart */}
                                    <div>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-success)' }}>
                                            <Trophy size={18} /> Kategori Pencapaian
                                        </h3>
                                        <div style={{ height: '300px' }}>
                                            {achievementTypeRank.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={achievementTypeRank} layout="vertical" margin={{ left: 20, right: 30 }}>
                                                        <XAxis type="number" hide />
                                                        <YAxis
                                                            dataKey="name"
                                                            type="category"
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tick={<CustomYAxisTick />}
                                                            width={180}
                                                        />
                                                        <Tooltip
                                                            cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }}
                                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
                                                        />
                                                        <Bar dataKey="count" name="Frekuensi" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24}>
                                                            {achievementTypeRank.map((_, index) => (
                                                                <Cell key={`cell-${index}`} fillOpacity={1 - (index * 0.15)} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem', background: 'var(--color-bg-alt)', borderRadius: '12px' }}>
                                                    Tidak ada data pencapaian
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Violation Chart */}
                                    <div>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-danger)' }}>
                                            <AlertTriangle size={18} /> Kategori Pelanggaran
                                        </h3>
                                        <div style={{ height: '300px' }}>
                                            {violationTypeRank.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={violationTypeRank} layout="vertical" margin={{ left: 20, right: 30 }}>
                                                        <XAxis type="number" hide />
                                                        <YAxis
                                                            dataKey="name"
                                                            type="category"
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tick={<CustomYAxisTick />}
                                                            width={180}
                                                        />
                                                        <Tooltip
                                                            cursor={{ fill: 'rgba(239, 68, 68, 0.05)' }}
                                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
                                                        />
                                                        <Bar dataKey="count" name="Frekuensi" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={24}>
                                                            {violationTypeRank.map((_, index) => (
                                                                <Cell key={`cell-${index}`} fillOpacity={1 - (index * 0.15)} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem', background: 'var(--color-bg-alt)', borderRadius: '12px' }}>
                                                    Tidak ada data pelanggaran
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
}
