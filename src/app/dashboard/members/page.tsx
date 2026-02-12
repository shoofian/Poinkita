'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { useStore } from '@/lib/context/StoreContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useDialog } from '@/components/ui/ConfirmDialog';
import { Member, Rule, AuditLog } from '@/lib/store';
import { FaPlus, FaSearch, FaTrash, FaEdit, FaClipboardList, FaFileExcel, FaDownload, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import clsx from 'clsx';

export default function MembersPage() {
    const { members, addMember, addMembers, updateMemberPoints, updateMembers, deleteMember, deleteMembers, addAuditLogs, auditLogs, users, currentUser, generateId } = useStore();
    const { t } = useLanguage();
    const { confirm, alert } = useDialog();
    const [searchTerm, setSearchTerm] = useState('');
    const [divisionFilter, setDivisionFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newMember, setNewMember] = useState({ name: '', division: '', initialPoints: '' });
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Sorting state
    const [sortConfig, setSortConfig] = useState<{ key: keyof Member; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });

    // Selection state
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [adminPassword, setAdminPassword] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // History modal state
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [historyMember, setHistoryMember] = useState<Member | null>(null);

    // Bulk division modal state
    const [isBulkDivisionModalOpen, setIsBulkDivisionModalOpen] = useState(false);
    const [newBulkDivision, setNewBulkDivision] = useState('');

    // Edit member state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [editData, setEditData] = useState({ name: '', division: '' });

    const filteredMembers = members.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDivision = divisionFilter === '' || m.division === divisionFilter;
        return matchesSearch && matchesDivision;
    }).sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;
        if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
        if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    const isAdmin = currentUser?.role === 'ADMIN';

    // Pagination logic
    const totalPages = Math.ceil(filteredMembers.length / pageSize);
    const paginatedMembers = filteredMembers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset to first page on search
    };

    const handleDivisionFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setDivisionFilter(e.target.value);
        setCurrentPage(1);
    };

    const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPageSize(Number(e.target.value));
        setCurrentPage(1);
    };

    const requestSort = (key: keyof Member) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleAddMember = () => {
        if (!newMember.name || !newMember.division) return;

        const memberId = generateId('MEM');
        const points = Number(newMember.initialPoints) || 0;

        addMember({
            id: memberId,
            name: newMember.name,
            division: newMember.division,
            totalPoints: points,
            adminId: '' // Will be set by context
        } as Member);

        // Add Audit Log if points > 0
        if (points !== 0) {
            const nextLogId = generateId('ACT', points > 0 ? 'ACH' : 'VIO');
            addAuditLogs([{
                id: nextLogId,
                timestamp: new Date().toISOString(),
                action: 'CREATE',
                memberId: memberId,
                contributorId: currentUser?.id || 'system',
                details: t.members.initialPoints,
                points: points,
                adminId: '' // Will be set by context
            } as AuditLog]);
        }

        setIsModalOpen(false);
        setNewMember({ name: '', division: '', initialPoints: '' });
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

                const importedMembers: Member[] = [];
                const importedLogs: AuditLog[] = [];
                let currentMaxSeq = 0;
                let currentMaxActSeq = 0;

                // Optimization: get current max seq for today to avoid collisions during loop
                const date = new Date();
                const yyyymmdd = date.getFullYear().toString() +
                    (date.getMonth() + 1).toString().padStart(2, '0') +
                    date.getDate().toString().padStart(2, '0');

                const prefixMem = `MEM-${yyyymmdd}-`;
                const prefixActAch = `ACT-ACH-${yyyymmdd}-`;
                const prefixActVio = `ACT-VIO-${yyyymmdd}-`;

                // Get max seqs
                const existingMemSeqs = members.filter(m => m.id.startsWith(prefixMem)).map(m => parseInt(m.id.split('-').pop() || '0', 10));
                if (existingMemSeqs.length > 0) currentMaxSeq = Math.max(...existingMemSeqs);

                const existingActSeqs = auditLogs.filter(l => l.id.startsWith(prefixActAch) || l.id.startsWith(prefixActVio)).map(l => parseInt(l.id.split('-').pop() || '0', 10));
                if (existingActSeqs.length > 0) currentMaxActSeq = Math.max(...existingActSeqs);

                data.forEach((row) => {
                    // Normalize headers: find "name"/"nama", "division"/"divisi"/"kelas", "id"
                    const name = row.Name || row.Nama || row.name || row.nama;
                    const division = row.Division || row.Divisi || row.Kelas || row.division || row.divisi || row.kelas;
                    const points = Number(row.Points || row.Poin || row.points || row.poin || row["Poin Awal"] || row["Initial Points"] || 0);
                    let id = row.ID || row.id || row.Id;

                    if (!name) return; // Skip invalid rows

                    if (!id) {
                        currentMaxSeq++;
                        id = `${prefixMem}${currentMaxSeq.toString().padStart(3, '0')}`;
                    }

                    // Avoid duplicate IDs within the same import or existing members
                    if (members.some(m => m.id === id) || importedMembers.some(m => m.id === id)) {
                        currentMaxSeq++;
                        id = `${prefixMem}${currentMaxSeq.toString().padStart(3, '0')}`;
                    }

                    importedMembers.push({
                        id,
                        name,
                        division: division || 'General',
                        totalPoints: points,
                        adminId: '' // Will be set by context
                    } as Member);

                    if (points !== 0) {
                        currentMaxActSeq++;
                        const typeCode = points > 0 ? 'ACH' : 'VIO';
                        importedLogs.push({
                            id: `ACT-${typeCode}-${yyyymmdd}-${currentMaxActSeq.toString().padStart(3, '0')}`,
                            timestamp: new Date().toISOString(),
                            action: 'CREATE',
                            memberId: id,
                            contributorId: currentUser?.id || 'system',
                            details: t.members.initialPoints,
                            points: points,
                            adminId: '' // Will be set by context
                        } as AuditLog);
                    }
                });

                if (importedMembers.length > 0) {
                    addMembers(importedMembers);
                    if (importedLogs.length > 0) addAuditLogs(importedLogs);
                    alert({
                        title: "Import Success",
                        message: `Successfully imported ${importedMembers.length} members.`,
                        variant: 'danger'
                    });
                } else {
                    alert({
                        title: "Import Failed",
                        message: "No valid member data found in the Excel file.",
                        variant: 'danger'
                    });
                }
            } catch (error) {
                console.error("Excel Import Error:", error);
                alert({
                    title: "Import Error",
                    message: "Failed to process Excel file. Please ensure it is a valid format.",
                    variant: 'danger'
                });
            }
            // Reset input
            if (e.target) e.target.value = '';
        };
        reader.readAsBinaryString(file);
    };

    const getSortIcon = (key: keyof Member) => {
        if (!sortConfig || sortConfig.key !== key) return <FaSort style={{ opacity: 0.3 }} />;
        return sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />;
    };

    const downloadExcelTemplate = () => {
        const templateData = [
            { ID: "", Nama: "Contoh Siswa 1", Divisi: "Kelas 10A", "Poin Awal": 100 },
            { ID: "M-EXAMPLE-01", Nama: "Contoh Siswa 2", Divisi: "Kelas 11B", "Poin Awal": 0 },
        ];

        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Members Template");

        // Generate and download
        XLSX.writeFile(wb, "Poinkita_Member_Template.xlsx");
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        setIsPasswordModalOpen(true);
    };

    const confirmBulkDelete = async () => {
        if (!currentUser || adminPassword !== currentUser.password) {
            alert({
                title: t.members.incorrectPassword,
                message: "Password verification failed.",
                variant: 'danger'
            });
            return;
        }

        const ok = await confirm({
            title: "Confirm Mass Deletion",
            message: t.members.massDeleteConfirm.replace('{0}', selectedIds.length.toString()),
            variant: 'danger'
        });

        if (ok) {
            deleteMembers(selectedIds);
            setSelectedIds([]);
            setIsPasswordModalOpen(false);
            setAdminPassword('');
            alert({
                title: "Success",
                message: `${selectedIds.length} members deleted.`,
                variant: 'danger'
            });
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredMembers.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredMembers.map(m => m.id));
        }
    };

    const toggleSelect = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleBulkChangeDivision = () => {
        if (!newBulkDivision.trim() || selectedIds.length === 0) return;

        updateMembers(selectedIds, { division: newBulkDivision.trim() });
        setIsBulkDivisionModalOpen(false);
        setNewBulkDivision('');
        setSelectedIds([]);
        alert({
            title: "Success",
            message: t.members.divisionChanged.replace('{0}', selectedIds.length.toString()),
            variant: 'info'
        });
    };

    const handleOpenEdit = (member: Member) => {
        setEditingMember(member);
        setEditData({ name: member.name, division: member.division });
        setIsEditModalOpen(true);
    };

    const handleEditMember = () => {
        if (!editingMember || !editData.name || !editData.division) return;

        updateMembers([editingMember.id], {
            name: editData.name,
            division: editData.division
        });

        setIsEditModalOpen(false);
        setEditingMember(null);
        alert({
            title: "Success",
            message: t.members.editSuccess,
            variant: 'success'
        });
    };

    const handleDelete = async (id: string) => {
        const ok = await confirm({
            title: t.members.deleteConfirm,
            message: "This action will permanently delete the member.",
            variant: 'danger',
            confirmLabel: t.common.delete,
            cancelLabel: t.common.cancel
        });

        if (ok) {
            deleteMember(id);
        }
    };

    const handleViewHistory = (member: Member) => {
        setHistoryMember(member);
        setIsHistoryOpen(true);
    };

    const memberLogs = historyMember
        ? auditLogs.filter(log => log.memberId === historyMember.id)
        : [];

    return (
        <div className="flex flex-col gap-6" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <Card>
                <CardContent style={{ padding: '1.5rem' }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '1rem',
                        flexWrap: 'wrap'
                    }}>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{t.members.title}</h1>
                        {isAdmin && (
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: '1 1 auto', justifyContent: 'flex-end' }}>
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    style={{ display: 'none' }}
                                    ref={fileInputRef}
                                    onChange={handleExcelImport}
                                />
                                <Button
                                    variant="secondary"
                                    onClick={downloadExcelTemplate}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}
                                >
                                    <FaDownload /> {t.common.downloadTemplate}
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2"
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}
                                >
                                    <FaFileExcel /> {t.common.importExcel || 'Import Excel'}
                                </Button>
                                <Button onClick={() => setIsModalOpen(true)}>
                                    <FaPlus /> {t.members.addMember}
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent style={{ padding: '1.5rem' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1rem',
                        alignItems: 'flex-end'
                    }}>
                        <Input
                            label={t.common.search}
                            placeholder={t.common.search}
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                        <div className="flex flex-col gap-2" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>{t.members.filterByDivision}</label>
                            <select
                                value={divisionFilter}
                                onChange={handleDivisionFilterChange}
                                style={{
                                    padding: '0.5rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg-card)',
                                    fontSize: '0.875rem',
                                    height: '38px',
                                    color: 'var(--color-text)'
                                }}
                            >
                                <option value="">{t.members.allDivisions}</option>
                                {Array.from(new Set(members.map(m => m.division))).sort().map(div => (
                                    <option key={div} value={div}>{div}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            {isAdmin && selectedIds.length > 0 && (
                                <>
                                    <Button
                                        variant="secondary"
                                        onClick={() => setIsBulkDivisionModalOpen(true)}
                                        style={{ flex: '1 1 auto' }}
                                    >
                                        <FaEdit /> {t.members.changeDivision} ({selectedIds.length})
                                    </Button>
                                    <Button
                                        variant="danger"
                                        onClick={handleBulkDelete}
                                        style={{ flex: '1 1 auto' }}
                                    >
                                        <FaTrash /> {t.members.deleteSelected} ({selectedIds.length})
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead style={{ width: '40px' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length === paginatedMembers.length && paginatedMembers.length > 0}
                                        onChange={toggleSelectAll}
                                        style={{ cursor: 'pointer' }}
                                    />
                                </TableHead>
                                <TableHead onClick={() => requestSort('id')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {t.members.memberId} {getSortIcon('id')}
                                    </div>
                                </TableHead>
                                <TableHead onClick={() => requestSort('name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {t.auth.name} {getSortIcon('name')}
                                    </div>
                                </TableHead>
                                <TableHead onClick={() => requestSort('division')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {t.members.division} {getSortIcon('division')}
                                    </div>
                                </TableHead>
                                <TableHead onClick={() => requestSort('totalPoints')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {t.members.points} {getSortIcon('totalPoints')}
                                    </div>
                                </TableHead>
                                {isAdmin && <TableHead>{t.common.actions}</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedMembers.map((member) => (
                                <TableRow key={member.id}>
                                    <TableCell>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(member.id)}
                                            onChange={() => toggleSelect(member.id)}
                                            style={{ cursor: 'pointer' }}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{member.id}</TableCell>
                                    <TableCell>{member.name}</TableCell>
                                    <TableCell>{member.division}</TableCell>
                                    <TableCell style={{ fontWeight: 600, color: member.totalPoints >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                        {member.totalPoints}
                                    </TableCell>
                                    {isAdmin && (
                                        <TableCell>
                                            <div className="flex gap-2" style={{ display: 'flex', gap: '0.5rem' }}>
                                                <Button variant="ghost" onClick={() => handleViewHistory(member)} title={t.members.history}>
                                                    <FaClipboardList />
                                                </Button>
                                                <Button variant="ghost" onClick={() => handleOpenEdit(member)}>
                                                    <FaEdit />
                                                </Button>
                                                <Button variant="ghost" className="p-2 text-danger" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(member.id)}>
                                                    <FaTrash />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                        <div className="flex items-center gap-4" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                {t.common.rowsPerPage}
                            </span>
                            <select
                                value={pageSize}
                                onChange={handlePageSizeChange}
                                style={{
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-white)',
                                    fontSize: '0.875rem'
                                }}
                            >
                                {[10, 20, 50, 100].map(size => (
                                    <option key={size} value={size}>{size}</option>
                                ))}
                            </select>
                            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                {filteredMembers.length} total
                            </span>
                        </div>

                        <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Button
                                variant="secondary"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                {t.common.previous}
                            </Button>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, padding: '0 0.5rem' }}>
                                {currentPage} / {totalPages || 1}
                            </div>
                            <Button
                                variant="secondary"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages || totalPages === 0}
                            >
                                {t.common.next}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Add Member Modal */}
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
                <div className="flex flex-col gap-6" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem' }}>
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
                    <Input
                        label={t.members.initialPoints}
                        placeholder="0"
                        value={newMember.initialPoints}
                        onChange={(e) => setNewMember({ ...newMember, initialPoints: e.target.value })}
                    />
                </div>
            </Modal>

            {/* Admin Password Verification Modal */}
            <Modal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                title={t.members.enterPassword}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsPasswordModalOpen(false)}>{t.common.cancel}</Button>
                        <Button variant="danger" onClick={confirmBulkDelete}>{t.common.delete}</Button>
                    </>
                }
            >
                <div style={{ padding: '1.5rem' }}>
                    <Input
                        label={t.auth.password}
                        type="password"
                        placeholder="••••••••"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        autoFocus
                    />
                </div>
            </Modal>

            {/* Edit Member Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title={t.members.editMember}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>{t.common.cancel}</Button>
                        <Button onClick={handleEditMember}>{t.common.save}</Button>
                    </>
                }
            >
                <div className="flex flex-col gap-6" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem' }}>
                    <Input
                        label={t.auth.name}
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    />
                    <Input
                        label={t.members.division}
                        value={editData.division}
                        onChange={(e) => setEditData({ ...editData, division: e.target.value })}
                    />
                </div>
            </Modal>
            <Modal
                isOpen={isBulkDivisionModalOpen}
                onClose={() => setIsBulkDivisionModalOpen(false)}
                title={t.members.changeDivision}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsBulkDivisionModalOpen(false)}>{t.common.cancel}</Button>
                        <Button onClick={handleBulkChangeDivision}>{t.common.save}</Button>
                    </>
                }
            >
                <div style={{ padding: '1.5rem' }}>
                    <Input
                        label={t.members.selectNewDivision}
                        placeholder="e.g. Class 11A"
                        value={newBulkDivision}
                        onChange={(e) => setNewBulkDivision(e.target.value)}
                        autoFocus
                    />
                </div>
            </Modal>
            <Modal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                title={historyMember ? `${t.members.historyTitle} — ${historyMember.name}` : t.members.historyTitle}
            >
                <div style={{ padding: '1.5rem' }}>
                    {memberLogs.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '2rem 1rem',
                            color: 'var(--color-text-muted)',
                            fontSize: '0.9rem'
                        }}>
                            {t.members.noHistory}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {memberLogs.map((log) => {
                                const isCreate = log.action === 'CREATE';
                                const isPositivePoints = log.points > 0;

                                return (
                                    <div
                                        key={log.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '0.75rem',
                                            padding: '0.875rem 1rem',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--color-border)',
                                            background: isCreate ? 'var(--color-white)' : '#fef2f2',
                                            transition: 'box-shadow 150ms ease',
                                        }}
                                    >
                                        {/* Timeline dot */}
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            marginTop: '6px',
                                            flexShrink: 0,
                                            background: isCreate
                                                ? (isPositivePoints ? 'var(--color-success)' : 'var(--color-danger)')
                                                : 'var(--color-gray-400)',
                                        }} />

                                        {/* Content */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '0.25rem',
                                            }}>
                                                <span style={{
                                                    fontSize: '0.8rem',
                                                    fontWeight: 600,
                                                    padding: '0.125rem 0.5rem',
                                                    borderRadius: 'var(--radius-sm)',
                                                    background: isCreate
                                                        ? (isPositivePoints ? '#d1fae5' : '#fee2e2')
                                                        : '#f3f4f6',
                                                    color: isCreate
                                                        ? (isPositivePoints ? '#065f46' : '#991b1b')
                                                        : '#6b7280',
                                                }}>
                                                    {isCreate ? t.members.added : t.members.reverted}
                                                </span>
                                                <span style={{
                                                    fontSize: '1rem',
                                                    fontWeight: 700,
                                                    color: log.points > 0 ? 'var(--color-success)' : 'var(--color-danger)',
                                                }}>
                                                    {log.points > 0 ? '+' : ''}{log.points}
                                                </span>
                                            </div>
                                            <div style={{
                                                fontSize: '0.875rem',
                                                color: 'var(--color-text)',
                                                marginBottom: '0.25rem',
                                            }}>
                                                {log.details}
                                            </div>
                                            <div style={{
                                                fontSize: '0.75rem',
                                                color: 'var(--color-text-muted)',
                                                display: 'flex',
                                                gap: '0.5rem',
                                                flexWrap: 'wrap' as const,
                                            }}>
                                                <span>{new Date(log.timestamp).toLocaleString()}</span>
                                                <span>• {t.members.changedBy} {users.find(u => u.id === log.contributorId)?.name || log.contributorId}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}
