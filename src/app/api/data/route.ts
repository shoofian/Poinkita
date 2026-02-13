import { NextResponse } from 'next/server';
import { getStoreData, saveStoreData, StoreData } from '@/lib/server/db';
import { INITIAL_MEMBERS, INITIAL_RULES, INITIAL_USERS, INITIAL_WARNING_RULES } from '@/lib/store';

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

        // Ensure strictly saving only what's provided or merge?
        // Current logic: Merge with existing to be safe.
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
        };

        await saveStoreData(newData);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
    }
}
