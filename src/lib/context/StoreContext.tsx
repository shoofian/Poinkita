'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { INITIAL_MEMBERS, INITIAL_RULES, INITIAL_USERS, Member, Rule, Transaction, User, AuditLog, Archive, ArchiveMember } from '@/lib/store';

/* eslint-disable react-hooks/set-state-in-effect */

interface StoreContextType {
    members: Member[];
    rules: Rule[];
    transactions: Transaction[];
    auditLogs: AuditLog[];
    archives: Archive[];
    users: User[];
    currentUser: User | null;
    setCurrentUser: (user: User | null) => void;
    addMember: (member: Member) => void;
    addMembers: (members: Member[]) => void;
    updateMemberPoints: (id: string, points: number) => void;
    deleteMember: (id: string) => void;
    deleteMembers: (ids: string[]) => void;
    addRule: (rule: Rule) => void;
    deleteRule: (id: string) => void;
    addTransaction: (transaction: Transaction) => void;
    deleteTransaction: (id: string) => void;
    addAuditLogs: (logs: AuditLog[]) => void;
    createArchive: (title: string) => void;
    deleteArchive: (id: string) => void;
    registerUser: (user: User) => void;
    registerUsers: (users: User[]) => void;
    updateUser: (id: string, updates: Partial<User>) => void;
    deleteUser: (id: string) => void;
    updateMembers: (ids: string[], updates: Partial<Member>) => void;
    generateId: (prefix: 'USR' | 'MEM' | 'RUL' | 'TX' | 'ACT' | 'ARC', type?: 'ACH' | 'VIO') => string;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
    const [rules, setRules] = useState<Rule[]>(INITIAL_RULES);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [archives, setArchives] = useState<Archive[]>([]);
    const [users, setUsers] = useState<User[]>(INITIAL_USERS);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const storedMembers = localStorage.getItem('members');
            const storedRules = localStorage.getItem('rules');
            const storedTransactions = localStorage.getItem('transactions');
            const storedAuditLogs = localStorage.getItem('auditLogs');
            const storedArchives = localStorage.getItem('archives');
            const storedUsers = localStorage.getItem('users');
            const storedCurrentUser = localStorage.getItem('currentUser');

            if (storedMembers) {
                const parsed = JSON.parse(storedMembers);
                if (Array.isArray(parsed)) setMembers(parsed);
            }
            if (storedRules) {
                const parsed = JSON.parse(storedRules);
                if (Array.isArray(parsed)) setRules(parsed);
            }
            if (storedTransactions) {
                const parsed = JSON.parse(storedTransactions);
                if (Array.isArray(parsed)) setTransactions(parsed);
            }
            if (storedAuditLogs) {
                const parsed = JSON.parse(storedAuditLogs);
                if (Array.isArray(parsed)) setAuditLogs(parsed);
            }
            if (storedArchives) {
                const parsed = JSON.parse(storedArchives);
                if (Array.isArray(parsed)) setArchives(parsed);
            }
            if (storedUsers) {
                const parsed = JSON.parse(storedUsers);
                if (Array.isArray(parsed)) {
                    // Merge with INITIAL_USERS to restore passwords for default accounts
                    const merged = parsed.map(user => {
                        const defaultUser = INITIAL_USERS.find(iu => iu.id === user.id || iu.username === user.username);
                        if (defaultUser && !user.password) {
                            return { ...user, password: defaultUser.password };
                        }
                        return user;
                    });
                    setUsers(merged);
                }
            }
            if (storedCurrentUser) {
                const parsed = JSON.parse(storedCurrentUser);
                if (parsed && typeof parsed === 'object') {
                    // Migration: if it's a legacy ID (like 'u1'), map to new ID format from INITIAL_USERS
                    let migratedUser = parsed;
                    const defaultUser = INITIAL_USERS.find(iu => iu.username === parsed.username);
                    if (defaultUser && parsed.id !== defaultUser.id) {
                        migratedUser = { ...parsed, id: defaultUser.id };
                    }

                    // Also merge password for the current user if it's a default account
                    if (defaultUser && !migratedUser.password) {
                        setCurrentUser({ ...migratedUser, password: defaultUser.password });
                    } else {
                        setCurrentUser(migratedUser);
                    }
                }
            }

