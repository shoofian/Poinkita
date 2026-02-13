-- Create tables matching the Interfaces

-- 1. Users
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT NOT NULL,
  password TEXT,
  role TEXT DEFAULT 'CONTRIBUTOR',
  email TEXT,
  phone TEXT,
  "adminId" TEXT
);

-- 2. Members
CREATE TABLE IF NOT EXISTS public.members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  division TEXT,
  "totalPoints" INTEGER DEFAULT 0,
  "adminId" TEXT
);

-- 3. Rules
CREATE TABLE IF NOT EXISTS public.rules (
  id TEXT PRIMARY KEY,
  description TEXT,
  type TEXT,
  points INTEGER,
  "adminId" TEXT
);

-- 4. Warning Rules
CREATE TABLE IF NOT EXISTS public."warningRules" (
  id TEXT PRIMARY KEY,
  name TEXT,
  threshold INTEGER,
  message TEXT,
  action TEXT,
  "textColor" TEXT,
  "backgroundColor" TEXT,
  "adminId" TEXT
);

-- 5. Transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  "memberId" TEXT,
  "contributorId" TEXT,
  "ruleId" TEXT,
  timestamp TIMESTAMPTZ,
  "pointsSnapshot" INTEGER,
  "adminId" TEXT
);

-- 6. Audit Logs
CREATE TABLE IF NOT EXISTS public."auditLogs" (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ,
  action TEXT,
  "memberId" TEXT,
  "contributorId" TEXT,
  details TEXT,
  points INTEGER,
  "adminId" TEXT
);

-- 7. Archives (Store memberSnapshots as JSON)
CREATE TABLE IF NOT EXISTS public.archives (
  id TEXT PRIMARY KEY,
  title TEXT,
  timestamp TIMESTAMPTZ,
  "memberSnapshots" JSONB,
  "adminId" TEXT
);

-- Enable RLS (Optional/Recommended but kept open for simplicity as API handles auth via logic)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."warningRules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."auditLogs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archives ENABLE ROW LEVEL SECURITY;

-- Allow public access for now (since we use internal API logic, or service_role key if needed)
-- But for anon key to work we need policies
CREATE POLICY "Enable read access for all users" ON public.users FOR ALL USING (true);
CREATE POLICY "Enable read access for all users" ON public.members FOR ALL USING (true);
CREATE POLICY "Enable read access for all users" ON public.rules FOR ALL USING (true);
CREATE POLICY "Enable read access for all users" ON public."warningRules" FOR ALL USING (true);
CREATE POLICY "Enable read access for all users" ON public.transactions FOR ALL USING (true);
CREATE POLICY "Enable read access for all users" ON public."auditLogs" FOR ALL USING (true);
CREATE POLICY "Enable read access for all users" ON public.archives FOR ALL USING (true);
