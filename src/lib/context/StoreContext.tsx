'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { INITIAL_MEMBERS, INITIAL_RULES, INITIAL_USERS, INITIAL_WARNING_RULES, Member, Rule, Transaction, User, AuditLog, Archive, ArchiveMember, WarningRule } from '@/lib/store';

/* eslint-disable react-hooks/set-state-in-effect */

interface StoreContextType {
    members: Member[];
    rules: Rule[];
    warningRules: WarningRule[];
    transactions: Transaction[];
    auditLogs: AuditLog[];
    archives: Archive[];
    users: User[];
    currentUser: User | null;
    setCurrentUser: (user: User | null) => void;
    addMember: (member: Omit<Member, 'adminId'> & { adminId?: string }) => void;
    addMembers: (members: (Omit<Member, 'adminId'> & { adminId?: string })[]) => void;
    updateMemberPoints: (id: string, points: number) => void;
    deleteMember: (id: string) => void;
    deleteMembers: (ids: string[]) => void;
    addRule: (rule: Omit<Rule, 'adminId'> & { adminId?: string }) => void;
    addRules: (rules: (Omit<Rule, 'adminId'> & { adminId?: string })[]) => void;
    deleteRule: (id: string) => void;
    addWarningRule: (rule: Omit<WarningRule, 'adminId'> & { adminId?: string }) => void;
    updateWarningRule: (id: string, updates: Partial<WarningRule>) => void;
    deleteWarningRule: (id: string) => void;
    addTransaction: (transaction: Omit<Transaction, 'adminId'> & { adminId?: string }) => void;
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
    lookupMemberPublic: (id: string, division: string) => Member | null;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// Default Admin used for public registrations or as a fallback
const DEFAULT_ADMIN_ID = 'USR-20260210-001';

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
    const [rules, setRules] = useState<Rule[]>(INITIAL_RULES);
    const [warningRules, setWarningRules] = useState<WarningRule[]>(INITIAL_WARNING_RULES);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [archives, setArchives] = useState<Archive[]>([]);
    const [users, setUsers] = useState<User[]>(INITIAL_USERS);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const loadStore = () => {
            try {
                const storedMembers = localStorage.getItem('members');
                const storedRules = localStorage.getItem('rules');
                const storedWarningRules = localStorage.getItem('warningRules');
                const storedTransactions = localStorage.getItem('transactions');
                const storedAuditLogs = localStorage.getItem('auditLogs');
                const storedArchives = localStorage.getItem('archives');
                const storedUsers = localStorage.getItem('users');
                const storedCurrentUser = localStorage.getItem('currentUser');

                // Helper to safely parse and validate array
                const parseSafe = (stored: string | null) => {
                    if (!stored) return null;
                    const parsed = JSON.parse(stored);
                    return Array.isArray(parsed) ? parsed : null;
                };

                const membersData = parseSafe(storedMembers);
                const rulesData = parseSafe(storedRules);
                const warningRulesData = parseSafe(storedWarningRules);
                const transactionsData = parseSafe(storedTransactions);
                const auditLogsData = parseSafe(storedAuditLogs);
                const archivesData = parseSafe(storedArchives);
                const usersData = parseSafe(storedUsers);

                if (membersData) setMembers(membersData);
                if (rulesData) setRules(rulesData);
                if (warningRulesData) setWarningRules(warningRulesData);
                if (transactionsData) setTransactions(transactionsData);
                if (auditLogsData) setAuditLogs(auditLogsData);
                if (archivesData) setArchives(archivesData);

                if (usersData) {
                    const merged = usersData.map(user => {
                        const defaultUser = INITIAL_USERS.find(iu => iu.id === user.id || iu.username === user.username);
                        if (defaultUser) {
                            return { ...defaultUser, ...user, adminId: user.adminId || defaultUser.adminId, role: user.role || defaultUser.role };
                        }
                        return user;
                    });
                    setUsers(merged);
                }

                if (storedCurrentUser) {
                    const parsed = JSON.parse(storedCurrentUser);
                    if (parsed && typeof parsed === 'object') {
                        let migratedUser = parsed;
                        const defaultUser = INITIAL_USERS.find(iu => iu.username === parsed.username);
                        if (defaultUser) {
                            migratedUser = { ...defaultUser, ...parsed, id: defaultUser.id, adminId: parsed.adminId || defaultUser.adminId };
                        }
                        setCurrentUser(migratedUser);
                    }
                }

                // Data Consistency & "Query" normalization
                setMembers(prev => prev.map(m => ({ ...m, adminId: m.adminId || DEFAULT_ADMIN_ID })));
                setRules(prev => prev.map(r => ({ ...r, adminId: r.adminId || DEFAULT_ADMIN_ID })));
                setWarningRules(prev => prev.map(r => ({ ...r, adminId: r.adminId || DEFAULT_ADMIN_ID })));
                setArchives(prev => prev.map(a => ({ ...a, adminId: a.adminId || DEFAULT_ADMIN_ID })));

            } catch (error) {
                console.error('Failed to load store:', error);
            } finally {
                setIsLoaded(true);
            }
        };

