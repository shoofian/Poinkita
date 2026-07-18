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
import { FaPlus, FaSearch, FaTrash, FaEdit, FaClipboardList, FaFileExcel, FaDownload, FaSort, FaSortUp, FaSortDown, FaExclamationTriangle, FaArchive, FaEllipsisV, FaFileWord, FaQrcode } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import clsx from 'clsx';

export default function MembersPage() {
    const { members, addMember, addMembers, updateMemberPoints, updateMembers, deleteMember, deleteMembers, addAuditLogs, auditLogs, users, currentUser, generateId, warningRules, createArchive, archives } = useStore();
    const { t } = useLanguage();
    const { confirm, alert } = useDialog();
    const [searchTerm, setSearchTerm] = useState('');
    const [divisionFilter, setDivisionFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newMember, setNewMember] = useState({ id: '', name: '', division: '', birthDate: '', initialPoints: '' });
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Excel Import Preview state
    const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
    const [pendingImportMembers, setPendingImportMembers] = useState<Member[]>([]);
    const [pendingImportLogs, setPendingImportLogs] = useState<AuditLog[]>([]);
    const [importItemStatuses, setImportItemStatuses] = useState<Record<string, 'new' | 'auto' | 'exists'>>({});

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
    const [editData, setEditData] = useState({ name: '', division: '', birthDate: '' });

    // Archive state
    const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
    const [archiveTitle, setArchiveTitle] = useState('');
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

    // QR Code modal state
    const [qrMember, setQrMember] = useState<Member | null>(null);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);

    const handleOpenQR = (member: Member) => {
        setQrMember(member);
        setIsQrModalOpen(true);
    };

    const handlePrintQR = () => {
        if (!qrMember) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        printWindow.document.write(`
            <html>
            <head>
                <title>Cetak Kartu Anggota - ${qrMember.name}</title>
                <style>
                    body {
                        font-family: sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        background: #f3f4f6;
                    }
                    .card {
                        width: 350px;
                        padding: 24px;
                        background: white;
                        border-radius: 12px;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                        text-align: center;
                        border: 1px solid #e5e7eb;
                    }
                    .title {
                        font-size: 20px;
                        font-weight: bold;
                        color: #4f46e5;
                        margin-bottom: 4px;
                    }
                    .subtitle {
                        font-size: 12px;
                        color: #6b7280;
                        margin-bottom: 20px;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }
                    .qr {
                        margin: 16px 0;
                    }
                    .qr img {
                        width: 180px;
                        height: 180px;
                    }
                    .name {
                        font-size: 18px;
                        font-weight: 600;
                        color: #1f2937;
                        margin-bottom: 4px;
                    }
                    .meta {
                        font-size: 13px;
                        color: #4b5563;
                        margin-bottom: 12px;
                    }
                    .no-print {
                        margin-top: 16px;
                        padding: 8px 16px;
                        background: #4f46e5;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 600;
                    }
                    @media print {
                        body { background: white; }
                        .card { box-shadow: none; border: 1px solid #ccc; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="title">Poinkita</div>
                    <div class="subtitle">Kartu Anggota Resmi</div>
                    <div class="qr">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrMember.id)}" alt="QR Code" />
                    </div>
                    <div class="name">${qrMember.name}</div>
                    <div class="meta">${qrMember.id} • ${qrMember.division}</div>
                    <button class="no-print" onclick="window.print()">
                        Cetak Kartu
                    </button>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleBulkPrintQR = () => {
        if (selectedIds.length === 0) return;
        const selectedMembers = members.filter(m => selectedIds.includes(m.id));
        
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        
        const cardsHTML = selectedMembers.map(m => `
            <div class="card">
                <div class="title">Poinkita</div>
                <div class="subtitle">Kartu Anggota Resmi</div>
                <div class="qr">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(m.id)}" alt="QR Code" />
                </div>
                <div class="name">${m.name}</div>
                <div class="meta">${m.id} • ${m.division}</div>
            </div>
        `).join('');

        printWindow.document.write(`
            <html>
            <head>
                <title>Cetak Kartu Anggota Massal</title>
                <style>
                    body {
                        font-family: sans-serif;
                        margin: 0;
                        padding: 20px;
                        background: #f3f4f6;
                        display: flex;
                        flex-wrap: wrap;
                        gap: 20px;
                        justify-content: center;
                    }
                    .card {
                        width: 300px;
                        padding: 20px;
                        background: white;
                        border-radius: 12px;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                        text-align: center;
                        border: 1px solid #e5e7eb;
                        page-break-inside: avoid;
                    }
                    .title {
                        font-size: 18px;
                        font-weight: bold;
                        color: #4f46e5;
                        margin-bottom: 2px;
                    }
                    .subtitle {
                        font-size: 10px;
                        color: #6b7280;
                        margin-bottom: 12px;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }
                    .qr {
                        margin: 12px 0;
                    }
                    .qr img {
                        width: 140px;
                        height: 140px;
                    }
                    .name {
                        font-size: 15px;
                        font-weight: 600;
                        color: #1f2937;
                        margin-bottom: 2px;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                    .meta {
                        font-size: 12px;
                        color: #4b5563;
                    }
                    .print-bar {
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        z-index: 1000;
                    }
                    .print-btn {
                        padding: 10px 20px;
                        background: #4f46e5;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.15);
                    }
                    @media print {
                        body {
                            background: white;
                            padding: 0;
                        }
                        .print-bar { display: none; }
                        .card {
                            box-shadow: none;
                            border: 1px solid #ccc;
                            margin: 10px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="print-bar">
                    <button class="print-btn" onclick="window.print()">Cetak Semua Kartu</button>
                </div>
                ${cardsHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleDownloadQR = async () => {
        if (!qrMember) return;
        try {
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrMember.id)}`;
            const response = await fetch(qrUrl);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `${qrMember.id}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Failed to download QR code", error);
            window.open(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrMember.id)}`, '_blank');
        }
    };

    const handleBulkDownloadQR = async () => {
        if (selectedIds.length === 0) return;
        const selectedMembers = members.filter(m => selectedIds.includes(m.id));
        
        try {
            const JSZip = require('jszip');
            const zip = new JSZip();
            
            alert({
                title: "Menyiapkan QR Code",
                message: `Sedang memproses ${selectedMembers.length} gambar QR Code ke dalam berkas ZIP...`,
                variant: 'info'
            });

            for (const m of selectedMembers) {
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(m.id)}`;
                const response = await fetch(qrUrl);
                const arrayBuffer = await response.arrayBuffer();
                zip.file(`${m.id}.png`, arrayBuffer);
            }

            const content = await zip.generateAsync({ type: "blob" });
            const blobUrl = window.URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `QR_Codes_Poinkita_${new Date().toISOString().slice(0,10)}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);

            alert({
                title: "Berhasil",
                message: `${selectedMembers.length} gambar QR Code berhasil diunduh dalam berkas ZIP.`,
                variant: 'success'
            });
        } catch (error) {
            console.error("Failed to generate ZIP of QR codes", error);
            alert({
                title: "Gagal Mengunduh",
                message: "Terjadi kesalahan saat membuat berkas ZIP. Silakan coba lagi.",
                variant: 'danger'
            });
        }
    };

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
        if (!newMember.name || !newMember.division || !newMember.birthDate) return;

        const customId = newMember.id.trim();
        if (customId && members.some(m => m.id.toLowerCase() === customId.toLowerCase())) {
            alert({
                title: t.common.error,
                message: "ID Anggota sudah terdaftar. Silakan gunakan ID lain.",
                variant: 'danger'
            });
            return;
        }

        const memberId = customId || generateId('MEM');
        const points = Number(newMember.initialPoints) || 0;

        addMember({
            id: memberId,
            name: newMember.name,
            division: newMember.division,
            birthDate: newMember.birthDate,
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
        setNewMember({ id: '', name: '', division: '', birthDate: '', initialPoints: '' });
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
                title: t.members.exportSuccessTitle,
                message: t.members.exportSuccessDesc,
                variant: 'success'
            });
        } catch (error) {
            console.error("Export Error:", error);
            alert({
                title: t.members.exportErrorTitle,
                message: t.members.exportErrorDesc,
                variant: 'danger'
            });
        }
    };

    const handleConfirmArchive = () => {
        if (!archiveTitle.trim()) return;

        const isDuplicate = archives.some(a => a.title.toLowerCase() === archiveTitle.trim().toLowerCase());
        if (isDuplicate) {
            alert({
                title: t.common.error || "Error",
                message: t.archive.duplicateTitle,
                variant: 'danger'
            });
            return;
        }

        createArchive(archiveTitle.trim());
        setArchiveTitle('');
        setIsArchiveModalOpen(false);
        alert({
            title: t.archive.archiveSuccess,
            message: t.common.success,
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
                const itemStatuses: Record<string, 'new' | 'auto' | 'exists'> = {};
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
                    let rawId = (row.ID || row.id || row.Id || '').toString().trim();
                    const isPlaceholder = rawId.toLowerCase().includes('kosongkan') || rawId.toLowerCase().includes('leave blank');
                    let id = isPlaceholder ? '' : rawId;

                    if (!name) return; // Skip invalid rows

                    let status: 'new' | 'auto' | 'exists' = 'new';
                    if (!id) {
                        status = 'auto';
                        currentMaxSeq++;
                        id = `${prefixMem}${currentMaxSeq.toString().padStart(3, '0')}`;
                    } else if (members.some(m => m.id === id) || importedMembers.some(m => m.id === id)) {
                        status = 'exists';
                        currentMaxSeq++;
                        id = `${prefixMem}${currentMaxSeq.toString().padStart(3, '0')}`;
                    }

                    // Format Date Helper (supports YYYY-MM-DD and DD-MM-YYYY)
                    const processBirthDate = (raw: any) => {
                        if (!raw) return '2000-01-01';
                        const str = String(raw).trim();
                        if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
                        if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
                            const [d, m, y] = str.split('-');
                            return `${y}-${m}-${d}`;
                        }
                        try {
                            const d = new Date(raw);
                            if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
                        } catch { }
                        return '2000-01-01';
                    };

                    const rawDate = row.BirthDate || row.TanggalLahir || row['TanggalLahir (YYYY-MM-DD)'] || row['Tanggal Lahir (YYYY-MM-DD)'] || row['TanggalLahir (DD-MM-YYYY)'] || row['Tanggal Lahir (DD-MM-YYYY)'];

                    importedMembers.push({
                        id,
                        name,
                        division: division || 'General',
                        birthDate: processBirthDate(rawDate),
                        totalPoints: points,
                        adminId: '' // Will be set by context
                    } as Member);

                    itemStatuses[id] = status;

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
                    setPendingImportMembers(importedMembers);
                    setPendingImportLogs(importedLogs);
                    setImportItemStatuses(itemStatuses);
                    setIsImportPreviewOpen(true);
                } else {
                    alert({
                        title: t.members.importFailedTitle,
                        message: t.members.importFailedDesc,
                        variant: 'danger'
                    });
                }
            } catch (error) {
                console.error("Excel Import Error:", error);
                alert({
                    title: t.members.importErrorTitle,
                    message: t.members.importErrorDesc,
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
            { ID: "Kosongkan untuk otomatis / Leave blank for auto", Nama: "Contoh Siswa 1", Divisi: "Kelas 10A", "TanggalLahir (YYYY-MM-DD)": "2005-08-15", "Poin Awal": 100 },
            { ID: "M-EXAMPLE-01", Nama: "Contoh Siswa 2", Divisi: "Kelas 11B", "TanggalLahir (YYYY-MM-DD)": "2006-01-20", "Poin Awal": 0 }
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
                message: t.members.passwordFailed,
                variant: 'danger'
            });
            return;
        }

        const ok = await confirm({
            title: t.members.deleteMassConfirm,
            message: t.members.massDeleteConfirm.replace('{0}', selectedIds.length.toString()),
            variant: 'danger'
        });

        if (ok) {
            deleteMembers(selectedIds);
            setSelectedIds([]);
            setIsPasswordModalOpen(false);
            setAdminPassword('');
            alert({
                title: t.common.success,
                message: t.members.deleteAllSuccess.replace('{0}', selectedIds.length.toString()),
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
            title: t.common.success,
            message: t.members.divisionChanged.replace('{0}', selectedIds.length.toString()),
            variant: 'info'
        });
    };

    const handleOpenEdit = (member: Member) => {
        setEditingMember(member);
        setEditData({ name: member.name, division: member.division, birthDate: member.birthDate || '' });
        setIsEditModalOpen(true);
    };

    const handleEditMember = () => {
        if (!editingMember || !editData.name || !editData.division || !editData.birthDate) return;

        updateMembers([editingMember.id], {
            name: editData.name,
            division: editData.division,
            birthDate: editData.birthDate
        });

        setIsEditModalOpen(false);
        setEditingMember(null);
        alert({
            title: t.common.success,
            message: t.members.editSuccess,
            variant: 'success'
        });
    };

    const handleDelete = async (id: string) => {
        const ok = await confirm({
            title: t.members.deleteConfirm,
            message: t.members.permDeleteConfirm,
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
            const exportData = logs.map(log => {
                let actionText = log.action === 'CREATE' ? (log.points > 0 ? t.sidebar.achievement : t.sidebar.violation) : t.members.reverted;
                let detailsText = log.details;

                if (log.action === 'UPDATE') {
                    if (log.details.startsWith('[Peringatan]')) {
                        actionText = t.sidebar.warning;
                        detailsText = log.details.replace('[Peringatan]', '').trim();
                    } else {
                        actionText = t.sidebar.appeals;
                    }
                }

                return {
                    [t.members.date]: new Date(log.timestamp).toLocaleString(),
                    [t.members.details]: detailsText,
                    [t.members.points]: log.points,
                    [t.members.action]: actionText,
                    [t.members.changedBy]: users.find(u => u.id === log.contributorId)?.name || log.contributorId
                };
            });

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "History");

            XLSX.writeFile(wb, `History_${member.name}_${new Date().toISOString().split('T')[0]}.xlsx`);

            alert({
                title: t.members.reportExportSuccessTitle,
                message: t.members.reportExportSuccessDesc.replace('{0}', member.name),
                variant: 'success'
            });
        } catch (error) {
            console.error("Export member history error:", error);
            alert({
                title: t.members.reportExportErrorTitle,
                message: t.members.reportExportErrorDesc,
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
                                ...logs.map(log => {
                                    let actionText = log.action === 'CREATE' ? (log.points > 0 ? t.sidebar.achievement : t.sidebar.violation) : t.members.reverted;
                                    let detailsText = log.details;

                                    if (log.action === 'UPDATE') {
                                        if (log.details.startsWith('[Peringatan]')) {
                                            actionText = t.sidebar.warning;
                                            detailsText = log.details.replace('[Peringatan]', '').trim();
                                        } else {
                                            actionText = t.sidebar.appeals;
                                        }
                                    }

                                    return new TableRow({
                                        children: [
                                            new TableCell({ children: [new Paragraph({ text: new Date(log.timestamp).toLocaleString('id-ID'), alignment: AlignmentType.CENTER })] }),
                                            new TableCell({ children: [new Paragraph({ text: detailsText })] }),
                                            new TableCell({ children: [new Paragraph({ text: actionText, alignment: AlignmentType.CENTER })] }),
                                            new TableCell({ children: [new Paragraph({ text: (log.points > 0 ? "+" : "") + log.points.toString(), alignment: AlignmentType.CENTER })] }),
                                            new TableCell({ children: [new Paragraph({ text: users.find(u => u.id === log.contributorId)?.name || log.contributorId, alignment: AlignmentType.CENTER })] }),
                                        ],
                                    });
                                }),
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
                title: t.members.wordExportSuccessTitle,
                message: t.members.wordExportSuccessDesc.replace('{0}', member.name),
                variant: 'success'
            });
        } catch (error) {
            console.error("Export Word error:", error);
            alert({
                title: t.members.wordExportErrorTitle,
                message: t.members.wordExportErrorDesc,
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
                                    {/* Cetak Kartu QR Terpilih - disembunyikan sementara
                                    <Button
                                        variant="secondary"
                                        onClick={handleBulkPrintQR}
                                        title="Cetak Kartu QR Terpilih"
                                        style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    >
                                        <FaQrcode /> Kartu ({selectedIds.length})
                                    </Button>
                                    */}
                                    <Button
                                        variant="secondary"
                                        onClick={handleBulkDownloadQR}
                                        title="Unduh Gambar QR Terpilih"
                                        style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    >
                                        <FaDownload /> Unduh QR ({selectedIds.length})
                                    </Button>
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
                                <TableHead onClick={() => requestSort('birthDate')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {t.landing?.birthDate || 'Tanggal Lahir'} {getSortIcon('birthDate' as any)}
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
                                    <TableCell>{member.birthDate}</TableCell>
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
                                                <Button variant="ghost" onClick={() => handleOpenQR(member)} title="Lihat QR Code">
                                                    <FaQrcode />
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

            {/* Excel Import Preview Modal */}
            <Modal
                isOpen={isImportPreviewOpen}
                onClose={() => {
                    setIsImportPreviewOpen(false);
                    setPendingImportMembers([]);
                    setPendingImportLogs([]);
                }}
                title={t.members.previewImportTitle || "Pratinjau Impor Data"}
                maxWidth="900px"
                footer={
                    <>
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setIsImportPreviewOpen(false);
                                setPendingImportMembers([]);
                                setPendingImportLogs([]);
                            }}
                        >
                            {t.members.previewImportCancel || "Batal"}
                        </Button>
                        <Button
                            onClick={() => {
                                if (pendingImportMembers.length > 0) {
                                    addMembers(pendingImportMembers);
                                    if (pendingImportLogs.length > 0) addAuditLogs(pendingImportLogs);
                                    alert({
                                        title: t.members.importSuccessTitle,
                                        message: t.members.importSuccessDesc.replace('{0}', pendingImportMembers.length.toString()),
                                        variant: 'success'
                                    });
                                }
                                setIsImportPreviewOpen(false);
                                setPendingImportMembers([]);
                                setPendingImportLogs([]);
                            }}
                        >
                            {t.members.previewImportConfirm || "Konfirmasi & Impor"}
                        </Button>
                    </>
                }
            >
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '70vh', overflowY: 'auto' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                        {t.members.previewImportDesc || "Silakan periksa data hasil baca Excel di bawah ini sebelum diimpor."}
                    </p>
                    <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t.members.previewImportId || "ID"}</TableHead>
                                    <TableHead>{t.members.previewImportName || "Nama"}</TableHead>
                                    <TableHead>{t.members.previewImportDivision || "Divisi"}</TableHead>
                                    <TableHead>{t.members.previewImportBirthDate || "Tanggal Lahir"}</TableHead>
                                    <TableHead>{t.members.previewImportPoints || "Poin Awal"}</TableHead>
                                    <TableHead>{t.members.previewImportStatus || "Status"}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingImportMembers.map((m) => {
                                    const status = importItemStatuses[m.id];
                                    let badgeColor = 'var(--color-gray-600)';
                                    let badgeBg = 'var(--color-gray-100)';
                                    let statusText = '';

                                    if (status === 'new') {
                                        badgeColor = 'var(--color-success)';
                                        badgeBg = 'var(--color-success-bg)';
                                        statusText = t.members.statusNew || 'ID Baru';
                                    } else if (status === 'auto') {
                                        badgeColor = 'var(--color-primary)';
                                        badgeBg = 'var(--color-primary-light)';
                                        statusText = t.members.statusAuto || 'ID Otomatis';
                                    } else if (status === 'exists') {
                                        badgeColor = 'var(--color-warning)';
                                        badgeBg = 'rgba(245, 158, 11, 0.1)';
                                        statusText = t.members.statusExists || 'Duplikat (Dibuat Ulang)';
                                    }

                                    return (
                                        <TableRow key={m.id}>
                                            <TableCell style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{m.id}</TableCell>
                                            <TableCell style={{ fontWeight: 600 }}>{m.name}</TableCell>
                                            <TableCell>{m.division}</TableCell>
                                            <TableCell>{m.birthDate}</TableCell>
                                            <TableCell style={{ fontWeight: 700, color: m.totalPoints >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                                {m.totalPoints >= 0 ? '+' : ''}{m.totalPoints}
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    style={{
                                                        padding: '0.25rem 0.5rem',
                                                        borderRadius: 'var(--radius-sm)',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        color: badgeColor,
                                                        backgroundColor: badgeBg,
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {statusText}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                        *Catatan: Kolom ID yang kosong atau duplikat akan otomatis dibuatkan ID unik baru oleh sistem.
                    </span>
                </div>
            </Modal>

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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <Input
                            label={t.members.previewImportId || "ID Anggota (Opsional)"}
                            placeholder="e.g. 0109155449"
                            value={newMember.id}
                            onChange={(e) => setNewMember({ ...newMember, id: e.target.value })}
                        />
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '-0.25rem' }}>
                            *Kosongkan jika ingin dibuat otomatis oleh sistem.
                        </span>
                    </div>
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
                        type="date"
                        label={t.landing?.birthDate || 'Tanggal Lahir'}
                        required
                        value={newMember.birthDate}
                        onChange={(e) => setNewMember({ ...newMember, birthDate: e.target.value })}
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
                    <Input
                        type="date"
                        label={t.landing?.birthDate || 'Tanggal Lahir'}
                        required
                        value={editData.birthDate}
                        onChange={(e) => setEditData({ ...editData, birthDate: e.target.value })}
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
                                            background: 'var(--color-bg-card)',
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
                                                : (log.action === 'UPDATE' && log.details.startsWith('[Peringatan]') ? 'var(--color-warning)' : 'var(--color-gray-400)'),
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
                                                        ? (isPositivePoints ? 'var(--color-success-bg)' : 'var(--color-danger-bg)')
                                                        : (log.action === 'UPDATE' ? (log.details.startsWith('[Peringatan]') ? 'var(--color-warning-light)' : 'var(--color-primary-light)') : 'var(--color-bg-hover)'),
                                                    color: isCreate
                                                        ? (isPositivePoints ? 'var(--color-success)' : 'var(--color-danger)')
                                                        : (log.action === 'UPDATE' ? (log.details.startsWith('[Peringatan]') ? 'var(--color-warning)' : 'var(--color-primary)') : 'var(--color-text-secondary)'),
                                                }}>
                                                    {isCreate ? t.members.added : (log.action === 'UPDATE' ? (log.details.startsWith('[Peringatan]') ? t.sidebar.warning : t.sidebar.appeals) : t.members.reverted)}
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

            {/* QR Code Viewer Modal */}
            <Modal
                isOpen={isQrModalOpen}
                onClose={() => setIsQrModalOpen(false)}
                title={qrMember ? `Kartu Anggota — ${qrMember.name}` : 'Kartu Anggota'}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsQrModalOpen(false)}>{t.common.cancel}</Button>
                        <Button onClick={handleDownloadQR} variant="primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FaDownload /> Unduh Gambar QR (PNG)
                        </Button>
                    </>
                }
            >
                {qrMember && (
                    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', background: 'var(--color-bg-subtle)' }}>
                        <div style={{
                            width: '320px',
                            background: 'var(--color-bg-card)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '12px',
                            boxShadow: 'var(--shadow-md)',
                            padding: '1.5rem',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '1rem',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>Poinkita</div>
                            <div style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '-0.75rem' }}>
                                Kartu Anggota Resmi
                            </div>
                            
                            <div style={{
                                padding: '12px',
                                background: 'white',
                                borderRadius: '8px',
                                border: '1px solid var(--color-border)'
                            }}>
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrMember.id)}`}
                                    alt="QR Code"
                                    style={{ width: '160px', height: '160px', display: 'block' }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-main)' }}>{qrMember.name}</div>
                                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                                    {qrMember.id} • {qrMember.division}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
