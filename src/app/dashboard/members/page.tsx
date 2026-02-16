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
import { FaPlus, FaSearch, FaTrash, FaEdit, FaClipboardList, FaFileExcel, FaDownload, FaSort, FaSortUp, FaSortDown, FaExclamationTriangle, FaArchive, FaEllipsisV, FaFileWord } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import clsx from 'clsx';

export default function MembersPage() {
    const { members, addMember, addMembers, updateMemberPoints, updateMembers, deleteMember, deleteMembers, addAuditLogs, auditLogs, users, currentUser, generateId, warningRules, createArchive } = useStore();
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

    // Archive state
    const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
    const [archiveTitle, setArchiveTitle] = useState('');
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

    const filteredMembers = members.filter(m => {
        const search = searchTerm.toLowerCase().trim();
        const matchesSearch =
            m.name.toLowerCase().includes(search) ||
            m.id.toLowerCase().includes(search) ||
            m.division.toLowerCase().includes(search);
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

    const handleExportData = () => {
        try {
            const exportData = filteredMembers
                .sort((a, b) => b.totalPoints - a.totalPoints)
                .map((m, index) => ({
                    [t.recap.rank]: `#${index + 1}`,
                    [t.auth.name]: m.name,
                    [t.members.division]: m.division,
                    [t.dashboard.totalPoints]: m.totalPoints,
                    [t.members.status]: m.totalPoints > 50 ? t.members.excellent : m.totalPoints >= 0 ? t.members.good : t.members.needsImprovement
                }));

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Members Data");

            const dateStr = new Date().toISOString().split('T')[0];
            XLSX.writeFile(wb, `Poinkita_Members_${dateStr}.xlsx`);

            alert({
                title: "Export Success",
                message: "Member data has been exported to Excel.",
                variant: 'success'
            });
        } catch (error) {
            console.error("Export Error:", error);
            alert({
                title: "Export Error",
                message: "Failed to export data. Please try again.",
                variant: 'danger'
            });
        }
    };

    const handleConfirmArchive = () => {
        if (!archiveTitle.trim()) return;
        createArchive(archiveTitle);
        setArchiveTitle('');
        setIsArchiveModalOpen(false);
        alert({
            title: t.archive.archiveSuccess,
            message: "Snapshot saved successfully.",
            variant: 'success'
        });
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

    const handleExportMemberHistory = (member: Member) => {
        try {
            const logs = auditLogs.filter(log => log.memberId === member.id);
            const exportData = logs.map(log => ({
                [t.members.date]: new Date(log.timestamp).toLocaleString(),
                [t.members.details]: log.details,
                [t.members.points]: log.points,
                [t.members.action]: log.action === 'CREATE' ? t.members.added : t.members.reverted,
                [t.members.changedBy]: users.find(u => u.id === log.contributorId)?.name || log.contributorId
            }));

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "History");

            XLSX.writeFile(wb, `History_${member.name}_${new Date().toISOString().split('T')[0]}.xlsx`);

            alert({
                title: "Export Berhasil",
                message: `Rekapan poin untuk ${member.name} telah diunduh.`,
                variant: 'success'
            });
        } catch (error) {
            console.error("Export member history error:", error);
            alert({
                title: "Export Gagal",
                message: "Gagal mengunduh rekapan poin.",
                variant: 'danger'
            });
        }
    };

    const handleExportMemberHistoryWord = async (member: Member) => {
        const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, BorderStyle } = await import('docx');
        const { saveAs } = await import('file-saver');

        try {
            const logs = auditLogs.filter(log => log.memberId === member.id);
            const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

            const doc = new Document({
                sections: [{
                    properties: {},
                    children: [
                        // Header Title
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: t.report.title.toUpperCase(),
                                    bold: true,
                                    size: 28,
                                }),
                            ],
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 400 },
                        }),

                        // Intro Paragraph
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: t.report.intro.replace('{0}', dateStr),
                                    size: 22,
                                }),
                            ],
                            spacing: { after: 300 },
                            alignment: AlignmentType.JUSTIFIED,
                        }),

                        // Member Info Section
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: t.report.memberInfo,
                                    bold: true,
                                    size: 24,
                                    underline: {},
                                }),
                            ],
                            spacing: { before: 200, after: 200 },
                        }),

                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            borders: {
                                top: { style: BorderStyle.NONE },
                                bottom: { style: BorderStyle.NONE },
                                left: { style: BorderStyle.NONE },
                                right: { style: BorderStyle.NONE },
                                insideHorizontal: { style: BorderStyle.NONE },
                                insideVertical: { style: BorderStyle.NONE },
                            },
                            rows: [
                                new TableRow({
                                    children: [
                                        new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: `${t.members.memberId} :`, bold: true })] })] }),
                                        new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: member.id })] }),
                                    ],
                                }),
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${t.auth.name} :`, bold: true })] })] }),
                                        new TableCell({ children: [new Paragraph({ text: member.name })] }),
                                    ],
                                }),
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${t.members.division} :`, bold: true })] })] }),
                                        new TableCell({ children: [new Paragraph({ text: member.division })] }),
                                    ],
                                }),
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${t.members.points} :`, bold: true })] })] }),
                                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${member.totalPoints} Poin`, bold: true, color: member.totalPoints >= 0 ? "10b981" : "ef4444" })] })] }),
                                    ],
                                }),
                            ],
                        }),

                        // History Table Section
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: t.report.historyTable,
                                    bold: true,
                                    size: 24,
                                    underline: {},
                                }),
                            ],
                            spacing: { before: 400, after: 200 },
                        }),

                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            rows: [
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t.members.date, bold: true })], alignment: AlignmentType.CENTER })], shading: { fill: "f3f4f6" } }),
                                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t.members.details, bold: true })], alignment: AlignmentType.CENTER })], shading: { fill: "f3f4f6" } }),
                                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t.members.action, bold: true })], alignment: AlignmentType.CENTER })], shading: { fill: "f3f4f6" } }),
                                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t.members.points, bold: true })], alignment: AlignmentType.CENTER })], shading: { fill: "f3f4f6" } }),
                                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t.transactions.contributor, bold: true })], alignment: AlignmentType.CENTER })], shading: { fill: "f3f4f6" } }),
                                    ],
                                }),
                                ...logs.map(log => new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph({ text: new Date(log.timestamp).toLocaleString('id-ID'), alignment: AlignmentType.CENTER })] }),
                                        new TableCell({ children: [new Paragraph({ text: log.details })] }),
                                        new TableCell({ children: [new Paragraph({ text: log.action === 'CREATE' ? t.members.added : t.members.reverted, alignment: AlignmentType.CENTER })] }),
                                        new TableCell({ children: [new Paragraph({ text: (log.points > 0 ? "+" : "") + log.points.toString(), alignment: AlignmentType.CENTER })] }),
                                        new TableCell({ children: [new Paragraph({ text: users.find(u => u.id === log.contributorId)?.name || log.contributorId, alignment: AlignmentType.CENTER })] }),
                                    ],
                                })),
                            ],
                        }),

                        // Signature Section
                        new Paragraph({ text: "", spacing: { before: 800 } }),
                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            borders: {
                                top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
                                left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
                                insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
                            },
                            rows: [
                                new TableRow({
                                    children: [
                                        new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, children: [] }),
                                        new TableCell({
                                            width: { size: 40, type: WidthType.PERCENTAGE },
                                            children: [
                                                new Paragraph({ text: t.report.signatureTitle, alignment: AlignmentType.CENTER }),
                                                new Paragraph({ text: "", spacing: { after: 1000 } }),
                                                new Paragraph({ children: [new TextRun({ text: "( ____________________ )", bold: true })], alignment: AlignmentType.CENTER }),
                                                new Paragraph({ text: t.report.signatureRole, alignment: AlignmentType.CENTER }),
                                            ],
                                        }),
                                    ],
                                }),
                            ],
                        }),

                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `${t.report.generatedAt} ${new Date().toLocaleString('id-ID')}`,
                                    italics: true,
                                    size: 16,
                                }),
                            ],
                            alignment: AlignmentType.RIGHT,
                            spacing: { before: 400 },
                        }),
                    ],
                }],
            });

            const blob = await Packer.toBlob(doc);
            saveAs(blob, `Report_${member.name}_${new Date().toISOString().split('T')[0]}.docx`);

            alert({
                title: "Export Berhasil",
                message: `Laporan Word untuk ${member.name} telah diunduh.`,
                variant: 'success'
            });
        } catch (error) {
            console.error("Export Word error:", error);
            alert({
                title: "Export Gagal",
                message: "Gagal mengunduh laporan Word.",
                variant: 'danger'
            });
        }
    };

    const memberLogs = historyMember
        ? auditLogs.filter(log => log.memberId === historyMember.id)
        : [];

    return (
        <div className="flex flex-col gap-6" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', overflow: 'hidden' }}>
            <Card style={{ overflow: 'visible' }}>
                <CardContent style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {/* Top Section: Title & Actions */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '1rem'
                        }}>
                            <div>
                                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--color-primary)' }}>
                                    {t.members.title}
                                </h1>
                                <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                    {members.length} {t.dashboard.totalMembers.toLowerCase()}
                                </p>
                            </div>

                            {isAdmin && (
                                <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
                                    <Button onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <FaPlus /> {t.members.addMember}
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
                                                        onClick={() => { downloadExcelTemplate(); setIsMoreMenuOpen(false); }}
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
                                                    <button
                                                        onClick={() => { handleExportData(); setIsMoreMenuOpen(false); }}
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
                                                        <FaDownload /> {t.common.export}
                                                    </button>
                                                    <div style={{ height: '1px', background: 'var(--color-border)', margin: '0.25rem 0.5rem' }} />
                                                    <button
                                                        onClick={() => { setIsArchiveModalOpen(true); setIsMoreMenuOpen(false); }}
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
                                                        <FaArchive /> {t.common.archive}
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
                                </div>
                            )}
                        </div>

                        {/* Bottom Section: Search & Filters */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'row',
                            gap: '0.75rem',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            background: 'rgba(0,0,0,0.03)',
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--color-border)'
                        }}>
                            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                                <FaSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: '0.875rem' }} />
                                <input
                                    placeholder={t.common.search}
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    style={{
                                        width: '100%',
                                        padding: '0.625rem 1rem 0.625rem 2.5rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--color-border)',
                                        background: 'var(--color-bg-subtle)',
                                        color: 'var(--color-text)',
                                        fontSize: '0.875rem',
                                        transition: 'border-color 0.2s',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            <select
                                value={divisionFilter}
                                onChange={handleDivisionFilterChange}
                                style={{
                                    padding: '0.625rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg-subtle)',
                                    fontSize: '0.875rem',
                                    minWidth: '160px',
                                    outline: 'none',
                                    color: 'var(--color-text)'
                                }}
                            >
                                <option value="">{t.members.allDivisions}</option>
                                {Array.from(new Set(members.map(m => m.division))).sort().map(div => (
                                    <option key={div} value={div}>{div}</option>
                                ))}
                            </select>

                            {isAdmin && selectedIds.length > 0 && (
                                <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                                    <Button
                                        variant="secondary"
                                        onClick={() => setIsBulkDivisionModalOpen(true)}
                                        style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    >
                                        <FaEdit /> {selectedIds.length}
                                    </Button>
                                    <Button
                                        variant="danger"
                                        onClick={handleBulkDelete}
                                        style={{ padding: '0.625rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <FaTrash />
                                    </Button>
                                </div>
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
                            {paginatedMembers.map((member, index) => (
                                <TableRow key={`${member.id}-${index}`}>
                                    <TableCell>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(member.id)}
                                            onChange={() => toggleSelect(member.id)}
                                            style={{ cursor: 'pointer' }}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{member.id}</TableCell>
                                    <TableCell>
                                        <span
                                            onClick={() => handleViewHistory(member)}
                                            style={{
                                                cursor: 'pointer',
                                                color: 'var(--color-primary)',
                                                fontWeight: 600,
                                                textDecoration: 'underline',
                                                textUnderlineOffset: '2px'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary-dark)'}
                                            onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                                        >
                                            {member.name}
                                        </span>
                                    </TableCell>
                                    <TableCell>{member.division}</TableCell>
                                    <TableCell style={{ fontWeight: 600, color: member.totalPoints >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                        {member.totalPoints}
                                        {warningRules.some(w => member.totalPoints <= w.threshold) && (
                                            <span
                                                title={warningRules.filter(w => member.totalPoints <= w.threshold).map(w => w.message).join('\n')}
                                                style={{ marginLeft: '0.5rem', color: '#ef4444', verticalAlign: 'middle', display: 'inline-block', cursor: 'help' }}
                                            >
                                                <FaExclamationTriangle />
                                            </span>
                                        )}
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
                    <div className="flex items-center justify-between mt-6 pt-4 border-t" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', flexWrap: 'wrap', gap: '1rem' }}>
                        <div className="flex items-center gap-4" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
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
                footer={
                    historyMember && (
                        <div style={{ display: 'flex', gap: '0.75rem', width: '100%', justifyContent: 'flex-end' }}>
                            <Button variant="secondary" onClick={() => setIsHistoryOpen(false)}>
                                {t.common.cancel}
                            </Button>
                            <Button onClick={() => handleExportMemberHistoryWord(historyMember)}>
                                <FaFileWord style={{ marginRight: '0.5rem' }} /> {t.members.exportWord}
                            </Button>
                        </div>
                    )
                }
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
            {/* Archive Modal */}
            <Modal
                isOpen={isArchiveModalOpen}
                onClose={() => setIsArchiveModalOpen(false)}
                title={t.archive.createTitle}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsArchiveModalOpen(false)}>
                            {t.common.cancel}
                        </Button>
                        <Button
                            onClick={handleConfirmArchive}
                            disabled={!archiveTitle.trim()}
                        >
                            {t.common.save}
                        </Button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem' }}>
                    <p style={{ fontSize: '0.925rem', color: 'var(--color-text-muted)', lineHeight: '1.5', margin: 0 }}>
                        {t.archive.archiveSnapshot}
                    </p>
                    <Input
                        label={t.archive.archiveName}
                        placeholder="e.g. Kondisi Poin Februari 2026"
                        value={archiveTitle}
                        onChange={(e) => setArchiveTitle(e.target.value)}
                        autoFocus
                    />
                </div>
            </Modal>
        </div>
    );
}
