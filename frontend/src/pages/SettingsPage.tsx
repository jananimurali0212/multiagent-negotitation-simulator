import React, { useEffect, useState } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { settingsService } from '../services/settingsService';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import {
  Settings as SettingsIcon,
  Sliders,
  Database,
  Save,
  RotateCcw,
  CheckCircle2,
  Download,
  Trash2
} from 'lucide-react';

export function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettingsStore();

  const [formData, setFormData] = useState(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = async () => {
    if (window.confirm('Reset all settings to default values?')) {
      await resetSettings();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    await settingsService.exportUserData();
    setIsExporting(false);
  };

  const handleClearCache = async () => {
    if (window.confirm('Clear local cached sessions and settings?')) {
      await settingsService.clearLocalCache();
      alert('Local cache successfully cleared.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Platform Settings & Preferences"
        description="Configure simulation speeds, default operational modes, telemetry display, and data management options."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Settings' },
        ]}
      />

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Your platform preferences have been updated and saved successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION 1: GENERAL PREFERENCES */}
        <Card className="border-slate-200">
          <CardHeader className="py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <SettingsIcon className="w-4 h-4 text-blue-600" />
              <span>General Preferences</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Language */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Platform Language
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                >
                  <option>English (US)</option>
                  <option>English (UK)</option>
                  <option>Spanish (Español)</option>
                  <option>German (Deutsch)</option>
                  <option>French (Français)</option>
                </select>
              </div>

              {/* Theme */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Interface Theme
                </label>
                <select
                  value={formData.theme}
                  onChange={(e) => setFormData({ ...formData, theme: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="light">Light Enterprise (Default)</option>
                  <option value="system">System Preference</option>
                  <option value="dark">Dark Minimal</option>
                </select>
              </div>

              {/* Default Mode */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Default Operational Mode
                </label>
                <select
                  value={formData.defaultMode}
                  onChange={(e) => setFormData({ ...formData, defaultMode: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="simulation">Simulation Mode (AI vs AI)</option>
                  <option value="practice">Practice Mode (Human vs AI)</option>
                </select>
              </div>

              {/* Negotiation Speed */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Default Simulation Speed
                </label>
                <select
                  value={formData.negotiationSpeed}
                  onChange={(e) => setFormData({ ...formData, negotiationSpeed: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1x">1x Normal Pace (~3.5s per turn)</option>
                  <option value="2x">2x Accelerated (~1.8s per turn)</option>
                  <option value="5x">5x Fast Forward (~0.7s per turn)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: SIMULATION PREFERENCES */}
        <Card className="border-slate-200">
          <CardHeader className="py-4 px-6 border-b border-slate-100">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Simulation & Telemetry Preferences</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-4 text-xs">
            {/* Auto Save */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div>
                <span className="font-bold text-slate-900 block">Auto-Save Session History</span>
                <span className="text-slate-500 text-[11px]">
                  Automatically persist finished arena sessions to your recent negotiations table.
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.autoSave}
                onChange={(e) => setFormData({ ...formData, autoSave: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
              />
            </div>

            {/* Live Metrics */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div>
                <span className="font-bold text-slate-900 block">Real-Time Telemetry Updates</span>
                <span className="text-slate-500 text-[11px]">
                  Render live Recharts concession curves during active negotiation rounds.
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.liveMetrics}
                onChange={(e) => setFormData({ ...formData, liveMetrics: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
              />
            </div>

            {/* Confirm Before Ending */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div>
                <span className="font-bold text-slate-900 block">Confirm Before Session Termination</span>
                <span className="text-slate-500 text-[11px]">
                  Show confirmation dialog when stopping an in-progress negotiation.
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.confirmBeforeEnding}
                onChange={(e) => setFormData({ ...formData, confirmBeforeEnding: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
              />
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3: DATA MANAGEMENT */}
        <Card className="border-slate-200">
          <CardHeader className="py-4 px-6 border-b border-slate-100">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Database className="w-4 h-4 text-violet-600" />
              <span>Data Management</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div>
              <span className="font-bold text-slate-900 block">Export or Clear Local Storage</span>
              <p className="text-slate-500 text-[11px]">
                Download a JSON backup of your configured parameters or reset local browser state.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                isLoading={isExporting}
                leftIcon={<Download className="w-3.5 h-3.5 text-blue-600" />}
                onClick={handleExportData}
              >
                Export User Data
              </Button>

              <Button
                type="button"
                variant="destructive"
                size="sm"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={handleClearCache}
              >
                Clear Local Cache
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Form Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={handleReset}
          >
            Reset to Default
          </Button>

          <Button type="submit" size="md" leftIcon={<Save className="w-4 h-4" />}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