            // Post-load ID Migration for Consistency
            // If we have legacy user IDs (u1, etc.) in transactions or audit logs,
            // we should map them to the new IDs if the username is known.
            setUsers(currentUsers => {
                const migratedUsers = currentUsers.map(u => {
                    const defaultUser = INITIAL_USERS.find(iu => iu.username === u.username);
                    return defaultUser && u.id !== defaultUser.id ? { ...u, id: defaultUser.id } : u;
                });

                // Update transactions and audit logs to match new IDs
                setTransactions(prevTx => prevTx.map(tx => {
                    const user = migratedUsers.find(u => u.id === tx.contributorId) ||
                        INITIAL_USERS.find(iu => iu.id === tx.contributorId || iu.username === tx.contributorId); // Fallback for 'admin' as ID
                    return user ? { ...tx, contributorId: user.id } : tx;
                }));

                setAuditLogs(prevLogs => prevLogs.map(log => {
                    const user = migratedUsers.find(u => u.id === log.contributorId) ||
                        INITIAL_USERS.find(iu => iu.id === log.contributorId || iu.username === log.contributorId);
                    return user ? { ...log, contributorId: user.id } : log;
                }));

                return migratedUsers;
            });

            setIsLoaded(true);
        } catch (error) {
            console.error('Failed to load storage:', error);
            setIsLoaded(true); // Still set to true so we can save new data if load fails
        }
    }, []); // Only on mount to restore stale data once

    // Save to localStorage on change - GUARDED BY isLoaded
    useEffect(() => { if (isLoaded) localStorage.setItem('members', JSON.stringify(members)); }, [members, isLoaded]);
    useEffect(() => { if (isLoaded) localStorage.setItem('rules', JSON.stringify(rules)); }, [rules, isLoaded]);
    useEffect(() => { if (isLoaded) localStorage.setItem('transactions', JSON.stringify(transactions)); }, [transactions, isLoaded]);
    useEffect(() => { if (isLoaded) localStorage.setItem('auditLogs', JSON.stringify(auditLogs)); }, [auditLogs, isLoaded]);
    useEffect(() => { if (isLoaded) localStorage.setItem('archives', JSON.stringify(archives)); }, [archives, isLoaded]);
    useEffect(() => { if (isLoaded) localStorage.setItem('users', JSON.stringify(users)); }, [users, isLoaded]);
    useEffect(() => {
        if (!isLoaded) return;
        if (currentUser) localStorage.setItem('currentUser', JSON.stringify(currentUser));
        else localStorage.removeItem('currentUser');
    }, [currentUser, isLoaded]);

    const generateId = (prefix: 'USR' | 'MEM' | 'RUL' | 'TX' | 'ACT' | 'ARC', type?: 'ACH' | 'VIO'): string => {
        const date = new Date();
        const yyyymmdd = date.getFullYear().toString() +
            (date.getMonth() + 1).toString().padStart(2, '0') +
            date.getDate().toString().padStart(2, '0');

        let targetList: { id: string }[] = [];
        switch (prefix) {
            case 'USR': targetList = users; break;
            case 'MEM': targetList = members; break;
            case 'RUL': targetList = rules; break;
            case 'TX': targetList = transactions; break;
            case 'ACT': targetList = auditLogs; break;
            case 'ARC': targetList = archives; break;
        }

        const typeCode = type ? `${type}-` : '';
        const prefixWithDate = `${prefix}-${typeCode}${yyyymmdd}-`;
        const relevantIds = targetList
            .map(item => item.id)
            .filter(id => id.startsWith(prefixWithDate));

        let nextSeq = 1;
        if (relevantIds.length > 0) {
            const seqs = relevantIds.map(id => {
                const parts = id.split('-');
                return parseInt(parts[parts.length - 1], 10);
            }).filter(s => !isNaN(s));
            if (seqs.length > 0) {
                nextSeq = Math.max(...seqs) + 1;
            }
        }

        return `${prefixWithDate}${nextSeq.toString().padStart(3, '0')}`;
    };

    const addMember = (member: Member) => setMembers([...members, member]);

    const addMembers = (newMembers: Member[]) => setMembers(prev => [...prev, ...newMembers]);

    const updateMemberPoints = (id: string, points: number) => {
        setMembers(prev => prev.map(m =>
            m.id === id ? { ...m, totalPoints: m.totalPoints + points } : m
        ));
    };

    const deleteMember = (id: string) => setMembers(prev => prev.filter(m => m.id !== id));

    const deleteMembers = (ids: string[]) => setMembers(prev => prev.filter(m => !ids.includes(m.id)));

    const addRule = (rule: Rule) => setRules([...rules, rule]);

    const deleteRule = (id: string) => setRules(prev => prev.filter(r => r.id !== id));

    const addTransaction = (transaction: Transaction) => {
        setTransactions(prev => [transaction, ...prev]);
        updateMemberPoints(transaction.memberId, transaction.pointsSnapshot);

        const rule = rules.find(r => r.id === transaction.ruleId);

        // Add Audit Log for Creation
        const nextLogId = generateId('ACT', rule?.type === 'ACHIEVEMENT' ? 'ACH' : 'VIO');
        const log: AuditLog = {
            id: nextLogId,
            timestamp: transaction.timestamp,
            action: 'CREATE',
            memberId: transaction.memberId,
            contributorId: transaction.contributorId,
            details: rule ? rule.description : 'Unknown Rule',
            points: transaction.pointsSnapshot
        };
        setAuditLogs(prev => [log, ...prev]);
    };

    const deleteTransaction = (id: string) => {
        const transaction = transactions.find(t => t.id === id);
        if (!transaction) return;

        const pointValue = transaction.pointsSnapshot;

        // Revert points
        updateMemberPoints(transaction.memberId, -pointValue);

        // Add Audit Log for Deletion
        const nextLogId = generateId('ACT', pointValue > 0 ? 'VIO' : 'ACH'); // Reversion: if positive points deleted, it's a VIO (reduction)
        const log: AuditLog = {
            id: nextLogId,
            timestamp: new Date().toISOString(),
            action: 'DELETE',
            memberId: transaction.memberId,
            contributorId: currentUser ? currentUser.id : 'unknown',
            details: `Deleted transaction: ${id}`,
            points: -pointValue // Inverse of original to show reversion
        };
        setAuditLogs(prev => [log, ...prev]);

        // Remove from active transactions
        setTransactions(prev => prev.filter(t => t.id !== id));
    };

    const addAuditLogs = (newLogs: AuditLog[]) => setAuditLogs(prev => [...newLogs, ...prev]);

    const createArchive = (title: string) => {
        const id = generateId('ARC');
        const timestamp = new Date().toISOString();
        const memberSnapshots: ArchiveMember[] = members.map(m => ({
            id: m.id,
            name: m.name,
            division: m.division,
            points: m.totalPoints
        }));

        setArchives(prev => [{ id, title, timestamp, memberSnapshots }, ...prev]);
    };

    const deleteArchive = (id: string) => {
        setArchives(prev => prev.filter(a => a.id !== id));
    };

    const registerUser = (user: User) => {
        setUsers(prev => [...prev, user]);
    };

    const registerUsers = (newUsers: User[]) => {
        setUsers(prev => [...prev, ...newUsers]);
    };

    const updateUser = (id: string, updates: Partial<User>) => {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
        if (currentUser?.id === id) {
            setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
        }
    };

    const deleteUser = (id: string) => {
        setUsers(prev => prev.filter(u => u.id !== id));
    };

    const updateMembers = (ids: string[], updates: Partial<Member>) => {
        setMembers(prev => prev.map(m => ids.includes(m.id) ? { ...m, ...updates } : m));
    };

    return (
        <StoreContext.Provider value={{
            members, rules, transactions, auditLogs, archives, users, currentUser,
            setCurrentUser,
            addMember, addMembers, updateMemberPoints, deleteMember, deleteMembers,
            addRule, deleteRule,
            addTransaction, deleteTransaction,
            addAuditLogs, createArchive, deleteArchive,
            registerUser, registerUsers, updateUser, deleteUser, updateMembers, generateId
        }}>
            {children}
        </StoreContext.Provider>
    );
};

export const useStore = () => {
    const context = useContext(StoreContext);
    if (context === undefined) {
        throw new Error('useStore must be used within a StoreProvider');
    }
    return context;
};
