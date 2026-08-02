import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import UserAvatar from './UserAvatar.jsx';

export default function AccountMenu({ onViewProfile, onViewSettings }) {
  const { user, profile, logOut } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function choose(action) {
    setOpen(false);
    action();
  }

  return (
    <div className="account-menu" ref={rootRef}>
      <button
        type="button"
        className="account-menu-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <UserAvatar name={user.displayName || user.email} photoURL={profile?.photoURL} size="sm" />
        {user.displayName || user.email}
        <span className="account-menu-caret">▾</span>
      </button>
      {open && (
        <div className="account-menu-dropdown">
          <button type="button" onClick={() => choose(onViewProfile)}>
            Profile
          </button>
          <button type="button" onClick={() => choose(onViewSettings)}>
            Settings
          </button>
          <div className="account-menu-divider" />
          <button type="button" onClick={() => choose(logOut)}>
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
