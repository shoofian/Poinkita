'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { INITIAL_MEMBERS, INITIAL_RULES, INITIAL_USERS, Member, Rule, Transaction, User, AuditLog } from '@/lib/store';

interface StoreContextType {
    members: Member[];
    rules: Rule[];
    transactions: Transaction[];
    auditLogs: AuditLog[];
    users: User[];
    currentUser: User | null;
    setCurrentUser: (user: User | null) => void;
    addMember: (member: Member) => void;
    updateMemberPoints: (id: string, points: number) => void;
    deleteMember: (id: string) => void;
    addRule: (rule: Rule) => void;
    deleteRule: (id: string) => void;
    addTransaction: (transaction: Transaction) => void;
    deleteTransaction: (id: string) => void;
    registerUser: (user: User) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
    const [rules, setRules] = useState<Rule[]>(INITIAL_RULES);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [users, setUsers] = useState<User[]>(INITIAL_USERS);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // Load from localStorage on mount
    useEffect(() => {
        const storedMembers = localStorage.getItem('members');
        const storedRules = localStorage.getItem('rules');
        const storedTransactions = localStorage.getItem('transactions');
        const storedAuditLogs = localStorage.getItem('auditLogs');
        const storedUsers = localStorage.getItem('users');
        const storedCurrentUser = localStorage.getItem('currentUser');

        if (storedMembers) setMembers(JSON.parse(storedMembers));
        if (storedRules) setRules(JSON.parse(storedRules));
        if (storedTransactions) setTransactions(JSON.parse(storedTransactions));
        if (storedAuditLogs) setAuditLogs(JSON.parse(storedAuditLogs));
        if (storedUsers) setUsers(JSON.parse(storedUsers));
        if (storedCurrentUser) setCurrentUser(JSON.parse(storedCurrentUser));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Save to localStorage on change
    useEffect(() => { localStorage.setItem('members', JSON.stringify(members)); }, [members]);
    useEffect(() => { localStorage.setItem('rules', JSON.stringify(rules)); }, [rules]);
    useEffect(() => { localStorage.setItem('transactions', JSON.stringify(transactions)); }, [transactions]);
    useEffect(() => { localStorage.setItem('auditLogs', JSON.stringify(auditLogs)); }, [auditLogs]);
    useEffect(() => { localStorage.setItem('users', JSON.stringify(users)); }, [users]);
    useEffect(() => {
        if (currentUser) localStorage.setItem('currentUser', JSON.stringify(currentUser));
        else localStorage.removeItem('currentUser');
    }, [currentUser]);

    const addMember = (member: Member) => setMembers([...members, member]);

    const updateMemberPoints = (id: string, points: number) => {
        setMembers(prev => prev.map(m =>
            m.id === id ? { ...m, totalPoints: m.totalPoints + points } : m
        ));
    };

    const deleteMember = (id: string) => setMembers(prev => prev.filter(m => m.id !== id));

    const addRule = (rule: Rule) => setRules([...rules, rule]);

    const deleteRule = (id: string) => setRules(prev => prev.filter(r => r.id !== id));

    const addTransaction = (transaction: Transaction) => {
        setTransactions(prev => [transaction, ...prev]);
        updateMemberPoints(transaction.memberId, transaction.pointsSnapshot);

        const rule = rules.find(r => r.id === transaction.ruleId);

        // Add Audit Log for Creation
        const log: AuditLog = {
            id: crypto.randomUUID(),
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
        const log: AuditLog = {
            id: crypto.randomUUID(),
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

    const registerUser = (user: User) => {
        setUsers(prev => [...prev, user]);
    };

    return (
        <StoreContext.Provider value={{
            members, rules, transactions, auditLogs, users, currentUser,
            setCurrentUser,
            addMember, updateMemberPoints, deleteMember,
            addRule, deleteRule,
            addTransaction, deleteTransaction,
            registerUser
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
