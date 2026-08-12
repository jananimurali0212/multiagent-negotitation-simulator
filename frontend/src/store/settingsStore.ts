import { create } from 'zustand';
import { UserSettings, DEFAULT_SETTINGS, settingsService } from '../services/settingsService';

interface SettingsState {
  settings: UserSettings;
  isLoading: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoading: false,

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const settings = await settingsService.getSettings();
      set({ settings, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  updateSettings: async (newSettings) => {
    const updated = { ...get().settings, ...newSettings };
    set({ settings: updated });
    await settingsService.saveSettings(updated);
  },

  resetSettings: async () => {
    set({ settings: DEFAULT_SETTINGS });
    await settingsService.saveSettings(DEFAULT_SETTINGS);
  }
}));
