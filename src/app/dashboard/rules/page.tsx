'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { useStore } from '@/lib/context/StoreContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import { Rule } from '@/lib/store';
import { FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import clsx from 'clsx';

export default function RulesPage() {
    const { rules, addRule, deleteRule } = useStore();
    const { t } = useLanguage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newRule, setNewRule] = useState<Partial<Rule>>({ description: '', points: 0, type: 'VIOLATION' });

    const handleAddRule = () => {
        if (!newRule.description || !newRule.points) return;

        const id = 'R' + (rules.length + 1).toString().padStart(3, '0');

        addRule({
            id,
            description: newRule.description,
            points: Number(newRule.points),
            type: newRule.points > 0 ? 'ACHIEVEMENT' : 'VIOLATION'
        } as Rule);

        setIsModalOpen(false);
        setNewRule({ description: '', points: 0, type: 'VIOLATION' });
    };

    const handleDelete = (id: string) => {
        if (confirm(t.rules.deleteConfirm)) {
            deleteRule(id);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">{t.rules.title}</h1>
                <Button onClick={() => setIsModalOpen(true)}>
                    <FaPlus /> {t.rules.addRule}
                </Button>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t.rules.code}</TableHead>
                        <TableHead>{t.rules.description}</TableHead>
                        <TableHead>{t.rules.type}</TableHead>
                        <TableHead>{t.rules.points}</TableHead>
                        <TableHead>{t.common.actions}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rules.map((rule) => {
                        const typeLabel = rule.type === 'ACHIEVEMENT' ? t.rules.achievement : t.rules.violation;
                        return (
                            <TableRow key={rule.id}>
                                <TableCell className="font-medium">{rule.id}</TableCell>
                                <TableCell>{rule.description}</TableCell>
                                <TableCell>
                                    <span className={clsx(
                                        "px-2 py-1 rounded text-xs font-bold",
                                        rule.type === 'ACHIEVEMENT' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                    )} style={{
                                        color: rule.type === 'ACHIEVEMENT' ? 'var(--color-success)' : 'var(--color-danger)',
                                        background: rule.type === 'ACHIEVEMENT' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: 'var(--radius-sm)'
                                    }}>
                                        {typeLabel}
                                    </span>
                                </TableCell>
                                <TableCell style={{ fontWeight: 600, color: rule.points > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                    {rule.points > 0 ? `+${rule.points}` : rule.points}
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" className="p-2 text-danger" onClick={() => handleDelete(rule.id)}>
                                        <FaTrash />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={t.rules.addRule}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>{t.common.cancel}</Button>
                        <Button onClick={handleAddRule}>{t.common.save}</Button>
                    </>
                }
            >
                <div className="flex flex-col gap-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Input
                        label={t.rules.description}
                        placeholder="e.g. Broken Window"
                        value={newRule.description}
                        onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                    />
                    <Input
                        label={t.rules.typeLabel}
                        type="number"
                        placeholder="e.g. -10 or 20"
                        value={newRule.points}
                        onChange={(e) => setNewRule({ ...newRule, points: Number(e.target.value) })}
                    />
                </div>
            </Modal>
        </div>
    );
}
