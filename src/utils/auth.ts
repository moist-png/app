import { User, AuthState, Organization, OrgInviteCode } from '../types';

const AUTH_STORAGE_KEY = 'arborist-auth';
const USERS_STORAGE_KEY = 'arborist-users';
const ORGS_STORAGE_KEY = 'arborist-organizations';
const ORG_INVITE_CODES_KEY = 'arborist-org-invite-codes';

// ── Seed data ────────────────────────────────────────────────────────────────

const DEFAULT_SUPER_ADMIN: User = {
  id: 'super-admin-1',
  email: 'superadmin@arborist.com',
  name: 'Super Admin',
  role: 'super_admin',
  orgId: null,
  createdAt: Date.now(),
  lastLogin: Date.now(),
};

const DEFAULT_DEMO_ORG: Organization = {
  id: 'demo-org',
  name: 'Demo Organization',
  slug: 'demo',
  createdAt: Date.now(),
  active: true,
};

const DEFAULT_ORG_ADMIN: User = {
  id: 'org-admin-1',
  email: 'admin@arborist.com',
  name: 'Admin User',
  role: 'org_admin',
  orgId: 'demo-org',
  createdAt: Date.now(),
  lastLogin: Date.now(),
};

const DEFAULT_ORG_INVITE_CODES: OrgInviteCode[] = [
  { id: 'ic-1', orgId: 'demo-org', code: 'ARBORIST2024', createdAt: Date.now(), createdBy: 'org-admin-1' },
  { id: 'ic-2', orgId: 'demo-org', code: 'TREE-EXPERT',  createdAt: Date.now(), createdBy: 'org-admin-1' },
  { id: 'ic-3', orgId: 'demo-org', code: 'DEMO-ACCESS',  createdAt: Date.now(), createdBy: 'org-admin-1' },
  { id: 'ic-4', orgId: 'demo-org', code: 'PROFESSIONAL', createdAt: Date.now(), createdBy: 'org-admin-1' },
];

// ── Organization helpers ──────────────────────────────────────────────────────

export const saveOrganizations = (orgs: Organization[]): void => {
  localStorage.setItem(ORGS_STORAGE_KEY, JSON.stringify(orgs));
};

