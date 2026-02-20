'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/context/StoreContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useDialog } from '@/components/ui/ConfirmDialog';
import {
    FaHistory,
    FaCheck,
    FaTimes,
    FaGavel,
    FaUser,
    FaClock,
    FaSearch,
    FaFilter,
    FaShieldAlt
} from 'react-icons/fa';
import styles from './page.module.css';

export default function AppealsPage() {
    const {
        appeals,
        members,
        auditLogs,
        updateAppealStatus,
        deleteTransaction,
        isLoaded
    } = useStore();
    const { t } = useLanguage();
    const { confirm } = useDialog();

    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAppeal, setSelectedAppeal] = useState<any>(null);

    if (!isLoaded) return <div className={styles.loading}>Loading...</div>;

    const filteredAppeals = (appeals || [])
        .filter(a => filter === 'ALL' ? true : a.status === filter)
        .filter(a => {
            const member = members.find(m => m.id === a.memberId);
            return member?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                a.id.toLowerCase().includes(searchQuery.toLowerCase());
        });

    const handleAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        const isApproved = status === 'APPROVED';
        const confirmed = await confirm({
            title: isApproved ? t.transactions.approved : t.transactions.rejected,
            message: isApproved
                ? "Approving this appeal will automatically revert the associated points. Are you sure?"
                : "Are you sure you want to reject this appeal?",
            variant: isApproved ? 'success' : 'danger'
        });

        if (!confirmed) return;

        const appeal = appeals.find(a => a.id === id);
        if (!appeal) return;

        if (isApproved) {
            deleteTransaction(appeal.transactionId, t.transactions.appealApprovedInfo);
        }

        updateAppealStatus(id, status, status === 'REJECTED' ? t.transactions.appealRejectedInfo : undefined);
    };

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.headerTitle}>
                    <FaGavel className={styles.headerIcon} />
                    <div>
                        <h1>{t.transactions.appeals}</h1>
                        <p>{t.sidebar.appeals} Management</p>
                    </div>
                </div>
            </header>

            <div className={styles.controls}>
                <div className={styles.searchBox}>
                    <FaSearch />
                    <input
                        type="text"
                        placeholder="Search by member name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className={styles.filterGroup}>
                    <Button
                        variant={filter === 'ALL' ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => setFilter('ALL')}
                    >
                        All
                    </Button>
                    <Button
                        variant={filter === 'PENDING' ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => setFilter('PENDING')}
                    >
                        {t.transactions.pending}
                    </Button>
                    <Button
                        variant={filter === 'APPROVED' ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => setFilter('APPROVED')}
                    >
                        {t.transactions.approved}
                    </Button>
                    <Button
                        variant={filter === 'REJECTED' ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => setFilter('REJECTED')}
                    >
                        {t.transactions.rejected}
                    </Button>
                </div>
            </div>

            <div className={styles.grid}>
                {filteredAppeals.length > 0 ? (
                    filteredAppeals.map(appeal => {
                        const member = members.find(m => m.id === appeal.memberId);
                        const log = auditLogs.find(l => l.id === appeal.transactionId);

                        return (
                            <div key={appeal.id} className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.memberInfo}>
                                        <div className={styles.avatar}>
                                            {member?.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3>{member?.name}</h3>
                                            <span className={styles.memberId}>{appeal.memberId}</span>
                                        </div>
                                    </div>
                                    <div className={`${styles.statusBadge} ${styles[appeal.status.toLowerCase()]}`}>
                                        {appeal.status}
                                    </div>
                                </div>

                                <div className={styles.appealContent}>
                                    <div className={styles.infoRow}>
                                        <FaClock />
                                        <span>{new Date(appeal.timestamp).toLocaleString()}</span>
                                    </div>
                                    <div className={styles.reasonBox}>
                                        <p>"{appeal.reason}"</p>
                                    </div>

                                    {appeal.evidence && (
                                        <div className={styles.evidencePreview}>
                                            <img
                                                src={appeal.evidence}
                                                alt="Bukti Banding"
                                                className={styles.evidenceThumb}
                                                onClick={() => setSelectedAppeal(appeal)}
                                            />
                                        </div>
                                    )}

                                    {log && (
                                        <div className={styles.transactionPreview}>
                                            <span className={styles.txLabel}>Contested Transaction:</span>
                                            <div className={styles.txInfo}>
                                                <span className={styles.txDetails}>{log.details}</span>
                                                <span className={`${styles.txPoints} ${log.points >= 0 ? styles.positive : styles.negative}`}>
                                                    {log.points >= 0 ? '+' : ''}{log.points} pts
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {appeal.status === 'PENDING' && (
                                    <div className={styles.cardActions}>
                                        <Button
                                            variant="danger"
                                            className={styles.actionBtn}
                                            onClick={() => handleAction(appeal.id, 'REJECTED')}
                                        >
                                            <FaTimes /> {t.transactions.rejected}
                                        </Button>
                                        <Button
                                            variant="primary"
                                            className={styles.actionBtn}
                                            onClick={() => handleAction(appeal.id, 'APPROVED')}
                                        >
                                            <FaCheck /> {t.transactions.approved}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className={styles.emptyState}>
                        <FaShieldAlt size={48} />
                        <p>No appeals found for this filter.</p>
                    </div>
                )}
            </div>

            <Modal
                isOpen={!!selectedAppeal}
                onClose={() => setSelectedAppeal(null)}
                title="Bukti Banding"
            >
                {selectedAppeal && (
                    <div className={styles.evidenceModalContent}>
                        <img src={selectedAppeal.evidence} alt="Full Bukti" className={styles.evidenceFullImg} />
                        <Button variant="secondary" onClick={() => setSelectedAppeal(null)} className="w-full">
                            Tutup
                        </Button>
                    </div>
                )}
            </Modal>
        </div>
    );
}
