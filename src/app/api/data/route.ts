import { NextResponse } from 'next/server';
import { getStoreData, saveStoreData, StoreData } from '@/lib/server/db';
import { INITIAL_MEMBERS, INITIAL_RULES, INITIAL_USERS, INITIAL_WARNING_RULES } from '@/lib/store';
// Username must be lowercase letters, numbers, or underscore, 3-20 characters
const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

// ---------- Validation Helpers ----------
function isNonEmptyString(value: any): boolean {
    return typeof value === 'string' && value.trim().length > 0;
}
function isNumber(value: any): boolean {
    return typeof value === 'number' && !Number.isNaN(value);
}
function isValidISODate(value: any): boolean {
    return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}
function isValidHexColor(value: any): boolean {
    return typeof value === 'string' && /^#([0-9A-Fa-f]{3}){1,2}$/.test(value);
}
function validateMembers(members: any[]): string | null {
    for (const m of members) {
        if (!isNonEmptyString(m.id) || !isNonEmptyString(m.name) || !isNonEmptyString(m.division) || !isNumber(m.totalPoints) || !isNonEmptyString(m.adminId)) {
            return 'Invalid member object';
        }
    }
    return null;
}
function validateRules(rules: any[]): string | null {
    const validTypes = ['ACHIEVEMENT', 'VIOLATION'];
    for (const r of rules) {
        if (!isNonEmptyString(r.id) || !isNonEmptyString(r.description) || !validTypes.includes(r.type) || !isNumber(r.points) || !isNonEmptyString(r.adminId)) {
            return 'Invalid rule object';
        }
    }
    return null;
}
function validateWarningRules(warnings: any[]): string | null {
    for (const w of warnings) {
        if (!isNonEmptyString(w.id) || !isNonEmptyString(w.name) || !isNumber(w.threshold) || !isNonEmptyString(w.message) || !isNonEmptyString(w.action) || !isValidHexColor(w.textColor) || !isValidHexColor(w.backgroundColor) || !isNonEmptyString(w.adminId)) {
            return 'Invalid warning rule object';
        }
    }
    return null;
}
function validateTransactions(transactions: any[]): string | null {
    for (const t of transactions) {
        if (!isNonEmptyString(t.id) || !isNonEmptyString(t.memberId) || !isNonEmptyString(t.contributorId) || !isNonEmptyString(t.ruleId) || !isValidISODate(t.timestamp) || !isNumber(t.pointsSnapshot) || !isNonEmptyString(t.adminId)) {
            return 'Invalid transaction object';
        }
    }
    return null;
}
function validateAuditLogs(logs: any[]): string | null {
    const validActions = ['CREATE', 'DELETE', 'UPDATE'];
    for (const a of logs) {
        if (!isNonEmptyString(a.id) || !isValidISODate(a.timestamp) || !validActions.includes(a.action) || !isNonEmptyString(a.memberId) || !isNonEmptyString(a.contributorId) || !isNonEmptyString(a.details) || !isNumber(a.points) || !isNonEmptyString(a.adminId)) {
            return 'Invalid audit log object';
        }
    }
    return null;
}
function validateArchives(archives: any[]): string | null {
    for (const ar of archives) {
        if (!isNonEmptyString(ar.id) || !isNonEmptyString(ar.title) || !isValidISODate(ar.timestamp) || !Array.isArray(ar.memberSnapshots) || !isNonEmptyString(ar.adminId)) {
            return 'Invalid archive object';
        }
        for (const ms of ar.memberSnapshots) {
            if (!isNonEmptyString(ms.id) || !isNonEmptyString(ms.name) || !isNonEmptyString(ms.division) || !isNumber(ms.points)) {
                return 'Invalid archive member snapshot';
            }
        }
    }
    return null;
}
function validateAppeals(appeals: any[]): string | null {
    const validStatus = ['PENDING', 'APPROVED', 'REJECTED'];
    for (const ap of appeals) {
        if (!isNonEmptyString(ap.id) || !isNonEmptyString(ap.transactionId) || !isNonEmptyString(ap.memberId) || !isNonEmptyString(ap.reason) || !validStatus.includes(ap.status) || !isValidISODate(ap.timestamp) || !isNonEmptyString(ap.adminId)) {
            return 'Invalid appeal object';
        }
    }
    return null;
}
function validateUsers(users: any[]): string | null {
    const validRoles = ['ADMIN', 'CONTRIBUTOR'];
    for (const u of users) {
        if (!isNonEmptyString(u.id)) return `User missing valid 'id'`;
        if (!isNonEmptyString(u.name)) return `User '${u.id}' missing valid 'name'`;
        if (!USERNAME_REGEX.test(u.username)) return `Username '${u.username}' is invalid. Use only lowercase letters, numbers, and '_' (3-20 chars).`;
        if (!validRoles.includes(u.role)) return `User '${u.username}' has invalid role '${u.role}'`;
        // ADMIN must have adminId = their own id (self-reference). CONTRIBUTOR must have adminId pointing to their admin.
        if (!isNonEmptyString(u.adminId)) return `User '${u.username}' is missing 'adminId'`;
    }
    return null;
}
// ------------------------------------

export async function GET() {
    try {
        const storeData = await getStoreData();
        return NextResponse.json(storeData);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body: Partial<StoreData> = await req.json();

        // Validate users (id, name, username, role, adminId)
        const userError = body.users ? validateUsers(body.users) : null;
        if (userError) {
            return NextResponse.json({ error: userError }, { status: 400 });
        }

        // Validate other entities
        const memberError = body.members ? validateMembers(body.members) : null;
        if (memberError) {
            return NextResponse.json({ error: memberError }, { status: 400 });
        }
        const ruleError = body.rules ? validateRules(body.rules) : null;
        if (ruleError) {
            return NextResponse.json({ error: ruleError }, { status: 400 });
        }
        const warningError = body.warningRules ? validateWarningRules(body.warningRules) : null;
        if (warningError) {
            return NextResponse.json({ error: warningError }, { status: 400 });
        }
        const transactionError = body.transactions ? validateTransactions(body.transactions) : null;
        if (transactionError) {
            return NextResponse.json({ error: transactionError }, { status: 400 });
        }
        const auditLogError = body.auditLogs ? validateAuditLogs(body.auditLogs) : null;
        if (auditLogError) {
            return NextResponse.json({ error: auditLogError }, { status: 400 });
        }
        const archiveError = body.archives ? validateArchives(body.archives) : null;
        if (archiveError) {
            return NextResponse.json({ error: archiveError }, { status: 400 });
        }
        const appealError = body.appeals ? validateAppeals(body.appeals) : null;
        if (appealError) {
            return NextResponse.json({ error: appealError }, { status: 400 });
        }
        const currentData = await getStoreData();

        // Merge logic: prefer body (client update) over server (current)
        // But since client sends *full* state snapshot for changed entities, we can trust body.
        // However, if body is partial (e.g. only updated member), merging is crucial.

        const newData: StoreData = {
            members: body.members || currentData.members || INITIAL_MEMBERS,
            rules: body.rules || currentData.rules || INITIAL_RULES,
            warningRules: body.warningRules || currentData.warningRules || INITIAL_WARNING_RULES,
            transactions: body.transactions || currentData.transactions || [],
            auditLogs: body.auditLogs || currentData.auditLogs || [],
            archives: body.archives || currentData.archives || [],
            users: body.users || currentData.users || INITIAL_USERS,
            appeals: body.appeals || currentData.appeals || [],
        };

        await saveStoreData(newData);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
    }
}
