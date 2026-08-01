import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import AccountMenu from './AccountMenu.jsx';

export default function Header({ onViewProfile, onViewSettings }) {
  const { user } = useAuth();

  return (
    <header className="app-header">
      <div>
        <h1>Aquarium Catalog</h1>
        <p className="tagline">
          Browse a freshwater species catalog, build your tanks, and find compatible additions.
        </p>
      </div>
      {user && (
        <div className="account-bar">
          <AccountMenu onViewProfile={onViewProfile} onViewSettings={onViewSettings} />
        </div>
      )}
    </header>
  );
}
