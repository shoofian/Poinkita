export type UserRole = 'ADMIN' | 'CONTRIBUTOR';

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  password?: string; // Optional for mock
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

export const INITIAL_MEMBERS: Member[] = [
  { id: 'M001', name: 'Alice Smith', division: 'Class 10A', totalPoints: 10 },
  { id: 'M002', name: 'Bob Jones', division: 'Class 11B', totalPoints: -5 },
  { id: 'M003', name: 'Charlie Brown', division: 'Class 10A', totalPoints: 50 },
];

export const INITIAL_RULES: Rule[] = [
  { id: 'R001', description: 'Homework Completion', type: 'ACHIEVEMENT', points: 10 },
  { id: 'R002', description: 'Late Arrival', type: 'VIOLATION', points: -5 },
  { id: 'R003', description: 'Helping Others', type: 'ACHIEVEMENT', points: 5 },
];

export const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'Admin User', username: 'admin', role: 'ADMIN' },
  { id: 'u2', name: 'Teacher 1', username: 'teacher', role: 'CONTRIBUTOR' },
];
