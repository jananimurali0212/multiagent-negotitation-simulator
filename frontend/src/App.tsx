import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes';
import { useAuthStore } from './store/authStore';
import { useSettingsStore } from './store/settingsStore';

export function App() {
  const { checkAuth } = useAuthStore();
  const { fetchSettings } = useSettingsStore();

  useEffect(() => {
    checkAuth();
    fetchSettings();
  }, []);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
