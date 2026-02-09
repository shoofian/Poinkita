'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/context/StoreContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FaSearch, FaHistory, FaTrash, FaPlus, FaMinus } from 'react-icons/fa';
import { Member, Rule } from '@/lib/store';
import styles from './page.module.css';

export default function TransactionsPage() {
    const { members, rules, transactions, auditLogs, addTransaction, deleteTransaction, currentUser, users } = useStore();
    const { t } = useLanguage();

    const [memberSearch, setMemberSearch] = useState('');
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [step, setStep] = useState<'TYPE' | 'RULE'>('TYPE');
    const [selectedType, setSelectedType] = useState<'ACHIEVEMENT' | 'VIOLATION' | null>(null);
    const [ruleSearch, setRuleSearch] = useState('');

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
        setIsModalOpen(true);
    };

    const handleTypeSelect = (type: 'ACHIEVEMENT' | 'VIOLATION') => {
        setSelectedType(type);
        setStep('RULE');
    };

    const handleRuleSelect = (rule: Rule) => {
        if (!selectedMember || !currentUser) {
            alert("Please login first.");
            return;
        }

        if (confirm(t.transactions.confirm)) {
            addTransaction({
                id: crypto.randomUUID(),
                memberId: selectedMember.id,
                contributorId: currentUser.id,
                ruleId: rule.id,
                timestamp: new Date().toISOString(),
                pointsSnapshot: rule.points
            });
            setIsModalOpen(false);
        }
    };

    const handleDelete = (txId: string) => {
        if (confirm(t.transactions.deleteConfirm)) {
            deleteTransaction(txId);
        }
    };

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
                                <div>
                                    <div className={styles.memberName}>{m.name}</div>
                                    <div className={styles.memberMeta}>{m.id} • {m.division}</div>
                                </div>
                            </div>
                            <div className={`${styles.memberPoints} ${m.totalPoints >= 0 ? styles.pointsPositive : styles.pointsNegative}`}>
                                {m.totalPoints} pts
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
                                        <div className={styles.historyMember}>{member?.name || log.memberId}</div>
                                        <div className={styles.historyTime}>
                                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <div className={styles.historyDesc}>
                                        {log.action === 'DELETE' ? 'Reverted' : log.details}
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
                        </div>
                        <div className={styles.rulesList}>
                            {filteredRules.map(r => (
                                <div
                                    key={r.id}
                                    className={`${styles.ruleItem} ${r.type === 'ACHIEVEMENT' ? styles.ruleItemAchievement : styles.ruleItemViolation}`}
                                    onClick={() => handleRuleSelect(r)}
                                >
                                    <div>
                                        <div className={styles.ruleName}>{r.description}</div>
                                        <div className={styles.ruleCode}>{r.id}</div>
                                    </div>
                                    <div className={`${styles.rulePoints} ${r.points > 0 ? styles.pointsPositive : styles.pointsNegative}`}>
                                        {r.points > 0 ? '+' : ''}{r.points}
                                    </div>
                                </div>
                            ))}
                            {filteredRules.length === 0 && (
                                <div className={styles.emptyState}>No rules found</div>
                            )}
                        </div>
                        <div className={styles.modalFooter}>
                            <Button variant="secondary" onClick={() => setStep('TYPE')}>← Back</Button>
                            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>{t.common.cancel}</Button>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
}
