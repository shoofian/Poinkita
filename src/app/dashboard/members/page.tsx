'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { useStore } from '@/lib/context/StoreContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import { Member } from '@/lib/store';
import { FaPlus, FaSearch, FaTrash, FaEdit } from 'react-icons/fa';
import clsx from 'clsx';

export default function MembersPage() {
    const { members, addMember, deleteMember } = useStore();
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newMember, setNewMember] = useState<Partial<Member>>({ name: '', division: '', id: '' });

    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddMember = () => {
        if (!newMember.name || !newMember.division || !newMember.id) return;

        addMember({
            id: newMember.id,
            name: newMember.name,
            division: newMember.division,
            totalPoints: 0
        } as Member);

        setIsModalOpen(false);
        setNewMember({ name: '', division: '', id: '' });
    };

    const handleDelete = (id: string) => {
        if (confirm(t.members.deleteConfirm)) {
            deleteMember(id);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{t.members.title}</CardTitle>
                    <Button onClick={() => setIsModalOpen(true)}>
                        <FaPlus /> {t.members.addMember}
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 mb-4">
                        <div style={{ position: 'relative', width: '300px' }}>
                            <FaSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                            <Input
                                placeholder={t.common.search}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                                style={{ paddingLeft: '2.5rem' }}
                            />
                        </div>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t.members.memberId}</TableHead>
                                <TableHead>{t.auth.name}</TableHead>
                                <TableHead>{t.members.division}</TableHead>
                                <TableHead>{t.members.points}</TableHead>
                                <TableHead>{t.common.actions}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredMembers.map((member) => (
                                <TableRow key={member.id}>
                                    <TableCell className="font-medium">{member.id}</TableCell>
                                    <TableCell>{member.name}</TableCell>
                                    <TableCell>{member.division}</TableCell>
                                    <TableCell>
                                        <span className={clsx(
                                            "px-2 py-1 rounded text-sm font-semibold",
                                            member.totalPoints >= 0 ? "text-green-600 bg-green-100" : "text-red-600 bg-red-100"
                                        )} style={{
                                            color: member.totalPoints >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
                                            background: member.totalPoints >= 0 ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: 'var(--radius-sm)'
                                        }}>
                                            {member.totalPoints}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" className="p-2" onClick={() => alert('Edit feature coming soon!')}>
                                                <FaEdit />
                                            </Button>
                                            <Button variant="ghost" className="p-2 text-red-500" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(member.id)}>
                                                <FaTrash />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={t.members.addMember}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>{t.common.cancel}</Button>
                        <Button onClick={handleAddMember}>{t.common.save}</Button>
                    </>
                }
            >
                <div className="flex flex-col gap-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Input
                        label={t.members.memberId}
                        placeholder="e.g. M004"
                        value={newMember.id}
                        onChange={(e) => setNewMember({ ...newMember, id: e.target.value })}
                    />
                    <Input
                        label={t.auth.name}
                        placeholder="e.g. John Doe"
                        value={newMember.name}
                        onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                    />
                    <Input
                        label={t.members.division}
                        placeholder="e.g. Staff / Class 12B"
                        value={newMember.division}
                        onChange={(e) => setNewMember({ ...newMember, division: e.target.value })}
                    />
                </div>
            </Modal>
        </div>
    );
}
