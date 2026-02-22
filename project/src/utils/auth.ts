import { User, AuthState } from '../types';

const AUTH_STORAGE_KEY = 'arborist-auth';
const USERS_STORAGE_KEY = 'arborist-users';
const INVITE_CODES_KEY = 'arborist-invite-codes';

// Default admin user for demo purposes
const DEFAULT_ADMIN: User = {
  id: 'admin-1',
  email: 'admin@arborist.com',
  name: 'Admin User',
  role: 'admin',
  createdAt: Date.now(),
  lastLogin: Date.now()
};

// Default invite codes for demo purposes
const DEFAULT_INVITE_CODES = [
  'Arborpro'
];

export const saveInviteCodes = (codes: string[]): void => {
  localStorage.setItem(INVITE_CODES_KEY, JSON.stringify(codes));
};

export const loadInviteCodes = (): string[] => {
  const stored = localStorage.getItem(INVITE_CODES_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  // Initialize with default invite codes
  saveInviteCodes(DEFAULT_INVITE_CODES);
  return DEFAULT_INVITE_CODES;
};

export const validateInviteCode = (code: string): boolean => {
  const codes = loadInviteCodes();
  return codes.includes(code.toUpperCase());
};

export const saveAuthState = (authState: AuthState): void => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
};

export const loadAuthState = (): AuthState => {
  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return {
    isAuthenticated: false,
    user: null,
    isGuest: false
  };
};

export const saveUsers = (users: User[]): void => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

export const loadUsers = (): User[] => {
  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  // Initialize with default admin user
  const defaultUsers = [DEFAULT_ADMIN];
  saveUsers(defaultUsers);
  return defaultUsers;
};

export const authenticateUser = (email: string, password: string): User | null => {
  const users = loadUsers();
  
  // Simple authentication - in production, this would be handled by a secure backend
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (user) {
    // For demo purposes, accept any password for existing users
    // In production, you'd verify against a hashed password
    const updatedUser = { ...user, lastLogin: Date.now() };
    
    // Update user's last login
    const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u);
    saveUsers(updatedUsers);
    
    return updatedUser;
  }
  
  return null;
};

export const registerUser = (email: string, password: string, name: string, inviteCode: string): User => {
  const users = loadUsers();
  
  // Validate invite code
  if (!validateInviteCode(inviteCode)) {
    throw new Error('Invalid invite code');
  }
  
  // Check if user already exists
  const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    throw new Error('User with this email already exists');
  }
  
  const newUser: User = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
    email: email.toLowerCase(),
    name,
    role: 'user',
    createdAt: Date.now(),
    lastLogin: Date.now()
  };
  
  const updatedUsers = [...users, newUser];
  saveUsers(updatedUsers);
  
  return newUser;
};

export const loginAsGuest = (): User => {
  return {
    id: 'guest',
    email: 'guest@arborist.com',
    name: 'Guest User',
    role: 'guest',
    createdAt: Date.now(),
    lastLogin: Date.now()
  };
};

export const logout = (): void => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const getCurrentUser = (): User | null => {
  const authState = loadAuthState();
  return authState.user;
};

export const isUserGuest = (): boolean => {
  const authState = loadAuthState();
  return authState.isGuest;
};

export const canUserEdit = (): boolean => {
  const authState = loadAuthState();
  return authState.isAuthenticated && !authState.isGuest;
};

export const getUserDisplayName = (): string => {
  const user = getCurrentUser();
  return user ? user.name : '';
};