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
    isLoaded: boolean;
    setCurrentUser: (user: User | null) => void;
    loginUser: (username: string, password: string) => { success: boolean; error?: string; user?: User };
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
    generateId: (prefix: 'USR' | 'MEM' | 'RUL' | 'TX' | 'ACT' | 'ARC' | 'WRN', type?: 'ACH' | 'VIO') => string;
    lookupMemberPublic: (id: string, division: string) => Member | null;
    lookupUser: (id: string) => User | undefined;
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

    // Load from Server (API) on mount
    useEffect(() => {
        const loadStore = async () => {
            try {
                // 1. Fetch data from Server ID
                const response = await fetch('/api/data');
                if (!response.ok) throw new Error('Failed to fetch data');
                const serverData: {
                    members: Member[], rules: Rule[], warningRules: WarningRule[],
                    transactions: Transaction[], auditLogs: AuditLog[], archives: Archive[], users: User[]
                } = await response.json();

                // 2. Check LocalStorage for migration/session
                const storedCurrentUser = localStorage.getItem('currentUser');
                const storedMembers = localStorage.getItem('members');
                const storedTransactions = localStorage.getItem('transactions');

                // Helper to check if we should migrate: 
                // If Server has no transactions but LocalStorage does, likely we need to push LocalStorage to Server.
                // Or if Server members are just default but LocalStorage has more.
                let dataToUse = serverData;
                let shoudMigrate = false;

                // Simple heuristic: If server transactions are empty AND local transactions exist, use local and push.
                if (serverData.transactions.length === 0 && storedTransactions) {
                    const localTx = JSON.parse(storedTransactions);
                    if (Array.isArray(localTx) && localTx.length > 0) {
                        shoudMigrate = true;
                    }
                }

                if (shoudMigrate) {
                    console.log('Migrating LocalStorage to Server...');
                    const parse = (key: string) => {
                        const item = localStorage.getItem(key);
                        return item ? JSON.parse(item) : undefined;
                    };

                    dataToUse = {
                        members: parse('members') || serverData.members,
                        rules: parse('rules') || serverData.rules,
                        warningRules: parse('warningRules') || serverData.warningRules,
                        transactions: parse('transactions') || serverData.transactions,
                        auditLogs: parse('auditLogs') || serverData.auditLogs,
                        archives: parse('archives') || serverData.archives,
                        users: parse('users') || serverData.users,
                    };

                    // Push to server immediately
                    await fetch('/api/data', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(dataToUse),
                    });
                }

                setMembers(dataToUse.members || []);
                setRules(dataToUse.rules || []);
                setWarningRules(dataToUse.warningRules || []);
                setTransactions(dataToUse.transactions || []);
                setAuditLogs(dataToUse.auditLogs || []);
                setArchives(dataToUse.archives || []);
                setUsers(dataToUse.users || []);

                // Load User Session (Local only)
                if (storedCurrentUser) {
                    const parsed = JSON.parse(storedCurrentUser);
                    if (parsed && typeof parsed === 'object') {
                        let migratedUser = parsed;
                        // Ensure user exists in the (now global) user list, otherwise might be stale session
                        // But for now trust local session or re-validate against loaded users?
                        // Let's just restore it.
                        setCurrentUser(migratedUser);
                    }
                }

            } catch (error) {
                console.error('Failed to load store from API:', error);
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
        ? users.filter(u => u.id === effectiveAdminId || u.adminId === effectiveAdminId)
        : users;

    // Persistence Effect (Sync to Server)
    useEffect(() => {
        if (!isLoaded) return;

        // Persist Session Locally
        if (currentUser) {
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        } else {
            localStorage.removeItem('currentUser');
        }

        // Persist Data Globally (Debounce or just push)
        const saveData = async () => {
            try {
                await fetch('/api/data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        members,
                        rules,
                        warningRules,
                        transactions,
                        auditLogs,
                        archives,
                        users
                    })
                });
            } catch (err) {
                console.error('Failed to sync to server', err);
            }
        };

        // Simple debounce could be added here if needed, but for now direct sync
        const timeout = setTimeout(saveData, 500); // 500ms debounce
        return () => clearTimeout(timeout);

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

    const lookupUser = (id: string): User | undefined => {
        return users.find(u => u.id === id);
    };

    // Login function that validates against the FULL (unfiltered) user list
    const loginUser = (username: string, password: string): { success: boolean; error?: string; user?: User } => {
        if (!isLoaded) {
            return { success: false, error: 'DATA_NOT_LOADED' };
        }

        const normalizedUsername = username.trim().toLowerCase();
        // Search in the FULL users array, not the filtered one
        const user = users.find(u => u.username.toLowerCase() === normalizedUsername);

        if (user && user.password === password) {
            setCurrentUser(user);
            return { success: true, user };
        }

        return { success: false, error: 'INVALID_CREDENTIALS' };
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
            isLoaded,
            setCurrentUser,
            loginUser,
            addMember, addMembers, updateMemberPoints, deleteMember, deleteMembers,
            addRule, addRules, deleteRule, addWarningRule, updateWarningRule, deleteWarningRule,
            addTransaction, deleteTransaction,
            addAuditLogs, createArchive, deleteArchive,
            registerUser, registerUsers, updateUser, deleteUser, updateMembers, generateId,
            lookupMemberPublic, lookupUser
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
