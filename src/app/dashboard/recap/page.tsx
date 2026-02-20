'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/context/StoreContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useDialog } from '@/components/ui/ConfirmDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import clsx from 'clsx';

export default function RecapPage() {
    const { members, currentUser } = useStore();
    const isAdmin = currentUser?.role === 'ADMIN';
    const { t } = useLanguage();
    const [filterDivision, setFilterDivision] = useState('');
    const [searchName, setSearchName] = useState('');

    const filteredMembers = members.filter(m => {
        const matchDivision = filterDivision ? m.division.toLowerCase().includes(filterDivision.toLowerCase()) : true;
        const matchName = searchName ? m.name.toLowerCase().includes(searchName.toLowerCase()) : true;
        return matchDivision && matchName;
    });

    const uniqueDivisions = Array.from(new Set(members.map(m => m.division)));



    return (
        <div className="flex flex-col gap-6" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                flexWrap: 'wrap',
                marginBottom: '1rem'
            }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{t.recap.title}</h1>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t.recap.filterData}</CardTitle>
                </CardHeader>
                <CardContent style={{ padding: '1.25rem' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1rem',
                        alignItems: 'flex-end'
                    }}>
                        <Input
                            label={t.common.search}
                            placeholder="..."
                            value={searchName}
                            onChange={(e) => setSearchName(e.target.value)}
                        />
                        <div className="flex flex-col gap-1" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label className="text-sm font-medium text-gray-500">{t.members.division}</label>
                            <select
                                className="p-2 border rounded-md"
                                value={filterDivision}
                                onChange={(e) => setFilterDivision(e.target.value)}
                                style={{
                                    padding: '0.625rem 0.875rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-surface)',
                                    color: 'var(--color-text-main)'
                                }}
                            >
                                <option value="">{t.recap.allDivisions}</option>
                                {uniqueDivisions.map(div => (
                                    <option key={div} value={div}>{div}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent style={{ padding: 0 }}>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t.recap.rank}</TableHead>
                                <TableHead>{t.auth.name}</TableHead>
                                <TableHead>{t.members.division}</TableHead>
                                <TableHead>{t.dashboard.totalPoints}</TableHead>
                                <TableHead>{t.members.status}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredMembers
                                .sort((a, b) => b.totalPoints - a.totalPoints)
                                .map((member, index) => (
                                    <TableRow key={member.id}>
                                        <TableCell>#{index + 1}</TableCell>
                                        <TableCell className="font-semibold">{member.name}</TableCell>
                                        <TableCell>{member.division}</TableCell>
                                        <TableCell style={{ fontSize: '1.1em', fontWeight: 'bold', color: member.totalPoints >= 0 ? 'var(--color-primary)' : 'var(--color-danger)' }}>
                                            {member.totalPoints}
                                        </TableCell>
                                        <TableCell>
                                            <span className={clsx(
                                                "px-2 py-1 rounded text-xs",
                                                member.totalPoints > 50 ? "bg-blue-100 text-blue-700" :
                                                    member.totalPoints >= 0 ? "bg-gray-100 text-gray-700" : "bg-red-100 text-red-700"
                                            )} style={{
                                                background: member.totalPoints > 50 ? 'var(--color-primary-light)' : member.totalPoints >= 0 ? 'var(--color-bg-hover)' : 'var(--color-danger-bg)',
                                                color: member.totalPoints > 50 ? 'var(--color-primary)' : member.totalPoints >= 0 ? 'var(--color-text-main)' : 'var(--color-danger)',
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '4px'
                                            }}>
                                                {member.totalPoints > 50 ? t.members.excellent : member.totalPoints >= 0 ? t.members.good : t.members.needsImprovement}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>


        </div >
    );
}
