'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/context/StoreContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useDialog } from '@/components/ui/ConfirmDialog';
import { FaSearch, FaHistory, FaTrash, FaPlus, FaMinus, FaCamera, FaTimes, FaImage, FaSpinner } from 'react-icons/fa';
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
                                    {isCreate ? t.members.added : (log.action === 'UPDATE' ? (log.details.startsWith('[Peringatan]') ? t.rules.warningDefault : t.sidebar.appeals) : t.members.reverted)}
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

    // Bulk selection state
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

    // Touch swipe gesture refs & state
    const touchStartX = React.useRef<number | null>(null);
    const touchStartY = React.useRef<number | null>(null);
    const [swipingMemberId, setSwipingMemberId] = useState<string | null>(null);
    const [swipeOffset, setSwipeOffset] = useState<number>(0);

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

    const searchTerms = ruleSearch.toLowerCase().split(/\s+/).filter(Boolean);
    const filteredRules = rules.filter(r => {
        if (selectedType && r.type !== selectedType) return false;
        if (searchTerms.length === 0) return true;
        const desc = r.description.toLowerCase();
        const id = r.id.toLowerCase();
        return searchTerms.every(term => desc.includes(term) || id.includes(term));
    });

    const getSmartRecommendations = () => {
        const frequencies: Record<string, number> = {};
        transactions.forEach(tx => {
            if (tx.ruleId) {
                frequencies[tx.ruleId] = (frequencies[tx.ruleId] || 0) + 1;
            }
        });
        
        const sortedRuleIds = Object.keys(frequencies).sort((a, b) => frequencies[b] - frequencies[a]);
        
        const topRules = sortedRuleIds
            .map(id => rules.find(r => r.id === id))
            .filter((r): r is Rule => !!r && (!selectedType || r.type === selectedType))
            .slice(0, 3);
            
        if (topRules.length < 3) {
            const matchingRules = rules.filter(r => !selectedType || r.type === selectedType);
            for (const r of matchingRules) {
                if (topRules.length >= 3) break;
                if (!topRules.some(tr => tr.id === r.id)) {
                    topRules.push(r);
                }
            }
        }
        return topRules;
    };

    const handleTouchStart = (e: React.TouchEvent, memberId: string) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
        setSwipingMemberId(memberId);
        setSwipeOffset(0);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (touchStartX.current === null || touchStartY.current === null) return;
        const diffX = e.touches[0].clientX - touchStartX.current;
        const diffY = e.touches[0].clientY - touchStartY.current;
        
        if (Math.abs(diffX) > Math.abs(diffY)) {
            const cappedOffset = Math.max(-80, Math.min(80, diffX));
            setSwipeOffset(cappedOffset);
        }
    };

    const handleTouchEnd = (member: Member) => {
        if (touchStartX.current === null) return;
        
        const threshold = 50;
        if (swipeOffset > threshold) {
            handleDirectTypeSelect(null as any, member, 'ACHIEVEMENT');
        } else if (swipeOffset < -threshold) {
            handleDirectTypeSelect(null as any, member, 'VIOLATION');
        }
        
        touchStartX.current = null;
        touchStartY.current = null;
        setSwipingMemberId(null);
        setSwipeOffset(0);
    };

    const handleBulkRecordStart = () => {
        if (selectedMemberIds.length === 0) return;
        setSelectedMember(null);
        setStep('TYPE');
        setSelectedType(null);
        setRuleSearch('');
        setEvidence(null);
        setIsModalOpen(true);
    };

    const handleMemberClick = (member: Member) => {
        setSelectedMember(member);
        setStep('TYPE');
        setSelectedType(null);
        setRuleSearch('');
        setEvidence(null);
        setIsModalOpen(true);
    };

    const handleDirectTypeSelect = (e: React.MouseEvent, member: Member, type: 'ACHIEVEMENT' | 'VIOLATION') => {
        if (e) e.stopPropagation();
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
            alert({ title: t.common.error, message: t.transactions.processImageError, variant: 'danger' });
        } finally {
            setIsCompressing(false);
        }
    };

    const handleTypeSelect = (type: 'ACHIEVEMENT' | 'VIOLATION') => {
        setSelectedType(type);
        setStep('RULE');
    };

    const handleRuleSelect = async (rule: Rule) => {
        if (!currentUser) {
            alert({
                title: t.common.error,
                message: t.transactions.loginRequired,
                variant: 'info'
            });
            return;
        }

        const isBulk = selectedMember === null && selectedMemberIds.length > 0;

        if (!selectedMember && !isBulk) {
            alert({
                title: t.common.error,
                message: "Silakan pilih anggota terlebih dahulu.",
                variant: 'info'
            });
            return;
        }

        // Daily limit check
        if (rule.oncePerDay) {
            const todayStr = new Date().toLocaleDateString();

            if (isBulk) {
                const membersWithTx = selectedMemberIds.filter(mId => {
                    return transactions.some(tx => {
                        const txDate = new Date(tx.timestamp).toLocaleDateString();
                        return tx.memberId === mId && tx.ruleId === rule.id && txDate === todayStr;
                    });
                });

                if (membersWithTx.length > 0) {
                    const names = membersWithTx.map(mId => members.find(m => m.id === mId)?.name || mId).join(', ');
                    alert({
                        title: t.transactions.dailyLimitTitle,
                        message: `Anggota berikut sudah menerima aturan "${rule.description}" hari ini: ${names}`,
                        variant: 'warning'
                    });
                    return;
                }
            } else if (selectedMember) {
                const hasTxToday = transactions.some(tx => {
                    const txDate = new Date(tx.timestamp).toLocaleDateString();
                    return tx.memberId === selectedMember.id && tx.ruleId === rule.id && txDate === todayStr;
                });

                if (hasTxToday) {
                    alert({
                        title: t.transactions.dailyLimitTitle,
                        message: t.transactions.dailyLimitMessage.replace('{0}', rule.description),
                        variant: 'warning'
                    });
                    return;
                }
            }
        }

        const confirmationMsg = isBulk
            ? `${t.members.added || "Ditambahkan"}: ${rule.description} (${rule.points} pts) untuk ${selectedMemberIds.length} anggota.`
            : `${t.members.added || "Ditambahkan"}: ${rule.description} (${rule.points} pts) ${t.members.changedBy || "kepada"} ${selectedMember?.name}`;

        const ok = await confirm({
            title: t.transactions.confirm,
            message: confirmationMsg,
            variant: 'warning',
            confirmLabel: t.common.save,
            cancelLabel: t.common.cancel
        });

        if (ok) {
            if (isBulk) {
                const baseTxId = generateId('TX', rule.type === 'ACHIEVEMENT' ? 'ACH' : 'VIO');
                const parts = baseTxId.split('-');
                const baseSeq = parseInt(parts[parts.length - 1], 10);
                const prefixWithoutSeq = parts.slice(0, parts.length - 1).join('-');

                selectedMemberIds.forEach((mId, idx) => {
                    const seq = baseSeq + idx;
                    const customTxId = `${prefixWithoutSeq}-${seq.toString().padStart(3, '0')}`;
                    addTransaction({
                        id: customTxId,
                        memberId: mId,
                        contributorId: currentUser.id,
                        ruleId: rule.id,
                        timestamp: new Date(Date.now() + idx * 10).toISOString(),
                        pointsSnapshot: rule.points,
                        adminId: currentUser.adminId || currentUser.id,
                        evidence: evidence || undefined
                    });
                });
                
                setSelectedMemberIds([]); // Clear selection
            } else if (selectedMember) {
                addTransaction({
                    id: generateId('TX', rule.type === 'ACHIEVEMENT' ? 'ACH' : 'VIO'),
                    memberId: selectedMember.id,
                    contributorId: currentUser.id,
                    ruleId: rule.id,
                    timestamp: new Date().toISOString(),
                    pointsSnapshot: rule.points,
                    adminId: currentUser.adminId || currentUser.id,
                    evidence: evidence || undefined
                });
            }

            setIsModalOpen(false);
            setEvidence(null);
        }
    };

    const handleDelete = async (txId: string) => {
        const ok = await confirm({
            title: t.transactions.deleteConfirm,
            message: t.transactions.actionCannotBeUndone,
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
                {selectedMemberIds.length > 0 ? (
                    <div className={styles.bulkBar}>
                        <span className={styles.bulkInfo}>
                            {selectedMemberIds.length} anggota terpilih
                        </span>
                        <div className={styles.bulkActions}>
                            <button className={`${styles.bulkBtn} ${styles.bulkBtnPrimary}`} onClick={handleBulkRecordStart}>
                                Catat Poin Massal
                            </button>
                            <button className={`${styles.bulkBtn} ${styles.bulkBtnSecondary}`} onClick={() => setSelectedMemberIds([])}>
                                Batal
                            </button>
                        </div>
                    </div>
                ) : null}
                <div className={styles.panelHeader}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 className={styles.panelTitle}>{t.transactions.selectMember}</h2>
                        {filteredMembers.length > 0 && (
                            <button
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-primary)',
                                    fontSize: '0.8125rem',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                                onClick={() => {
                                    const allIds = filteredMembers.map(m => m.id);
                                    const allSelected = allIds.every(id => selectedMemberIds.includes(id));
                                    if (allSelected) {
                                        setSelectedMemberIds(prev => prev.filter(id => !allIds.includes(id)));
                                    } else {
                                        setSelectedMemberIds(prev => Array.from(new Set([...prev, ...allIds])));
                                    }
                                }}
                            >
                                {filteredMembers.map(m => m.id).every(id => selectedMemberIds.includes(id))
                                    ? "Batalkan Semua"
                                    : "Pilih Semua"}
                            </button>
                        )}
                    </div>
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
                    {filteredMembers.map(m => {
                        const isSelected = selectedMemberIds.includes(m.id);
                        const isThisSwiping = swipingMemberId === m.id;
                        const transformStyle = isThisSwiping ? `translateX(${swipeOffset}px)` : 'none';

                        return (
                            <div
                                key={m.id}
                                className={styles.swipeContainer}
                                onTouchStart={(e) => handleTouchStart(e, m.id)}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={() => handleTouchEnd(m)}
                            >
                                {isThisSwiping && Math.abs(swipeOffset) > 10 && (
                                    <div className={styles.swipeBg}>
                                        {swipeOffset > 0 ? (
                                            <div className={styles.swipeBgLeft}>✅ {t.rules.achievement || "Prestasi"}</div>
                                        ) : (
                                            <div className={styles.swipeBgRight}>⚠️ {t.rules.violation || "Pelanggaran"}</div>
                                        )}
                                    </div>
                                )}
                                <div
                                    className={`${styles.memberItem} ${isSelected ? styles.memberItemSelected : ''} ${styles.swipeContent}`}
                                    style={{ transform: transformStyle }}
                                    onClick={() => handleMemberClick(m)}
                                >
                                    <div className={styles.memberInfo}>
                                        <div className={styles.memberLeftCheckbox} onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                className={styles.checkbox}
                                                checked={isSelected}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedMemberIds(prev => [...prev, m.id]);
                                                    } else {
                                                        setSelectedMemberIds(prev => prev.filter(id => id !== m.id));
                                                    }
                                                }}
                                            />
                                        </div>
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
                            </div>
                        );
                    })}
                    {filteredMembers.length === 0 && (
                        <div className={styles.emptyState}>
                            <div style={{ marginBottom: members.length === 0 ? '1rem' : '0' }}>{t.transactions.noMembersFound}</div>
                            {members.length === 0 && (
                                <Link href="/dashboard/members">
                                    <Button variant="primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <FaPlus size={12} /> Tambah Anggota
                                    </Button>
                                </Link>
                            )}
                        </div>
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
                                        {log.action === 'DELETE' ? t.transactions.reverted : log.details}
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

            {/* Slide-over / Modal Panel */}
            <div className={`${styles.slidePanelWrapper} ${isModalOpen ? styles.slidePanelActive : ''}`}>
                <div className={styles.slidePanelOverlay} onClick={() => setIsModalOpen(false)} />
                <div className={styles.slidePanel}>
                    <div className={styles.slidePanelHeader}>
                        <h3>
                            {selectedMember 
                                ? selectedMember.name 
                                : selectedMemberIds.length > 0 
                                    ? `${selectedMemberIds.length} Anggota Terpilih` 
                                    : "Pencatatan Poin"}
                        </h3>
                        <button className={styles.slidePanelClose} onClick={() => setIsModalOpen(false)}>×</button>
                    </div>
                    <div className={styles.slidePanelBody}>
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

                                {/* Member History inside panel */}
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
                                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)' }}>
                                    <div className={styles.searchBox} style={{ marginTop: 0 }}>
                                        <FaSearch className={styles.searchIcon} />
                                        <input
                                            type="text"
                                            className={styles.searchInput}
                                            placeholder={t.transactions.searchRules}
                                            value={ruleSearch}
                                            onChange={(e) => setRuleSearch(e.target.value)}
                                        />
                                    </div>

                                    {/* Upload Evidence Dropzone */}
                                    <div className={styles.evidenceDropzone}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            style={{ display: 'none' }}
                                        />
                                        {evidence ? (
                                            <div className={styles.dropzonePreview}>
                                                <img src={evidence} alt="Evidence preview" className={styles.previewImage} />
                                                <button 
                                                    className={styles.removeEvidenceBtn}
                                                    onClick={() => setEvidence(null)}
                                                    title="Hapus Bukti"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ) : (
                                            <div className={styles.dropzonePlaceholder} onClick={() => fileInputRef.current?.click()}>
                                                {isCompressing ? (
                                                    <>
                                                        <FaSpinner className={styles.spinIcon} />
                                                        <span>{t.transactions.compressing || "Mengompresi..."}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaCamera className={styles.dropzoneIcon} />
                                                        <span className={styles.dropzoneText}>
                                                            <strong>Ambil Foto Bukti</strong> atau klik untuk unggah berkas
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Smart Recommendations Section */}
                                <div className={styles.recSection}>
                                    <div className={styles.recTitle}>
                                        ⭐ Rekomendasi Aturan Pintar
                                    </div>
                                    <div className={styles.recGrid}>
                                        {getSmartRecommendations().map(r => (
                                            <div
                                                key={`rec-${r.id}`}
                                                className={styles.recCard}
                                                onClick={() => handleRuleSelect(r)}
                                            >
                                                <span className={styles.recDesc}>{r.description}</span>
                                                <span className={`${styles.recPoints} ${r.points > 0 ? styles.pointsPositive : styles.pointsNegative}`}>
                                                    {r.points > 0 ? '+' : ''}{r.points} pts
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className={styles.rulesList} style={{ padding: '0.5rem 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
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
                                        <div className={styles.emptyState}>
                                            <div style={{ marginBottom: rules.length === 0 ? '1rem' : '0' }}>{t.rules.noRules}</div>
                                            {rules.length === 0 && (
                                                <Link href="/dashboard/rules" onClick={() => setIsModalOpen(false)}>
                                                    <Button variant="primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <FaPlus size={12} /> Tambah Aturan
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className={styles.modalFooter} style={{ padding: '1rem 1.5rem 1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)' }}>
                                    <Button variant="secondary" onClick={() => setStep('TYPE')}>← {t.common.back}</Button>
                                    <Button variant="ghost" onClick={() => setIsModalOpen(false)}>{t.common.cancel}</Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

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