export const loadOrganizations = (): Organization[] => {
  const stored = localStorage.getItem(ORGS_STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  const defaults = [DEFAULT_DEMO_ORG];
  saveOrganizations(defaults);
  return defaults;
};

export const getOrganizationById = (id: string): Organization | undefined => {
  return loadOrganizations().find(o => o.id === id);
};

export const getOrganizationBySlug = (slug: string): Organization | undefined => {
  return loadOrganizations().find(o => o.slug === slug.toLowerCase());
};

/** Create a new organization. Returns the created org. */
export const createOrganization = (name: string): Organization => {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const orgs = loadOrganizations();

  // Ensure slug uniqueness
  let uniqueSlug = slug;
  let counter = 2;
  while (orgs.some(o => o.slug === uniqueSlug)) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  const newOrg: Organization = {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
    name,
    slug: uniqueSlug,
    createdAt: Date.now(),
    active: true,
  };

  saveOrganizations([...orgs, newOrg]);
  return newOrg;
};

export const setOrganizationActive = (orgId: string, active: boolean): void => {
  const orgs = loadOrganizations().map(o => o.id === orgId ? { ...o, active } : o);
  saveOrganizations(orgs);
};

// ── Org invite code helpers ──────────────────────────────────────────────────

export const saveOrgInviteCodes = (codes: OrgInviteCode[]): void => {
  localStorage.setItem(ORG_INVITE_CODES_KEY, JSON.stringify(codes));
};

export const loadOrgInviteCodes = (): OrgInviteCode[] => {
  const stored = localStorage.getItem(ORG_INVITE_CODES_KEY);
  if (stored) return JSON.parse(stored);
  saveOrgInviteCodes(DEFAULT_ORG_INVITE_CODES);
  return DEFAULT_ORG_INVITE_CODES;
};

export const getOrgInviteCodes = (orgId: string): OrgInviteCode[] => {
  return loadOrgInviteCodes().filter(c => c.orgId === orgId);
};

/**
 * Validate an invite code.
 * Returns the orgId of the matching org, or null if invalid/inactive.
 */
export const validateOrgInviteCode = (code: string): string | null => {
  const codes = loadOrgInviteCodes();
  const match = codes.find(c => c.code.toUpperCase() === code.toUpperCase());
  if (!match) return null;

  const org = getOrganizationById(match.orgId);
  if (!org || !org.active) return null;

  return match.orgId;
};

/** Generate a new invite code for an org and return it. */
export const createOrgInviteCode = (orgId: string, createdBy: string): OrgInviteCode => {
  const codes = loadOrgInviteCodes();
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  const newCode: OrgInviteCode = {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
    orgId,
    code: `ORG-${randomPart}`,
    createdAt: Date.now(),
    createdBy,
  };
  saveOrgInviteCodes([...codes, newCode]);
  return newCode;
};

export const deleteOrgInviteCode = (codeId: string): void => {
  const codes = loadOrgInviteCodes().filter(c => c.id !== codeId);
  saveOrgInviteCodes(codes);
};

// ── User helpers ──────────────────────────────────────────────────────────────

export const saveUsers = (users: User[]): void => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

export const loadUsers = (): User[] => {
  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  const defaults = [DEFAULT_SUPER_ADMIN, DEFAULT_ORG_ADMIN];
  saveUsers(defaults);
  return defaults;
};

export const getOrgUsers = (orgId: string): User[] => {
  return loadUsers().filter(u => u.orgId === orgId);
};

export const setUserRole = (userId: string, role: 'org_admin' | 'user'): void => {
  const users = loadUsers().map(u => u.id === userId ? { ...u, role } : u);
  saveUsers(users);
};

export const removeUserFromOrg = (userId: string): void => {
  const users = loadUsers().filter(u => u.id !== userId);
  saveUsers(users);
};

// ── Auth state ────────────────────────────────────────────────────────────────

export const saveAuthState = (authState: AuthState): void => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
};

export const loadAuthState = (): AuthState => {
  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  return { isAuthenticated: false, user: null, isGuest: false, currentOrgId: null };
};

export const getCurrentUser = (): User | null => {
  return loadAuthState().user;
};

// ── Authentication ────────────────────────────────────────────────────────────

export const authenticateUser = (email: string, _password: string): User | null => {
  // Ensure seed data exists
  loadOrganizations();
  loadOrgInviteCodes();

  const users = loadUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return null;

  const updatedUser = { ...user, lastLogin: Date.now() };
  saveUsers(users.map(u => u.id === user.id ? updatedUser : u));
  return updatedUser;
};

export const registerUser = (
  email: string,
  _password: string,
  name: string,
  inviteCode: string
): User => {
  const orgId = validateOrgInviteCode(inviteCode);
  if (!orgId) throw new Error('Invalid or expired invite code');

  const users = loadUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('A user with this email already exists');
  }

  const newUser: User = {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 9),
    email: email.toLowerCase(),
    name,
    role: 'user',
    orgId,
    createdAt: Date.now(),
    lastLogin: Date.now(),
  };

  saveUsers([...users, newUser]);
  return newUser;
};

export const loginAsGuest = (orgId: string): User => ({
  id: `guest-${Date.now()}`,
  email: 'guest@arborist.com',
  name: 'Guest User',
  role: 'guest',
  orgId,
  createdAt: Date.now(),
  lastLogin: Date.now(),
});

export const logout = (): void => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

// ── Permission helpers ────────────────────────────────────────────────────────

export const isSuperAdmin = (): boolean => {
  const user = getCurrentUser();
  return user?.role === 'super_admin';
};

export const isOrgAdmin = (): boolean => {
  const user = getCurrentUser();
  return user?.role === 'org_admin' || user?.role === 'super_admin';
};

export const isUserGuest = (): boolean => {
  return loadAuthState().isGuest;
};

export const canUserEdit = (): boolean => {
  const authState = loadAuthState();
  return authState.isAuthenticated && !authState.isGuest;
};

export const getUserDisplayName = (): string => {
  const user = getCurrentUser();
  return user ? user.name : '';
};
