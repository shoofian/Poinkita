'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { useStore } from '@/lib/context/StoreContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useDialog } from '@/components/ui/ConfirmDialog';
import { Archive, ArchiveMember } from '@/lib/store';
import { FaTrash, FaEye, FaChevronLeft, FaArchive, FaSearch, FaFilter, FaSort, FaSortUp, FaSortDown, FaDownload, FaClipboardList, FaFileExcel, FaFileWord } from 'react-icons/fa';
import { Input } from '@/components/ui/Input';
import * as XLSX from 'xlsx';

export default function ArchivePage() {
    const { archives, deleteArchive, currentUser, members } = useStore();
    const { t } = useLanguage();
    const { confirm } = useDialog();

    const [selectedArchive, setSelectedArchive] = useState<Archive | null>(null);
    const [historyMember, setHistoryMember] = useState<ArchiveMember | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [divisionFilter, setDivisionFilter] = useState<string>('all');
    const [sortConfig, setSortConfig] = useState<{ key: 'id' | 'name' | 'division' | 'points'; direction: 'asc' | 'desc' } | null>({ key: 'points', direction: 'desc' });

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

    const uniqueDivisions = Array.from(new Set([
        ...members.map(m => m.division.trim()),
        ...archives.flatMap(a => a.memberSnapshots.map(m => m.division.trim()))
    ].filter(Boolean))).sort();

    const filteredAndSortedMembers = selectedArchive
        ? selectedArchive.memberSnapshots
            .filter(m => {
                const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.id.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesDivision = divisionFilter === 'all' || m.division.trim() === divisionFilter;
                return matchesSearch && matchesDivision;
            })
            .sort((a, b) => {
                if (!sortConfig) return 0;
                const { key, direction } = sortConfig;
                let aVal = a[key as keyof typeof a];
                let bVal = b[key as keyof typeof b];

                if (typeof aVal === 'string' && typeof bVal === 'string') {
                    return direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                }

                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    return direction === 'asc' ? aVal - bVal : bVal - aVal;
                }

                return 0;
            })
        : [];

    const requestSort = (key: 'id' | 'name' | 'division' | 'points') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: 'id' | 'name' | 'division' | 'points') => {
        if (!sortConfig || sortConfig.key !== key) return <FaSort style={{ opacity: 0.3 }} />;
        return sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />;
    };

    const handleViewHistory = (member: ArchiveMember) => {
        setHistoryMember(member);
        setIsHistoryOpen(true);
    };

    const handleExportMemberHistory = (member: ArchiveMember) => {
        if (!member.history) return;
        try {
            const exportData = member.history.map(log => {
                let actionText = log.action === 'CREATE' ? (log.points > 0 ? 'Pencapaian' : 'Pelanggaran') : t.members.reverted;
                let detailsText = log.details;

                if (log.action === 'UPDATE') {
                    if (log.details.startsWith('[Peringatan]')) {
                        actionText = 'Peringatan';
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
                    [t.members.changedBy]: log.contributorName
                };
            });

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "History");
            XLSX.writeFile(wb, `Archive_History_${member.name}_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (error) {
            console.error(error);
        }
    };

    const handleExportMemberHistoryWord = async (member: ArchiveMember) => {
        if (!member.history) return;
        const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } = await import('docx');
        const { saveAs } = await import('file-saver');

        try {
            const logs = member.history;
            const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

            const doc = new Document({
                sections: [{
                    properties: {},
                    children: [
                        new Paragraph({
                            children: [new TextRun({ text: t.report.title.toUpperCase(), bold: true, size: 28 })],
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 400 },
                        }),
                        new Paragraph({
                            children: [new TextRun({ text: t.report.intro.replace('{0}', dateStr), size: 22 })],
                            spacing: { after: 300 },
                            alignment: AlignmentType.JUSTIFIED,
                        }),
                        new Paragraph({
                            children: [new TextRun({ text: t.report.memberInfo, bold: true, size: 24, underline: {} })],
                            spacing: { before: 200, after: 200 },
                        }),
                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
                            rows: [
                                new TableRow({ children: [new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: `${t.members.memberId} :`, bold: true })] })] }), new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: member.id })] })] }),
                                new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${t.auth.name} :`, bold: true })] })] }), new TableCell({ children: [new Paragraph({ text: member.name })] })] }),
                                new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${t.members.division} :`, bold: true })] })] }), new TableCell({ children: [new Paragraph({ text: member.division })] })] }),
                                new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${t.members.points} :`, bold: true })] })] }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${member.points} Poin`, bold: true, color: member.points >= 0 ? "10b981" : "ef4444" })] })] })] }),
                            ],
                        }),
                        new Paragraph({
                            children: [new TextRun({ text: t.report.historyTable, bold: true, size: 24, underline: {} })],
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
                                    let actionText = log.action === 'CREATE' ? (log.points > 0 ? 'Pencapaian' : 'Pelanggaran') : t.members.reverted;
                                    let detailsText = log.details;
                                    if (log.action === 'UPDATE') {
                                        if (log.details.startsWith('[Peringatan]')) { actionText = 'Peringatan'; detailsText = log.details.replace('[Peringatan]', '').trim(); }
                                        else { actionText = t.sidebar.appeals; }
                                    }
                                    return new TableRow({
                                        children: [
                                            new TableCell({ children: [new Paragraph({ text: new Date(log.timestamp).toLocaleString('id-ID'), alignment: AlignmentType.CENTER })] }),
                                            new TableCell({ children: [new Paragraph({ text: detailsText })] }),
                                            new TableCell({ children: [new Paragraph({ text: actionText, alignment: AlignmentType.CENTER })] }),
                                            new TableCell({ children: [new Paragraph({ text: (log.points > 0 ? "+" : "") + log.points.toString(), alignment: AlignmentType.CENTER })] }),
                                            new TableCell({ children: [new Paragraph({ text: log.contributorName, alignment: AlignmentType.CENTER })] }),
                                        ],
                                    });
                                }),
                            ],
                        }),
                        new Paragraph({ text: t.report.signatureTitle, alignment: AlignmentType.RIGHT, spacing: { before: 800 } }),
                        new Paragraph({ text: "", spacing: { before: 1200 } }),
                        new Paragraph({ text: `(${t.report.signatureRole})`, alignment: AlignmentType.RIGHT }),
                    ],
                }],
            });

            const blob = await Packer.toBlob(doc);
            saveAs(blob, `Archive_Report_${member.name}.docx`);
        } catch (error) {
            console.error(error);
        }
    };

    const handleExportSpecificArchive = () => {
        if (!selectedArchive) return;
        try {
            const exportData = filteredAndSortedMembers.map((m, index) => ({
                "No": index + 1,
                "ID": m.id,
                [t.auth.name]: m.name,
                [t.members.division]: m.division,
                [t.members.points]: m.points,
            }));

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Archive Data");

            const dateStr = new Date(selectedArchive.timestamp).toISOString().split('T')[0];
            XLSX.writeFile(wb, `Archive_${selectedArchive.title.replace(/\s+/g, '_')}_${dateStr}.xlsx`);
        } catch (error) {
            console.error("Export Archive Error:", error);
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
                        <Button
                            variant="primary"
                            onClick={handleExportSpecificArchive}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <FaDownload /> {t.common.export}
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {/* Filters & Search */}
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <div style={{ flex: '1 1 250px', position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
                                    <FaSearch size={14} />
                                </div>
                                <input
                                    type="text"
                                    placeholder={t.archive.searchArchive || "Cari nama atau ID..."}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.625rem 1rem 0.625rem 2.5rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--color-border)',
                                        backgroundColor: 'var(--color-bg-input)',
                                        color: 'var(--color-text-main)',
                                        fontSize: '0.875rem'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <FaFilter size={14} color="var(--color-text-muted)" />
                                    <select
                                        value={divisionFilter}
                                        onChange={(e) => setDivisionFilter(e.target.value)}
                                        style={{
                                            padding: '0.625rem 1rem',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--color-border)',
                                            backgroundColor: 'var(--color-bg-input)',
                                            color: 'var(--color-text-main)',
                                            fontSize: '0.875rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="all">{t.members.allDivisions || t.archive.allDivisions || "Semua Divisi"}</option>
                                        {uniqueDivisions.map(div => (
                                            <option key={div} value={div}>{div}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead onClick={() => requestSort('id')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            ID {getSortIcon('id')}
                                        </div>
                                    </TableHead>
                                    <TableHead onClick={() => requestSort('name')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {t.auth.name} {getSortIcon('name')}
                                        </div>
                                    </TableHead>
                                    <TableHead onClick={() => requestSort('division')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {t.members.division} {getSortIcon('division')}
                                        </div>
                                    </TableHead>
                                    <TableHead onClick={() => requestSort('points')} style={{ cursor: 'pointer', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            {t.members.points} {getSortIcon('points')}
                                        </div>
                                    </TableHead>
                                    <TableHead>{t.common.actions}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAndSortedMembers.length > 0 ? (
                                    filteredAndSortedMembers.map((member, index) => (
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
                                            <TableCell>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <Button variant="ghost" onClick={() => handleViewHistory(member)} title={t.members.history}>
                                                        <FaClipboardList />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                                            {t.archive.noFilteredMembers || "Tidak ada anggota yang memenuhi kriteria pencarian/filter."}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Member History Modal (Archive version) */}
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
                                <Button variant="secondary" onClick={() => handleExportMemberHistory(historyMember)}>
                                    <FaFileExcel style={{ marginRight: '0.5rem' }} /> {t.common.export}
                                </Button>
                                <Button onClick={() => handleExportMemberHistoryWord(historyMember)}>
                                    <FaFileWord style={{ marginRight: '0.5rem' }} /> {t.members.exportWord}
                                </Button>
                            </div>
                        )
                    }
                >
                    <div style={{ padding: '1.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
                        {!historyMember?.history || historyMember.history.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>{t.members.noHistory}</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {historyMember.history.map((log, i) => (
                                    <div key={i} style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-card)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                                                {new Date(log.timestamp).toLocaleString()}
                                            </span>
                                            <span style={{ fontWeight: 700, color: log.points > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                                {log.points > 0 ? '+' : ''}{log.points}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.875rem' }}>{log.details}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                            {t.members.changedBy} {log.contributorName}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Modal>
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


