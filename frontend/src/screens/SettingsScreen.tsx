import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Sliders, Bell, Database, RotateCcw, Save, CheckCircle2, User } from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const { settings, updateSettings, user } = useStore();

  const [language, setLanguage] = useState(settings.language);
  const [theme, setTheme] = useState(settings.theme);
  const [defaultMode, setDefaultMode] = useState(settings.defaultMode);
  const [negotiationSpeed, setNegotiationSpeed] = useState(settings.negotiationSpeed);
  
  const [autoSave, setAutoSave] = useState(settings.autoSave);
  const [liveMetrics, setLiveMetrics] = useState(settings.liveMetrics);
  const [confirmEnd, setConfirmEnd] = useState(settings.confirmEnd);

  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      language,
      theme,
      defaultMode,
      negotiationSpeed,
      autoSave,
      liveMetrics,
      confirmEnd
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  const handleReset = () => {
    setLanguage('English');
    setTheme('Light');
    setDefaultMode('ai-ai');
    setNegotiationSpeed('Normal');
    setAutoSave(true);
    setLiveMetrics(true);
    setConfirmEnd(true);
  };

  const handleClearCache = () => {
    alert('Browser local settings successfully reset.');
  };

  const handleExportData = () => {
    alert('Preparing your user data download package containing transcripts and diagnostic results.');
  };

  return (
    <div className="space-y-8 py-4 pb-8 w-full">
      
      {/* Header */}
      <div className="pb-4 border-b border-gray-200/50">
        <h1 className="text-xl font-bold text-primary tracking-tight">Application Settings</h1>
        <p className="text-xs text-slategray font-medium">Manage your tactical preferences and simulation profiles</p>
      </div>

      {saved && (
        <div className="p-3.5 bg-green-50 border border-green-200/50 text-green-700 text-xs rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 size={14} className="shrink-0 text-green-600" />
          <span className="font-semibold">Settings updated successfully!</span>
        </div>
      )}

      {/* Settings form split */}
      <form onSubmit={handleSave} className="grid grid-cols-1 xl:grid-cols-[minmax(0,2.8fr)_minmax(320px,0.85fr)] gap-6">
        
        {/* Left Side: Parameters forms (Spans 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Profile Details Card */}
          <div className="bg-white/70 border border-white/85 rounded-[24px] p-6 shadow-[0_12px_40px_rgba(15,23,42,0.05)] backdrop-blur-[24px] space-y-4">
            <div className="flex items-center gap-2.5 pb-2.5 border-b border-white/80">
              <User size={16} className="text-secondary" />
              <h3 className="font-semibold text-primary text-xs uppercase tracking-wider">Profile Details</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-primary">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slategray uppercase tracking-wider block">Registered Email</span>
                <input
                  type="text"
                  value={user.email || 'practitioner@example.com'}
                  disabled
                  className="w-full px-3 py-2 bg-white/35 border border-white/60 rounded-xl font-medium text-slate-400 cursor-not-allowed"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slategray uppercase tracking-wider block">Practitioner Tier</span>
                <input
                  type="text"
                  value="Enterprise Sandbox User (Free)"
                  disabled
                  className="w-full px-3 py-2 bg-white/35 border border-white/60 rounded-xl font-medium text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Preferences & Appearance Card */}
          <div className="bg-white/70 border border-white/85 rounded-[24px] p-6 shadow-[0_12px_40px_rgba(15,23,42,0.05)] backdrop-blur-[24px] space-y-4">
            <div className="flex items-center gap-2.5 pb-2.5 border-b border-white/80">
              <Sliders size={16} className="text-accent" />
              <h3 className="font-semibold text-primary text-xs uppercase tracking-wider">Preferences & Appearance</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-primary">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slategray uppercase tracking-wider block">Language</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 bg-white/45 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent font-medium text-navyblack"
                >
                  <option>English</option>
                  <option>Spanish</option>
                  <option>German</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slategray uppercase tracking-wider block">Theme Mode</span>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white/45 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent font-medium text-navyblack"
                >
                  <option value="Light">Light Theme (Warm Pearl)</option>
                  <option value="Dark">Dark Theme (Midnight Indigo)</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slategray uppercase tracking-wider block">Default Sandbox Mode</span>
                <select
                  value={defaultMode}
                  onChange={(e) => setDefaultMode(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white/45 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent font-medium text-navyblack"
                >
                  <option value="ai-ai">Simulation Mode (AI vs AI)</option>
                  <option value="human-ai">Practice Mode (Human vs AI)</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slategray uppercase tracking-wider block">Orchestration Speed</span>
                <select
                  value={negotiationSpeed}
                  onChange={(e) => setNegotiationSpeed(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white/45 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent font-medium text-navyblack"
                >
                  <option value="Normal">Normal (2s / turn)</option>
                  <option value="Fast">Fast (1s / turn)</option>
                  <option value="Slow">Slow (5s / turn)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Negotiation Toggles (Notifications category) */}
          <div className="bg-white/70 border border-white/85 rounded-[24px] p-6 shadow-[0_12px_40px_rgba(15,23,42,0.05)] backdrop-blur-[24px] space-y-4">
            <div className="flex items-center gap-2.5 pb-2.5 border-b border-white/80">
              <Bell size={16} className="text-secondary" />
              <h3 className="font-semibold text-primary text-xs uppercase tracking-wider">Negotiation Rules</h3>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary font-bold">Auto-save Negotiation Logs</p>
                  <p className="text-[10px] text-slategray font-medium">Store transcripts automatically on finished runs.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoSave(!autoSave)}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    autoSave ? 'bg-accent' : 'bg-gray-200'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    autoSave ? 'translate-x-5' : 'translate-x-0'
                  }`}></span>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary font-bold">Concession Chart Overlay</p>
                  <p className="text-[10px] text-slategray font-medium">Display convergence trends during simulation modes.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setLiveMetrics(!liveMetrics)}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    liveMetrics ? 'bg-accent' : 'bg-gray-200'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    liveMetrics ? 'translate-x-5' : 'translate-x-0'
                  }`}></span>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary font-bold">Confirm before Exit Dialog</p>
                  <p className="text-[10px] text-slategray font-medium">Prompt confirmation request warnings when leaving active arenas.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmEnd(!confirmEnd)}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    confirmEnd ? 'bg-accent' : 'bg-gray-200'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    confirmEnd ? 'translate-x-5' : 'translate-x-0'
                  }`}></span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Data Management */}
        <div className="space-y-6">
          <div className="bg-white/58 border border-white/70 rounded-[22px] p-5 shadow-[0_8px_32px_rgba(15,23,42,0.03)] backdrop-blur-[20px] space-y-4">
            <div className="flex items-center gap-2.5 pb-2.5 border-b border-white/80">
              <Database size={16} className="text-primary" />
              <h3 className="font-semibold text-primary text-xs uppercase tracking-wider">Data Profile</h3>
            </div>

            <div className="space-y-3.5">
              <button
                type="button"
                onClick={handleExportData}
                className="w-full py-2.5 bg-warmpearl hover:bg-gray-150 border border-gray-200 text-xs font-bold text-primary rounded-xl transition-all cursor-pointer"
              >
                Export All My Data (JSON)
              </button>

              <button
                type="button"
                onClick={handleClearCache}
                className="w-full py-2.5 bg-red-50 hover:bg-red-100/50 border border-red-200 text-xs font-bold text-red-700 rounded-xl transition-all cursor-pointer"
              >
                Reset Local settings
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="space-y-3">
            <button
              type="submit"
              className="w-full py-3.5 bg-accent hover:bg-accent-dark text-white font-semibold text-xs uppercase tracking-widest rounded-full shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none"
            >
              <Save size={13} /> Save Preferences
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="w-full py-3 border border-gray-200 hover:bg-warmpearl text-primary font-semibold text-xs uppercase tracking-widest rounded-full flex items-center justify-center gap-1.5 transition-all cursor-pointer bg-transparent"
            >
              <RotateCcw size={13} /> Reset Defaults
            </button>
          </div>
        </div>

      </form>
    </div>
  );
};

export default SettingsScreen;
