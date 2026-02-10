'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useStore } from '@/lib/context/StoreContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import styles from './page.module.css';

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function DashboardPage() {
    const { members, auditLogs } = useStore();
    const { t } = useLanguage();

    const totalPoints = members.reduce((acc, m) => acc + m.totalPoints, 0);
    const topPerformer = members.length > 0
        ? members.reduce((prev, current) => (prev.totalPoints > current.totalPoints) ? prev : current)
        : null;

    // --- Data Aggregation for Charts ---

    // 1. Division Distribution (Pie Chart)
    const divisionDataMap = members.reduce((acc, m) => {
        acc[m.division] = (acc[m.division] || 0) + m.totalPoints;
        return acc;
    }, {} as Record<string, number>);

    const divisionData = Object.entries(divisionDataMap).map(([name, value]) => ({
        name,
        value: Math.max(0, value) // Only show positive contributions in pie
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

    // 4. Comparison: Achievements vs Violations (Bar/Pie)
    const comparisonData = [
        { name: 'Penambahan (Prestasi)', value: auditLogs.filter(log => log.points > 0).reduce((acc, log) => acc + log.points, 0) },
        { name: 'Pengurangan (Pelanggaran)', value: Math.abs(auditLogs.filter(log => log.points < 0).reduce((acc, log) => acc + log.points, 0)) }
    ];

    // 5. Impact Analysis (Stacked Bar by Division)
    const divisionImpactMap = members.reduce((acc, m) => {
        if (!acc[m.division]) acc[m.division] = { name: m.division, positive: 0, negative: 0 };
        const memberLogs = auditLogs.filter(log => log.memberId === m.id);
        memberLogs.forEach(log => {
            if (log.points > 0) acc[m.division].positive += log.points;
            else acc[m.division].negative += Math.abs(log.points);
        });
        return acc;
    }, {} as Record<string, { name: string, positive: number, negative: number }>);

    const impactData = Object.values(divisionImpactMap);

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

            {/* Charts Section */}
            <div className={styles.chartsGrid}>
                {/* 1. Activity Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle>Aktivitas 7 Hari Terakhir</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={styles.chartContainer}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={activityData}>
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Point Comparison */}
                <Card>
                    <CardHeader>
                        <CardTitle>Penambahan vs Pengurangan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={styles.chartContainer} style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={comparisonData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                                    <YAxis axisLine={false} tickLine={false} hide />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                                        {comparisonData.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Impact by Division */}
                <Card>
                    <CardHeader>
                        <CardTitle>Dampak Per Divisi (Prestasi vs Pelanggaran)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={styles.chartContainer}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={impactData} margin={{ bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} angle={-15} textAnchor="end" />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Legend />
                                    <Bar dataKey="positive" name="Prestasi" fill="#10b981" radius={[2, 2, 0, 0]} />
                                    <Bar dataKey="negative" name="Pelanggaran" fill="#ef4444" radius={[2, 2, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Division Points (Pie) */}
                <Card>
                    <CardHeader>
                        <CardTitle>Distribusi Poin Divisi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={styles.chartContainer}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={divisionData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {divisionData.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* 5. Top Performers */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top 5 Anggota Terbaik</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={styles.chartContainer}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={top5Data} layout="vertical" margin={{ left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={80} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Bar dataKey="points" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* 6. Recent Logs Link */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t.dashboard.recentActivity}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {auditLogs.slice(0, 5).map(log => (
                                <div key={log.id} style={{ fontSize: '0.875rem', padding: '0.5rem', background: 'rgba(0,0,0,0.02)', borderRadius: '4px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.75rem' }}>{log.id}</span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                    <span style={{ fontWeight: 600 }}>{members.find(m => m.id === log.memberId)?.name}</span>: {log.details}
                                </div>
                            ))}
                            <p style={{ marginTop: '0.5rem' }}>
                                <a href="/dashboard/transactions" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
                                    {t.dashboard.viewHistory} →
                                </a>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
