import { createClient } from '@supabase/supabase-js';
import {
    Member, Rule, WarningRule, Transaction, AuditLog, Archive, User, Appeal,
    INITIAL_MEMBERS, INITIAL_RULES, INITIAL_USERS, INITIAL_WARNING_RULES
} from '@/lib/store';

// Initialize Supabase Client (Admin/Server Context)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Fallback to memory/file if no keys (prevents crash during setup)
const isSupabaseConfigured = !!supabaseUrl && !!supabaseKey;

const supabase = isSupabaseConfigured
    ? createClient(supabaseUrl, supabaseKey)
    : null;

export interface StoreData {
    members: Member[];
    rules: Rule[];
    warningRules: WarningRule[];
    transactions: Transaction[];
    auditLogs: AuditLog[];
    archives: Archive[];
    users: User[];
    appeals: Appeal[];
}

const DEFAULT_DATA: StoreData = {
    members: INITIAL_MEMBERS,
    rules: INITIAL_RULES,
    warningRules: INITIAL_WARNING_RULES,
    transactions: [],
    auditLogs: [],
    archives: [],
    users: INITIAL_USERS,
    appeals: [],
};

export const getStoreData = async (): Promise<StoreData> => {
    if (!supabase) {
        console.warn('Supabase not configured. Returning default data.');
        return DEFAULT_DATA;
    }

    try {
        const [
            membersRes,
            rulesRes,
            warningRulesRes,
            transactionsRes,
            auditLogsRes,
            archivesRes,
            usersRes,
            appealsRes
        ] = await Promise.all([
            supabase.from('members').select('*'),
            supabase.from('rules').select('*'),
            supabase.from('warningRules').select('*'),
            supabase.from('transactions').select('*'),
            supabase.from('auditLogs').select('*'),
            supabase.from('archives').select('*'),
            supabase.from('users').select('*'),
            supabase.from('appeals').select('*')
        ]);

        const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;
        const fetchedUsers = usersRes.data || [];
        const validUsers = fetchedUsers.filter((u: any) => USERNAME_REGEX.test(u.username));
        const invalidUsers = fetchedUsers.filter((u: any) => !USERNAME_REGEX.test(u.username));

        if (invalidUsers.length > 0 && supabase) {
            console.log(`Deleting ${invalidUsers.length} invalid users...`);
            await Promise.all(invalidUsers.map((u: any) => supabase!.from('users').delete().eq('id', u.id)));
        }

        return {
            members: membersRes.data || [],
            rules: rulesRes.data || [],
            warningRules: warningRulesRes.data || [],
            transactions: transactionsRes.data || [],
            auditLogs: auditLogsRes.data || [],
            archives: (archivesRes.data || []).map((a: any) => ({
                ...a,
                memberSnapshots: typeof a.memberSnapshots === 'string'
                    ? JSON.parse(a.memberSnapshots)
                    : a.memberSnapshots
            })),
            users: validUsers,
            appeals: appealsRes.data || [],
        };
    } catch (error) {
        console.error('Error fetching data from Supabase:', error);
        return DEFAULT_DATA;
    }
};

export const saveStoreData = async (data: StoreData): Promise<void> => {
    if (!supabase) return;

    // We can't easily "upsert all" efficiently in one go without potential conflicts
    // or massive payload issues.
    // However, for this architecture (Client Syncs State), we accept the overwrite/sync model
    // but try to be smart using upsert.

    // Note: This is "Heavy" for a real production app but fine for the requested scale.
    try {
        await Promise.all([
            supabase.from('members').upsert(data.members),
            supabase.from('rules').upsert(data.rules),
            supabase.from('warningRules').upsert(data.warningRules),
            supabase.from('transactions').upsert(data.transactions),
            supabase.from('auditLogs').upsert(data.auditLogs),
            supabase.from('archives').upsert(data.archives.map(a => ({
                ...a,
                memberSnapshots: a.memberSnapshots // Supabase handles JSONB
            }))),
            supabase.from('users').upsert(data.users),
            supabase.from('appeals').upsert(data.appeals)
        ]);
    } catch (error) {
        console.error('Error saving data to Supabase:', error);
    }
};
