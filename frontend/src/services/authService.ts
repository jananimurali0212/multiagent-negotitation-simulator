import { User } from '../types/auth';
import { mockPost, mockFetch } from './apiAdapter';

const MOCK_USER: User = {
  id: 'usr-9021',
  name: 'Alex Mercer',
  email: 'alex.mercer@negotiate.ai',
  role: 'Senior Negotiator & Strategist',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  createdAt: '2026-01-15',
};

const STORAGE_KEY = 'mans_user_session';

export const authService = {
  async login(email: string, _password: string, rememberMe: boolean = true): Promise<User> {
    const user: User = {
      ...MOCK_USER,
      email: email || MOCK_USER.email,
      name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()) || MOCK_USER.name,
    };
    if (rememberMe) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    }
    return mockPost<User>(user, 400);
  },

  async signup(name: string, email: string, _password: string): Promise<User> {
    const user: User = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      name: name || 'New User',
      email: email,
      role: 'Negotiation Practitioner',
      createdAt: new Date().toISOString().split('T')[0],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return mockPost<User>(user, 450);
  },

  async logout(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    return mockPost<void>(undefined, 200);
  },

  async getCurrentUser(): Promise<User | null> {
    const stored = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return mockFetch<User>(JSON.parse(stored), 150);
      } catch {
        return null;
      }
    }
    // Return default demo user for seamless preview
    return mockFetch<User>(MOCK_USER, 150);
  }
};
