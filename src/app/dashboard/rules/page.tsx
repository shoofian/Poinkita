'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { useStore } from '@/lib/context/StoreContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useDialog } from '@/components/ui/ConfirmDialog';
import { Rule, WarningRule } from '@/lib/store';
import { FaPlus, FaTrash, FaDownload, FaFileExcel, FaExclamationTriangle, FaEllipsisV } from 'react-icons/fa';
import clsx from 'clsx';
import * as XLSX from 'xlsx';

export default function RulesPage() {
    const { currentUser, rules, warningRules, addRule, addRules, deleteRule, deleteRules, addWarningRule, deleteWarningRule, generateId } = useStore();
    const isAdmin = currentUser?.role === 'ADMIN';
    const { t } = useLanguage();
    const { confirm, alert } = useDialog();

    const [activeTab, setActiveTab] = useState<'rules' | 'warnings'>('rules');

    // Rules State
    const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [newRule, setNewRule] = useState({ description: '', points: '', type: 'VIOLATION' as 'ACHIEVEMENT' | 'VIOLATION' });

    // Warning Rules State
    const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
    const [newWarning, setNewWarning] = useState({
        name: '',
        threshold: '',
        message: '',
        action: '',
        textColor: '#ffffff',
        backgroundColor: '#ef4444' // Default red
    });
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>([]);

    const toggleSelectAll = () => {
        if (selectedRuleIds.length === rules.length) {
            setSelectedRuleIds([]);
        } else {
            setSelectedRuleIds(rules.map(r => r.id));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedRuleIds(prev =>
            prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        const ok = await confirm({
            title: `Hapus ${selectedRuleIds.length} Aturan`,
            message: "Apakah Anda yakin ingin menghapus semua aturan yang dipilih? Tindakan ini tidak dapat dibatalkan.",
            variant: 'danger',
            confirmLabel: t.common.delete,
            cancelLabel: t.common.cancel
        });

        if (ok) {
            deleteRules(selectedRuleIds);
            setSelectedRuleIds([]);
            alert({
                title: "Berhasil",
                message: `${selectedRuleIds.length} aturan telah dihapus.`,
                variant: 'success'
            });
        }
    };

    const handleAddRule = () => {
        const pointsNum = Number(newRule.points);
        if (!newRule.description || isNaN(pointsNum)) return;

        addRule({
            id: generateId('RUL', pointsNum > 0 ? 'ACH' : 'VIO'),
            description: newRule.description,
            points: pointsNum,
            type: pointsNum > 0 ? 'ACHIEVEMENT' : 'VIOLATION',
            adminId: '' // Set by context
        } as Rule);

        setIsRuleModalOpen(false);
        setNewRule({ description: '', points: '', type: 'VIOLATION' });
    };

    const handleDeleteRule = async (id: string) => {
        const ok = await confirm({
            title: t.rules.deleteConfirm,
            message: "This action will permanently delete this rule and cannot be undone.",
            variant: 'danger',
            confirmLabel: t.common.delete,
            cancelLabel: t.common.cancel
        });

        if (ok) {
            deleteRule(id);
        }
    };

    const handleAddWarningRule = () => {
        const thresholdNum = Number(newWarning.threshold);
        if (!newWarning.name || isNaN(thresholdNum)) return;

        addWarningRule({
            id: generateId('WRN'),
            name: newWarning.name,
            threshold: thresholdNum,
            message: newWarning.message,
            action: newWarning.action,
            textColor: newWarning.textColor,
            backgroundColor: newWarning.backgroundColor,
            adminId: ''
        });

        setIsWarningModalOpen(false);
        setNewWarning({
            name: '',
            threshold: '',
            message: '',
            action: '',
            textColor: '#ffffff',
            backgroundColor: '#ef4444'
        });
    };

    const handleDeleteWarning = async (id: string) => {
        const ok = await confirm({
            title: "Delete Warning Rule",
            message: "This will delete the warning configuration.",
            variant: 'danger'
        });

        if (ok) {
            deleteWarningRule(id);
        }
    };

    const handleDownloadTemplate = () => {
        const templateData = [
            { Description: "Datang Terlambat", Points: -5 },
            { Description: "Juara 1 Lomba", Points: 20 },
        ];

        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Rules Template");
        XLSX.writeFile(wb, "Poinkita_Rules_Template.xlsx");
    };

    const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws) as any[];

                const importedRules: Rule[] = [];
                let currentSeq = 0;
                const date = new Date();
                const yyyymmdd = date.getFullYear().toString() +
                    (date.getMonth() + 1).toString().padStart(2, '0') +
                    date.getDate().toString().padStart(2, '0');

                const existingIds = rules.map(r => r.id);

                data.forEach((row) => {
                    const description = row.Description || row.Deskripsi || row.description || row.deskripsi;
                    const points = Number(row.Points || row.Poin || row.points || row.poin || 0);

                    if (!description || points === 0) return;

                    const type = points > 0 ? 'ACHIEVEMENT' : 'VIOLATION';
                    const prefix = type === 'ACHIEVEMENT' ? 'ACH' : 'VIO';

                    currentSeq++;
                    let seq = currentSeq;
                    let id = `RUL-${prefix}-${yyyymmdd}-${seq.toString().padStart(3, '0')}`;
                    while (existingIds.includes(id) || importedRules.some(r => r.id === id)) {
                        seq++;
                        id = `RUL-${prefix}-${yyyymmdd}-${seq.toString().padStart(3, '0')}`;
                    }
                    currentSeq = seq;

                    importedRules.push({
                        id,
                        description,
                        points,
                        type,
                        adminId: ''
                    } as Rule);
                });

                if (importedRules.length > 0) {
                    addRules(importedRules);
                    alert({
                        title: "Import Success",
                        message: t.rules.importRulesSuccess.replace('{0}', importedRules.length.toString()),
                        variant: 'success'
                    });
                }
            } catch (error) {
                console.error(error);
                alert({
                    title: "Import Error",
                    message: "Failed to process Excel file.",
                    variant: 'danger'
                });
            }
            if (e.target) e.target.value = '';
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div className="flex flex-col gap-6" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                <button
                    onClick={() => setActiveTab('rules')}
                    style={{
                        padding: '0.5rem 1rem',
                        background: activeTab === 'rules' ? 'var(--color-primary-light)' : 'transparent',
                        color: activeTab === 'rules' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        borderRadius: 'var(--radius-md)',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600
                    }}
                >
                    {t.rules.title}
                </button>
                <button
                    onClick={() => setActiveTab('warnings')}
                    style={{
                        padding: '0.5rem 1rem',
                        background: activeTab === 'warnings' ? 'var(--color-primary-light)' : 'transparent',
                        color: activeTab === 'warnings' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        borderRadius: 'var(--radius-md)',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <FaExclamationTriangle size={14} />
                    Warning Thresholds
                </button>
            </div>

            {activeTab === 'rules' ? (
                <Card style={{ overflow: 'visible' }}>
                    <CardHeader style={{
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '1rem'
                    }}>
                        <div>
                            <CardTitle style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--color-primary)' }}>
                                {t.rules.title}
                            </CardTitle>
                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                {rules.length} {t.rules.title.toLowerCase()}
                            </p>
                        </div>

                        {isAdmin && (
                            <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
                                <Button onClick={() => setIsRuleModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <FaPlus /> {t.rules.addRule}
                                </Button>

                                <div style={{ position: 'relative' }}>
                                    <Button
                                        variant="secondary"
                                        onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                                        style={{ padding: '0.625rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <FaEllipsisV />
                                    </Button>

                                    {isMoreMenuOpen && (
                                        <>
                                            <div
                                                style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                                                onClick={() => setIsMoreMenuOpen(false)}
                                            />
                                            <div style={{
                                                position: 'absolute',
                                                top: 'calc(100% + 8px)',
                                                right: 0,
                                                background: 'var(--color-white)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: 'var(--radius-md)',
                                                boxShadow: 'var(--shadow-lg)',
                                                zIndex: 50,
                                                minWidth: '220px',
                                                padding: '0.5rem',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    {t.common.actions}
                                                </div>
                                                <button
                                                    onClick={() => { handleDownloadTemplate(); setIsMoreMenuOpen(false); }}
                                                    style={{
                                                        width: '100%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.75rem',
                                                        padding: '0.75rem 1rem',
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        fontSize: '0.875rem',
                                                        color: 'var(--color-text)',
                                                        borderRadius: 'var(--radius-sm)',
                                                        textAlign: 'left'
                                                    }}
                                                    onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-gray-100)'}
                                                    onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                                                >
                                                    <FaDownload /> {t.common.downloadTemplate}
                                                </button>
                                                <button
                                                    onClick={() => { fileInputRef.current?.click(); setIsMoreMenuOpen(false); }}
                                                    style={{
                                                        width: '100%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.75rem',
                                                        padding: '0.75rem 1rem',
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        fontSize: '0.875rem',
                                                        color: 'var(--color-text)',
                                                        borderRadius: 'var(--radius-sm)',
                                                        textAlign: 'left'
                                                    }}
                                                    onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-gray-100)'}
                                                    onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                                                >
                                                    <FaFileExcel style={{ color: '#107c41' }} /> {t.common.importExcel}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    style={{ display: 'none' }}
                                    ref={fileInputRef}
                                    onChange={handleExcelImport}
                                />

                                {selectedRuleIds.length > 0 && isAdmin && (
                                    <Button
                                        variant="danger"
                                        onClick={handleBulkDelete}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    >
                                        <FaTrash />
                                        <span style={{ display: 'inline' }}>
                                            {t.common.delete} ({selectedRuleIds.length})
                                        </span>
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {isAdmin && (
                                        <TableHead style={{ width: '40px' }}>
                                            <input
                                                type="checkbox"
                                                checked={rules.length > 0 && selectedRuleIds.length === rules.length}
                                                onChange={toggleSelectAll}
                                                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                            />
                                        </TableHead>
                                    )}
                                    <TableHead>{t.rules.code}</TableHead>
                                    <TableHead>{t.rules.description}</TableHead>
                                    <TableHead>{t.rules.type}</TableHead>
                                    <TableHead>{t.rules.points}</TableHead>
                                    {isAdmin && <TableHead>{t.common.actions}</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rules.map((rule) => {
                                    const typeLabel = rule.type === 'ACHIEVEMENT' ? t.rules.achievement : t.rules.violation;
                                    return (
                                        <TableRow key={rule.id} style={{ background: selectedRuleIds.includes(rule.id) ? 'var(--color-primary-light)' : 'transparent' }}>
                                            {isAdmin && (
                                                <TableCell>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedRuleIds.includes(rule.id)}
                                                        onChange={() => toggleSelect(rule.id)}
                                                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                                    />
                                                </TableCell>
                                            )}
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
                                            {isAdmin && (
                                                <TableCell>
                                                    <Button variant="ghost" className="p-2 text-danger" onClick={() => handleDeleteRule(rule.id)}>
                                                        <FaTrash />
                                                    </Button>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <CardTitle>Warning Thresholds</CardTitle>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                Configure automatic alerts when a member's points drop below a certain value.
                            </p>
                        </div>
                        {isAdmin && (
                            <Button onClick={() => setIsWarningModalOpen(true)}>
                                <FaPlus /> Add Threshold
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Threshold</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Alert Preview</TableHead>
                                    {isAdmin && <TableHead>{t.common.actions}</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {warningRules.sort((a, b) => b.threshold - a.threshold).map((rule) => (
                                    <TableRow key={rule.id}>
                                        <TableCell style={{ fontWeight: 'bold' }}>&le; {rule.threshold}</TableCell>
                                        <TableCell>{rule.name}</TableCell>
                                        <TableCell>{rule.action}</TableCell>
                                        <TableCell>
                                            <div style={{
                                                padding: '0.5rem',
                                                borderRadius: '4px',
                                                backgroundColor: rule.backgroundColor,
                                                color: rule.textColor,
                                                fontSize: '0.875rem',
                                                fontWeight: 500,
                                                display: 'inline-block'
                                            }}>
                                                {rule.message}
                                            </div>
                                        </TableCell>
                                        {isAdmin && (
                                            <TableCell>
                                                <Button variant="ghost" className="p-2 text-danger" onClick={() => handleDeleteWarning(rule.id)}>
                                                    <FaTrash />
                                                </Button>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                                {warningRules.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
                                            No warning thresholds configured.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Rule Modal */}
            <Modal
                isOpen={isRuleModalOpen}
                onClose={() => setIsRuleModalOpen(false)}
                title={t.rules.addRule}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsRuleModalOpen(false)}>{t.common.cancel}</Button>
                        <Button onClick={handleAddRule}>{t.common.save}</Button>
                    </>
                }
            >
                <div className="flex flex-col gap-6" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem' }}>
                    <Input
                        label={t.rules.description}
                        placeholder="e.g. Broken Window"
                        value={newRule.description}
                        onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                    />
                    <Input
                        label={t.rules.typeLabel}
                        placeholder="e.g. -10 or 20"
                        value={newRule.points}
                        onChange={(e) => setNewRule({ ...newRule, points: e.target.value })}
                    />
                </div>
            </Modal>

            {/* Warning Rule Modal */}
            <Modal
                isOpen={isWarningModalOpen}
                onClose={() => setIsWarningModalOpen(false)}
                title="Add Warning Threshold"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsWarningModalOpen(false)}>{t.common.cancel}</Button>
                        <Button onClick={handleAddWarningRule}>{t.common.save}</Button>
                    </>
                }
            >
                <div className="flex flex-col gap-6" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem' }}>
                    <Input
                        label="Name"
                        placeholder="e.g. Warning Letter 1"
                        value={newWarning.name}
                        onChange={(e) => setNewWarning({ ...newWarning, name: e.target.value })}
                    />
                    <Input
                        label="Point Threshold (Less than or equal to)"
                        type="number"
                        placeholder="e.g. 75"
                        value={newWarning.threshold}
                        onChange={(e) => setNewWarning({ ...newWarning, threshold: e.target.value })}
                    />
                    <Input
                        label="Action Required"
                        placeholder="e.g. Issue Warning Letter"
                        value={newWarning.action}
                        onChange={(e) => setNewWarning({ ...newWarning, action: e.target.value })}
                    />
                    <Input
                        label="Alert Message"
                        placeholder="e.g. Student requires counseling"
                        value={newWarning.message}
                        onChange={(e) => setNewWarning({ ...newWarning, message: e.target.value })}
                    />

                    <div>
                        <label className="text-sm font-medium mb-2 block">Alert Color Style</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {[
                                { bg: '#fee2e2', text: '#ef4444', label: 'Red' },
                                { bg: '#fef3c7', text: '#d97706', label: 'Yellow' },
                                { bg: '#dbeafe', text: '#3b82f6', label: 'Blue' },
                                { bg: '#f3f4f6', text: '#4b5563', label: 'Gray' }
                            ].map((color) => (
                                <button
                                    key={color.label}
                                    type="button"
                                    onClick={() => setNewWarning({ ...newWarning, backgroundColor: color.bg, textColor: color.text })}
                                    style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        backgroundColor: color.bg,
                                        border: newWarning.backgroundColor === color.bg ? `2px solid ${color.text}` : '1px solid #e5e7eb',
                                        cursor: 'pointer'
                                    }}
                                    title={color.label}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
