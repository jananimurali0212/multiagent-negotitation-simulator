import { mockFetch, mockPost } from './apiAdapter';

export interface UserSettings {
  language: string;
  theme: 'light' | 'system' | 'dark';
  defaultMode: 'simulation' | 'practice';
  negotiationSpeed: '1x' | '2x' | '5x';
  autoSave: boolean;
  liveMetrics: boolean;
  confirmBeforeEnding: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  language: 'English (US)',
  theme: 'light',
  defaultMode: 'simulation',
  negotiationSpeed: '1x',
  autoSave: true,
  liveMetrics: true,
  confirmBeforeEnding: true,
};

const STORAGE_KEY = 'mans_user_settings';

export const settingsService = {
  async getSettings(): Promise<UserSettings> {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return mockFetch<UserSettings>(JSON.parse(stored), 100);
      } catch {
        // Fallback to default
      }
    }
    return mockFetch<UserSettings>(DEFAULT_SETTINGS, 100);
  },

  async saveSettings(settings: UserSettings): Promise<UserSettings> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    return mockPost<UserSettings>(settings, 200);
  },

  async exportUserData(): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const payload = {
          exportedAt: new Date().toISOString(),
          settings: DEFAULT_SETTINGS,
          version: '1.0.0',
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mans_user_data_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        resolve(true);
      }, 400);
    });
  },

  async clearLocalCache(): Promise<boolean> {
    localStorage.removeItem(STORAGE_KEY);
    return mockPost<boolean>(true, 250);
  }
};