        loadStore();
    }, []);

    const effectiveAdminId = currentUser?.role === 'ADMIN' ? currentUser.id : currentUser?.adminId;

    // Derived "Queries"
    const filteredMembers = members.filter(m => m.adminId === effectiveAdminId);
    const filteredRules = rules.filter(r => r.adminId === effectiveAdminId);
    const filteredWarningRules = warningRules.filter(r => r.adminId === effectiveAdminId);
    const filteredTransactions = transactions.filter(t => t.adminId === effectiveAdminId);
    const filteredAuditLogs = auditLogs.filter(l => l.adminId === effectiveAdminId);
    const filteredArchives = archives.filter(a => a.adminId === effectiveAdminId);
    const filteredUsers = currentUser
        ? (currentUser.role === 'ADMIN'
            ? users.filter(u => u.id === currentUser.id || u.adminId === currentUser.id)
            : users.filter(u => u.id === currentUser.id))
        : users;

    // Persistence Effect
    useEffect(() => {
        if (!isLoaded) return;
        const state = { members, rules, warningRules, transactions, auditLogs, archives, users, currentUser };
        Object.entries(state).forEach(([key, value]) => {
            if (key === 'currentUser') {
                if (value) localStorage.setItem(key, JSON.stringify(value));
                else localStorage.removeItem(key);
            } else {
                localStorage.setItem(key, JSON.stringify(value));
            }
        });
    }, [members, rules, warningRules, transactions, auditLogs, archives, users, currentUser, isLoaded]);

    const generateId = (prefix: 'USR' | 'MEM' | 'RUL' | 'TX' | 'ACT' | 'ARC' | 'WRN', type?: 'ACH' | 'VIO'): string => {
        const date = new Date();
        const yyyymmdd = date.getFullYear().toString() +
            (date.getMonth() + 1).toString().padStart(2, '0') +
            date.getDate().toString().padStart(2, '0');

        let targetList: { id: string }[] = [];
        switch (prefix) {
            case 'USR': targetList = users; break;
            case 'MEM': targetList = members; break;
            case 'RUL': targetList = rules; break;
            case 'WRN': targetList = warningRules; break;
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
                const seqStr = parts[parts.length - 1];
                return parseInt(seqStr, 10);
            }).filter(s => !isNaN(s));
            if (seqs.length > 0) {
                nextSeq = Math.max(...seqs) + 1;
            }
        }

        return `${prefixWithDate}${nextSeq.toString().padStart(3, '0')}`;
    };

    const addMember = (member: Omit<Member, 'adminId'> & { adminId?: string }) => {
        const adminId = effectiveAdminId || DEFAULT_ADMIN_ID;
        setMembers(prev => [...prev, { ...member, adminId }]);
    };

    const addMembers = (newMembers: (Omit<Member, 'adminId'> & { adminId?: string })[]) => {
        const adminId = effectiveAdminId || DEFAULT_ADMIN_ID;
        const membersWithAdmin = newMembers.map(m => ({ ...m, adminId: m.adminId || adminId }));
        setMembers(prev => [...prev, ...membersWithAdmin]);
    };

    const updateMemberPoints = (id: string, points: number) => {
        setMembers(prev => prev.map(m =>
            m.id === id ? { ...m, totalPoints: m.totalPoints + points } : m
        ));
    };

    const deleteMember = (id: string) => setMembers(prev => prev.filter(m => m.id !== id));

    const deleteMembers = (ids: string[]) => setMembers(prev => prev.filter(m => !ids.includes(m.id)));

    const addRule = (rule: Omit<Rule, 'adminId'> & { adminId?: string }) => {
        const adminId = effectiveAdminId || DEFAULT_ADMIN_ID;
        setRules(prev => [...prev, { ...rule, adminId }]);
    };

    const addRules = (newRules: (Omit<Rule, 'adminId'> & { adminId?: string })[]) => {
        const adminId = effectiveAdminId || DEFAULT_ADMIN_ID;
        const rulesWithAdmin = newRules.map(r => ({ ...r, adminId: r.adminId || adminId }));
        setRules(prev => [...prev, ...rulesWithAdmin]);
    };

    const deleteRule = (id: string) => setRules(prev => prev.filter(r => r.id !== id));

    const addWarningRule = (rule: Omit<WarningRule, 'adminId'> & { adminId?: string }) => {
        const adminId = effectiveAdminId || DEFAULT_ADMIN_ID;
        setWarningRules(prev => [...prev, { ...rule, adminId }]);
    };

    const updateWarningRule = (id: string, updates: Partial<WarningRule>) => {
        setWarningRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    };

    const deleteWarningRule = (id: string) => setWarningRules(prev => prev.filter(r => r.id !== id));

    const addTransaction = (transaction: Omit<Transaction, 'adminId'> & { adminId?: string }) => {
        const adminId = effectiveAdminId || DEFAULT_ADMIN_ID;
        const transactionWithAdmin = { ...transaction, adminId };
        setTransactions(prev => [transactionWithAdmin, ...prev]);
        updateMemberPoints(transaction.memberId, transaction.pointsSnapshot);

        const rule = rules.find(r => r.id === transaction.ruleId);

        const nextLogId = generateId('ACT', rule?.type === 'ACHIEVEMENT' ? 'ACH' : 'VIO');
        const log: AuditLog = {
            id: nextLogId,
            timestamp: transaction.timestamp,
            action: 'CREATE',
            memberId: transaction.memberId,
            contributorId: transaction.contributorId,
            details: rule ? rule.description : 'Unknown Rule',
            points: transaction.pointsSnapshot,
            adminId
        };
        setAuditLogs(prev => [log, ...prev]);
    };

    const deleteTransaction = (id: string) => {
        const transaction = transactions.find(t => t.id === id);
        if (!transaction) return;

        const pointValue = transaction.pointsSnapshot;
        updateMemberPoints(transaction.memberId, -pointValue);

        const nextLogId = generateId('ACT', pointValue > 0 ? 'VIO' : 'ACH');
        const log: AuditLog = {
            id: nextLogId,
            timestamp: new Date().toISOString(),
            action: 'DELETE',
            memberId: transaction.memberId,
            contributorId: currentUser ? currentUser.id : 'unknown',
            details: `Deleted transaction: ${id}`,
            points: -pointValue,
            adminId: transaction.adminId
        };
        setAuditLogs(prev => [log, ...prev]);
        setTransactions(prev => prev.filter(t => t.id !== id));
    };

    const addAuditLogs = (newLogs: AuditLog[]) => {
        const adminId = effectiveAdminId || DEFAULT_ADMIN_ID;
        const logsWithAdmin = newLogs.map(l => ({ ...l, adminId: l.adminId || adminId }));
        setAuditLogs(prev => [...logsWithAdmin, ...prev]);
    };

    const createArchive = (title: string) => {
        const id = generateId('ARC');
        const timestamp = new Date().toISOString();
        const snapshotsWithAdmin = members.map(m => ({
            id: m.id,
            name: m.name,
            division: m.division,
            points: m.totalPoints
        }));

        const adminId = effectiveAdminId || DEFAULT_ADMIN_ID;
        setArchives(prev => [{ id, title, timestamp, memberSnapshots: snapshotsWithAdmin, adminId }, ...prev]);
    };

    const deleteArchive = (id: string) => {
        setArchives(prev => prev.filter(a => a.id !== id));
    };

    const registerUser = (user: User) => {
        const newUser = { ...user };
        if (currentUser?.role === 'ADMIN') {
            newUser.adminId = currentUser.id;
        } else if (!newUser.adminId) {
            newUser.adminId = DEFAULT_ADMIN_ID;
        }
        setUsers(prev => [...prev, newUser]);
    };

    const registerUsers = (newUsers: User[]) => {
        const adminId = currentUser?.role === 'ADMIN' ? currentUser.id : DEFAULT_ADMIN_ID;
        const usersWithAdmin = newUsers.map(u => ({ ...u, adminId: u.adminId || adminId }));
        setUsers(prev => [...prev, ...usersWithAdmin]);
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

    const lookupMemberPublic = (id: string, division: string): Member | null => {
        const searchId = id.trim().toLowerCase();
        const searchDivision = division.trim().toLowerCase();
        return members.find(m =>
            m.id.toLowerCase() === searchId &&
            m.division.toLowerCase() === searchDivision
        ) || null;
    };

    return (
        <StoreContext.Provider value={{
            members: filteredMembers,
            rules: filteredRules,
            warningRules: filteredWarningRules,
            transactions: filteredTransactions,
            auditLogs: filteredAuditLogs,
            archives: filteredArchives,
            users: filteredUsers,
            currentUser,
            setCurrentUser,
            addMember, addMembers, updateMemberPoints, deleteMember, deleteMembers,
            addRule, addRules, deleteRule, addWarningRule, updateWarningRule, deleteWarningRule,
            addTransaction, deleteTransaction,
            addAuditLogs, createArchive, deleteArchive,
            registerUser, registerUsers, updateUser, deleteUser, updateMembers, generateId, lookupMemberPublic
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
