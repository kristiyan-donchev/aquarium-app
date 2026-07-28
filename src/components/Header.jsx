import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Header() {
  const { user, logOut } = useAuth();

  return (
    <header className="app-header">
      <div>
        <h1>Aquarium Catalog</h1>
        <p className="tagline">
          Browse a freshwater species catalog, build "My Tank," and find compatible additions.
        </p>
      </div>
      {user && (
        <div className="account-bar">
          <span className="account-email">{user.email}</span>
          <button type="button" className="secondary-button" onClick={logOut}>
            Log out
          </button>
        </div>
      )}
    </header>
  );
}
