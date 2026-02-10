export type UserRole = 'ADMIN' | 'CONTRIBUTOR';

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  password?: string; // Optional for mock
  email?: string;
  phone?: string;
}

export interface Member {
  id: string;
  name: string;
  division: string;
  totalPoints: number;
}

export interface Rule {
  id: string;
  description: string;
  type: 'ACHIEVEMENT' | 'VIOLATION';
  points: number;
}

export interface Transaction {
  id: string;
  memberId: string;
  contributorId: string;
  ruleId: string;
  timestamp: string;
  pointsSnapshot: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: 'CREATE' | 'DELETE';
  memberId: string;
  contributorId: string;
  details: string;
  points: number;
}

export interface ArchiveMember {
  id: string;
  name: string;
  division: string;
  points: number;
}

export interface Archive {
  id: string;
  title: string;
  timestamp: string;
  memberSnapshots: ArchiveMember[];
}

export const INITIAL_MEMBERS: Member[] = [
  { id: 'MEM-20260210-001', name: 'Alice Smith', division: 'Class 10A', totalPoints: 10 },
  { id: 'MEM-20260210-002', name: 'Bob Jones', division: 'Class 11B', totalPoints: -5 },
  { id: 'MEM-20260210-003', name: 'Charlie Brown', division: 'Class 10A', totalPoints: 50 },
];

export const INITIAL_RULES: Rule[] = [
  { id: 'RUL-ACH-20260210-001', description: 'Homework Completion', type: 'ACHIEVEMENT', points: 10 },
  { id: 'RUL-VIO-20260210-002', description: 'Late Arrival', type: 'VIOLATION', points: -5 },
  { id: 'RUL-ACH-20260210-003', description: 'Helping Others', type: 'ACHIEVEMENT', points: 5 },
];

export const INITIAL_USERS: User[] = [
  { id: 'USR-20260210-001', name: 'Admin User', username: 'admin', role: 'ADMIN', password: 'admin123' },
  { id: 'USR-20260210-002', name: 'Teacher 1', username: 'teacher', role: 'CONTRIBUTOR', password: 'teacher123' },
];
