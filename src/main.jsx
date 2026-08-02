import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import AquariumBackground from './components/AquariumBackground.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { applyTheme, getStoredTheme } from './lib/theme.js';
import './index.css';

applyTheme(getStoredTheme());

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AquariumBackground />
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
