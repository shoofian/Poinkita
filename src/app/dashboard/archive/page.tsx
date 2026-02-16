'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { useStore } from '@/lib/context/StoreContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useDialog } from '@/components/ui/ConfirmDialog';
import { Archive } from '@/lib/store';
import { FaTrash, FaEye, FaChevronLeft, FaArchive } from 'react-icons/fa';

export default function ArchivePage() {
    const { archives, deleteArchive, currentUser } = useStore();
    const { t } = useLanguage();
    const { confirm } = useDialog();

    const [selectedArchive, setSelectedArchive] = useState<Archive | null>(null);

    const handleDelete = async (e: React.MouseEvent, archive: Archive) => {
        e.stopPropagation();

        const ok = await confirm({
            title: t.archive.deleteArchive,
            message: t.archive.confirmDelete,
            variant: 'danger'
        });

        if (ok) {
            deleteArchive(archive.id);
            if (selectedArchive?.id === archive.id) {
                setSelectedArchive(null);
            }
        }
    };

    if (selectedArchive) {
        return (
            <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="secondary" onClick={() => setSelectedArchive(null)}>
                        <FaChevronLeft />
                    </Button>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                        {selectedArchive.title}
                    </h1>
                </div>

                <Card>
                    <CardHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <CardTitle>{t.archive.memberSnapshot}</CardTitle>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                {new Date(selectedArchive.timestamp).toLocaleString()}
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>{t.auth.name}</TableHead>
                                    <TableHead>{t.members.division}</TableHead>
                                    <TableHead style={{ textAlign: 'right' }}>{t.members.points}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {selectedArchive.memberSnapshots.map((member, index) => (
                                    <TableRow key={`${member.id}-${index}`}>
                                        <TableCell style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{member.id}</TableCell>
                                        <TableCell style={{ fontWeight: 500 }}>{member.name}</TableCell>
                                        <TableCell>{member.division}</TableCell>
                                        <TableCell style={{
                                            textAlign: 'right',
                                            fontWeight: 600,
                                            color: member.points >= 0 ? 'var(--color-success)' : 'var(--color-danger)'
                                        }}>
                                            {member.points > 0 ? `+${member.points}` : member.points}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>
                    {t.archive.title}
                </h1>
                <p style={{ color: 'var(--color-text-muted)' }}>
                    Lihat snapshot data yang telah Anda simpan sebelumnya.
                </p>
            </div>

            {archives.length === 0 ? (
                <Card style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <CardContent>
                        <div style={{ fontSize: '3rem', color: 'var(--color-border)', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                            <FaArchive />
                        </div>
                        <p style={{ color: 'var(--color-text-muted)' }}>{t.archive.noArchives}</p>
                    </CardContent>
                </Card>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: '1.5rem' }}>
                    {archives.map((archive) => (
                        <Card key={archive.id} style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }} onClick={() => setSelectedArchive(archive)}>
                            <CardHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <CardTitle style={{ fontSize: '1.125rem' }}>{archive.title}</CardTitle>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                        {new Date(archive.timestamp).toLocaleString()}
                                    </span>
                                </div>
                                {currentUser?.role === 'ADMIN' && (
                                    <Button
                                        variant="danger"
                                        onClick={(e) => handleDelete(e, archive)}
                                        style={{ padding: '0.4rem' }}
                                    >
                                        <FaTrash size={12} />
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                        {archive.memberSnapshots.length} Anggota
                                    </span>
                                    <Button variant="secondary" className="flex items-center gap-2">
                                        <FaEye /> {t.archive.viewArchive}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}


