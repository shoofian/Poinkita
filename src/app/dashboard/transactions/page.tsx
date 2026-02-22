'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/context/StoreContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useDialog } from '@/components/ui/ConfirmDialog';
import { FaSearch, FaHistory, FaTrash, FaPlus, FaMinus, FaCamera, FaTimes, FaImage } from 'react-icons/fa';
import { Member, Rule } from '@/lib/store';
import styles from './page.module.css';

// Image compression helper
const compressImage = (file: File, maxWidth = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxWidth) {
                        width *= maxWidth / height;
                        height = maxWidth;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
};

// Reusable history modal content
function MemberHistoryContent({ memberLogs, t, users, onViewImage }: { memberLogs: any[]; t: any; users: any[]; onViewImage?: (src: string) => void }) {
    if (memberLogs.length === 0) {
        return (
            <div style={{
                textAlign: 'center',
                padding: '2rem 1rem',
                color: 'var(--color-text-muted)',
                fontSize: '0.9rem'
            }}>
                {t.members.noHistory}
            </div>
        );
    }

    return (
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
                                    {isCreate ? t.members.added : (log.action === 'UPDATE' ? (log.details.startsWith('[Peringatan]') ? 'Peringatan' : t.sidebar.appeals) : t.members.reverted)}
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
                            {log.evidence && (
                                <div className={styles.historyEvidence}>
                                    <img
                                        src={log.evidence}
                                        alt="evidence"
                                        className={styles.evidenceThumb}
                                        onClick={() => onViewImage?.(log.evidence)}
                                    />
                                    <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 500 }}>{t.transactions.evidence}</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default function TransactionsPage() {
    const { members, rules, transactions, auditLogs, addTransaction, deleteTransaction, currentUser, users, generateId, lookupUser } = useStore();
    const { t } = useLanguage();
    const { confirm, alert } = useDialog();

    const [memberSearch, setMemberSearch] = useState('');
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [step, setStep] = useState<'TYPE' | 'RULE'>('TYPE');
    const [selectedType, setSelectedType] = useState<'ACHIEVEMENT' | 'VIOLATION' | null>(null);
    const [ruleSearch, setRuleSearch] = useState('');

    // History modal state
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [historyMember, setHistoryMember] = useState<Member | null>(null);

    // Evidence state
    const [evidence, setEvidence] = useState<string | null>(null);
    const [isCompressing, setIsCompressing] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Image Zoom State
    const [zoomImage, setZoomImage] = useState<string | null>(null);

    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.id.toLowerCase().includes(memberSearch.toLowerCase())
    );

    const filteredRules = rules.filter(r =>
        (selectedType ? r.type === selectedType : true) &&
        (r.description.toLowerCase().includes(ruleSearch.toLowerCase()) ||
            r.id.toLowerCase().includes(ruleSearch.toLowerCase()))
    );

    const handleMemberClick = (member: Member) => {
        setSelectedMember(member);
        setStep('TYPE');
        setSelectedType(null);
        setRuleSearch('');
        setEvidence(null);
        setIsModalOpen(true);
    };

    const handleDirectTypeSelect = (e: React.MouseEvent, member: Member, type: 'ACHIEVEMENT' | 'VIOLATION') => {
        e.stopPropagation();
        setSelectedMember(member);
        setSelectedType(type);
        setStep('RULE');
        setRuleSearch('');
        setEvidence(null);
        setIsModalOpen(true);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsCompressing(true);
            const compressed = await compressImage(file);
            setEvidence(compressed);
        } catch (err) {
            console.error(err);
            alert({ title: "Error", message: "Failed to process image.", variant: 'danger' });
        } finally {
            setIsCompressing(false);
        }
    };

    const handleTypeSelect = (type: 'ACHIEVEMENT' | 'VIOLATION') => {
        setSelectedType(type);
        setStep('RULE');
    };

    const handleRuleSelect = async (rule: Rule) => {
        if (!selectedMember || !currentUser) {
            alert({
                title: "Error",
                message: "Please login first.",
                variant: 'info'
            });
            return;
        }

        const ok = await confirm({
            title: t.transactions.confirm,
            message: `${t.members.added}: ${rule.description} (${rule.points} pts) ${t.members.changedBy} ${selectedMember.name}`,
            variant: 'warning',
            confirmLabel: t.common.save,
            cancelLabel: t.common.cancel
        });

        if (ok) {
            addTransaction({
                id: generateId('TX', rule.type === 'ACHIEVEMENT' ? 'ACH' : 'VIO'),
                memberId: selectedMember.id,
                contributorId: currentUser.id,
                ruleId: rule.id,
                timestamp: new Date().toISOString(),
                pointsSnapshot: rule.points,
                adminId: currentUser.adminId || currentUser.id, // Admin Scope Owner
                evidence: evidence || undefined
            });
            setIsModalOpen(false);
            setEvidence(null);
        }
    };

    const handleDelete = async (txId: string) => {
        const ok = await confirm({
            title: t.transactions.deleteConfirm,
            message: "This action cannot be undone.",
            variant: 'danger',
            confirmLabel: t.common.delete,
            cancelLabel: t.common.cancel
        });

        if (ok) {
            deleteTransaction(txId);
        }
    };

    const handleViewHistory = (memberId: string) => {
        const member = members.find(m => m.id === memberId);
        if (member) {
            setHistoryMember(member);
            setIsHistoryOpen(true);
        }
    };

    const historyLogs = historyMember
        ? auditLogs.filter(log => log.memberId === historyMember.id)
        : [];

    return (
        <div className={styles.container}>
            {/* Left Panel - Member List */}
            <div className={styles.panel}>
                <div className={styles.panelHeader}>
                    <h2 className={styles.panelTitle}>{t.transactions.selectMember}</h2>
                    <div className={styles.searchBox}>
                        <FaSearch className={styles.searchIcon} />
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder={t.transactions.searchPlaceholder}
                            value={memberSearch}
                            onChange={(e) => setMemberSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className={styles.panelContent}>
                    {filteredMembers.map(m => (
                        <div
                            key={m.id}
                            className={styles.memberItem}
                            onClick={() => handleMemberClick(m)}
                        >
                            <div className={styles.memberInfo}>
                                <div className={styles.memberAvatar}>
                                    {m.name.charAt(0).toUpperCase()}
                                </div>
                                <div className={styles.memberText}>
                                    <div className={styles.memberName}>{m.name}</div>
                                    <div className={styles.memberMeta}>{m.id} • {m.division}</div>
                                </div>
                            </div>
                            <div className={styles.memberRight}>
                                <div className={`${styles.memberPoints} ${m.totalPoints >= 0 ? styles.pointsPositive : styles.pointsNegative}`}>
                                    {m.totalPoints} pts
                                </div>
                                <div className={styles.memberActions}>
                                    <button
                                        className={`${styles.quickBtn} ${styles.quickBtnAchievement}`}
                                        onClick={(e) => handleDirectTypeSelect(e, m, 'ACHIEVEMENT')}
                                        title={t.rules.achievement}
                                    >
                                        <FaPlus size={10} />
                                    </button>
                                    <button
                                        className={`${styles.quickBtn} ${styles.quickBtnViolation}`}
                                        onClick={(e) => handleDirectTypeSelect(e, m, 'VIOLATION')}
                                        title={t.rules.violation}
                                    >
                                        <FaMinus size={10} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredMembers.length === 0 && (
                        <div className={styles.emptyState}>No members found</div>
                    )}
                </div>
            </div>

            {/* Right Panel - History */}
            <div className={styles.panel}>
                <div className={styles.panelHeader}>
                    <h2 className={styles.panelTitle}>
                        <FaHistory /> {t.transactions.recent}
                    </h2>
                </div>
                <div className={styles.panelContent}>
                    <div className={styles.historyHeader}>
                        <span>{t.transactions.time}</span>
                        <span>{t.transactions.desc}</span>
                        <span>{t.transactions.pts}</span>
                        <span></span>
                    </div>
                    {auditLogs.length === 0 ? (
                        <div className={styles.emptyState}>{t.dashboard.noActivity}</div>
                    ) : (
                        auditLogs.map(log => {
                            const member = members.find(m => m.id === log.memberId);
                            const activeTransaction = transactions.find(tx =>
                                tx.timestamp === log.timestamp &&
                                tx.memberId === log.memberId &&
                                log.action === 'CREATE'
                            );

                            return (
                                <div
                                    key={log.id}
                                    className={`${styles.historyRow} ${log.action === 'DELETE' ? styles.historyRowDeleted : ''}`}
                                >
                                    <div>
                                        <div
                                            className={styles.historyMember}
                                            onClick={(e) => { e.stopPropagation(); handleViewHistory(log.memberId); }}
                                            style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'transparent', transition: 'text-decoration-color 0.15s' }}
                                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.textDecorationColor = 'currentColor'; }}
                                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.textDecorationColor = 'transparent'; }}
                                        >
                                            {member?.name || log.memberId}
                                        </div>
                                        <div className={styles.historyTime}>
                                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {t.members.changedBy} {lookupUser(log.contributorId)?.name || log.contributorId}
                                        </div>
                                    </div>
                                    <div className={styles.historyDesc}>
                                        {log.action === 'DELETE' ? 'Reverted' : log.details}
                                        {log.evidence && (
                                            <div style={{ marginTop: '4px' }}>
                                                <img
                                                    src={log.evidence}
                                                    alt="evidence"
                                                    className={styles.evidenceThumb}
                                                    onClick={() => setZoomImage(log.evidence!)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div className={`${styles.memberPoints} ${log.points > 0 ? styles.pointsPositive : styles.pointsNegative}`}>
                                        {log.points > 0 ? '+' : ''}{log.points}
                                    </div>
                                    <div>
                                        {activeTransaction && log.action === 'CREATE' && (
                                            <button
                                                className={styles.deleteBtn}
                                                onClick={() => handleDelete(activeTransaction.id)}
                                            >
                                                <FaTrash size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedMember ? `${selectedMember.name}` : ''}
            >
                {step === 'TYPE' ? (
                    <>
                        <div className={styles.modalTypeGrid}>
                            <div
                                className={`${styles.typeCard} ${styles.typeCardAchievement}`}
                                onClick={() => handleTypeSelect('ACHIEVEMENT')}
                            >
                                <div className={styles.typeIcon}>✅</div>
                                <div className={styles.typeLabel}>{t.rules.achievement}</div>
                            </div>
                            <div
                                className={`${styles.typeCard} ${styles.typeCardViolation}`}
                                onClick={() => handleTypeSelect('VIOLATION')}
                            >
                                <div className={styles.typeIcon}>⚠️</div>
                                <div className={styles.typeLabel}>{t.rules.violation}</div>
                            </div>
                        </div>

                        {/* Member History inside modal */}
                        {selectedMember && (() => {
                            const selectedMemberLogs = auditLogs.filter(log => log.memberId === selectedMember.id);
                            return (
                                <div style={{ borderTop: '1px solid var(--color-border)' }}>
                                    <div style={{
                                        padding: '1rem 1.5rem 0.5rem',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        color: 'var(--color-text-light)',
                                        textTransform: 'uppercase' as const,
                                        letterSpacing: '0.05em',
                                    }}>
                                        {t.members.historyTitle}
                                    </div>
                                    <div style={{ padding: '0 1.5rem 1.5rem', maxHeight: '250px', overflowY: 'auto' }}>
                                        <MemberHistoryContent
                                            memberLogs={selectedMemberLogs}
                                            t={t}
                                            users={users}
                                            onViewImage={(src) => setZoomImage(src)}
                                        />
                                    </div>
                                </div>
                            );
                        })()}
                    </>
                ) : (
                    <>
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
                            <div className={styles.searchBox} style={{ marginTop: 0 }}>
                                <FaSearch className={styles.searchIcon} />
                                <input
                                    type="text"
                                    className={styles.searchInput}
                                    placeholder={t.transactions.searchRules}
                                    value={ruleSearch}
                                    onChange={(e) => setRuleSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className={styles.evidenceSection}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                />
                                <button
                                    className={styles.uploadBtn}
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isCompressing}
                                >
                                    <FaCamera /> {isCompressing ? t.transactions.compressing : t.transactions.addEvidence}
                                </button>

                                {evidence && (
                                    <div className={styles.evidencePreview}>
                                        <img src={evidence} alt="Preview" />
                                        <button className={styles.removeImg} onClick={() => setEvidence(null)}>
                                            <FaTimes />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className={styles.rulesList} style={{ padding: '0.5rem 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {filteredRules.map(r => (
                                <div
                                    key={r.id}
                                    className={styles.ruleItemCard}
                                    onClick={() => handleRuleSelect(r)}
                                >
                                    <div className={styles.ruleHeader}>
                                        <div className={styles.ruleContent}>
                                            <span className={styles.ruleCode}>{r.id}</span>
                                            <div className={styles.ruleName}>{r.description}</div>
                                        </div>
                                        <div className={`${styles.ruleBadge} ${r.points > 0 ? styles.pointsPositive : styles.pointsNegative}`}>
                                            {r.points > 0 ? '+' : ''}{r.points} {t.transactions.pts}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filteredRules.length === 0 && (
                                <div className={styles.emptyState}>{t.rules.noRules}</div>
                            )}
                        </div>
                        <div className={styles.modalFooter} style={{ padding: '1rem 1.5rem 1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <Button variant="secondary" onClick={() => setStep('TYPE')}>← {t.common.back}</Button>
                            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>{t.common.cancel}</Button>
                        </div>
                    </>
                )}
            </Modal>

            {/* History Modal */}
            <Modal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                title={historyMember ? `${t.members.historyTitle} — ${historyMember.name}` : t.members.historyTitle}
            >
                <div style={{ padding: '1.5rem' }}>
                    <MemberHistoryContent
                        memberLogs={historyLogs}
                        t={t}
                        users={users}
                        onViewImage={(src) => setZoomImage(src)}
                    />
                </div>
            </Modal>

            {/* Image Zoom Modal */}
            <Modal
                isOpen={!!zoomImage}
                onClose={() => setZoomImage(null)}
                title={t.transactions.evidence}
            >
                <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center' }}>
                    <img
                        src={zoomImage || ''}
                        alt="Zoomed evidence"
                        style={{ maxWidth: '100%', borderRadius: '8px', boxShadow: 'var(--shadow-lg)' }}
                    />
                </div>
            </Modal>
        </div>
    );
}
