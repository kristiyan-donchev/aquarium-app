import React, { useState } from 'react';
import {
  EmailAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  updateEmail as fbUpdateEmail,
  updatePassword,
  updateProfile,
  verifyBeforeUpdateEmail,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase.js';
import { useAuth } from '../context/AuthContext.jsx';
import { updateDisplayName, updateAvatar, deleteUserProfile } from '../lib/users.js';
import { listTanks, deleteTank } from '../lib/storage.js';
import { listPostsByAuthor, deletePost } from '../lib/forum.js';
import { fileToAvatarDataUrl } from '../lib/imageResize.js';
import { getStoredTheme, setStoredTheme } from '../lib/theme.js';
import UserAvatar from './UserAvatar.jsx';

const THEME_OPTIONS = [
  { value: 'system', label: 'Match system' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

function friendlyError(err) {
  const code = err?.code || '';
  if (code.includes('wrong-password') || code.includes('invalid-credential')) {
    return 'Incorrect password.';
  }
  if (code.includes('requires-recent-login')) {
    return 'This action needs a fresh sign-in — please re-authenticate and try again.';
  }
  if (code.includes('weak-password')) return 'Password must be at least 6 characters.';
  if (code.includes('email-already-in-use')) return 'Another account already uses that email.';
  if (code.includes('invalid-email')) return 'Enter a valid email address.';
  if (code.includes('popup-closed-by-user')) return null;
  if (code.includes('too-many-requests')) return 'Too many attempts — please wait a bit and try again.';
  return err?.message || 'Something went wrong. Please try again.';
}

export default function Settings({ user, onBack }) {
  const { profile, refreshUser, refreshProfile, logOut } = useAuth();
  const isPasswordProvider = user.providerData?.some((p) => p.providerId === 'password');

  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [avatarStatus, setAvatarStatus] = useState('');

  const [theme, setTheme] = useState(getStoredTheme());

  const [nameInput, setNameInput] = useState(user.displayName || '');
  const [nameStatus, setNameStatus] = useState('');
  const [nameBusy, setNameBusy] = useState(false);

  const [currentPasswordForPw, setCurrentPasswordForPw] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwStatus, setPwStatus] = useState('');
  const [pwBusy, setPwBusy] = useState(false);

  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailStatus, setEmailStatus] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);

  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAvatarError('');
    setAvatarStatus('');
    setAvatarBusy(true);
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      await updateAvatar(user.uid, dataUrl);
      await refreshProfile();
      setAvatarStatus('Saved.');
    } catch (err) {
      setAvatarError(err.message || 'Could not update your photo.');
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleRemoveAvatar() {
    setAvatarError('');
    setAvatarStatus('');
    setAvatarBusy(true);
    try {
      await updateAvatar(user.uid, null);
      await refreshProfile();
      setAvatarStatus('Photo removed.');
    } catch (err) {
      setAvatarError(err.message || 'Could not remove your photo.');
    } finally {
      setAvatarBusy(false);
    }
  }

  function handleThemeChange(value) {
    setTheme(value);
    setStoredTheme(value);
  }

  async function handleSaveName(e) {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setNameStatus('');
    setNameBusy(true);
    try {
      await updateProfile(auth.currentUser, { displayName: trimmed });
      await updateDisplayName(user.uid, trimmed);
      refreshUser();
      setNameStatus('Saved.');
    } catch (err) {
      setNameStatus(friendlyError(err) || '');
    } finally {
      setNameBusy(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwError('');
    setPwStatus('');
    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("New passwords don't match.");
      return;
    }
    setPwBusy(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, currentPasswordForPw);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, newPassword);
      setCurrentPasswordForPw('');
      setNewPassword('');
      setConfirmPassword('');
      setPwStatus('Password updated.');
    } catch (err) {
      const msg = friendlyError(err);
      if (msg) setPwError(msg);
    } finally {
      setPwBusy(false);
    }
  }

  async function handleChangeEmail(e) {
    e.preventDefault();
    setEmailError('');
    setEmailStatus('');
    setEmailBusy(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, currentPasswordForEmail);
      await reauthenticateWithCredential(auth.currentUser, cred);
      if (typeof verifyBeforeUpdateEmail === 'function') {
        await verifyBeforeUpdateEmail(auth.currentUser, newEmail);
        setEmailStatus(`Check ${newEmail} for a link to confirm this change.`);
      } else {
        await fbUpdateEmail(auth.currentUser, newEmail);
        refreshUser();
        setEmailStatus('Email updated.');
      }
      setCurrentPasswordForEmail('');
      setNewEmail('');
    } catch (err) {
      const msg = friendlyError(err);
      if (msg) setEmailError(msg);
    } finally {
      setEmailBusy(false);
    }
  }

  async function cleanUpAccountData(uid) {
    const tanks = await listTanks(uid);
    await Promise.all(tanks.map((t) => deleteTank(uid, t.id)));
    const posts = await listPostsByAuthor(uid);
    await Promise.all(posts.map((p) => deletePost(p.id)));
    await deleteUserProfile(uid);
  }

  async function handleDeleteAccount() {
    setDeleteError('');
    if (isPasswordProvider && !deletePassword) {
      setDeleteError('Enter your password to confirm.');
      return;
    }
    if (
      !window.confirm(
        'Permanently delete your account? This removes your tanks, posts, replies, and profile. This cannot be undone.'
      )
    ) {
      return;
    }
    setDeleteBusy(true);
    try {
      if (isPasswordProvider) {
        const cred = EmailAuthProvider.credential(user.email, deletePassword);
        await reauthenticateWithCredential(auth.currentUser, cred);
      } else {
        await reauthenticateWithPopup(auth.currentUser, googleProvider);
      }
      await cleanUpAccountData(user.uid);
      await deleteUser(auth.currentUser);
    } catch (err) {
      const msg = friendlyError(err);
      if (msg) setDeleteError(msg);
      setDeleteBusy(false);
    }
  }

  return (
    <div className="panel">
      <button className="link-button" onClick={onBack}>
        &larr; Back
      </button>
      <h2>Settings</h2>

      <section className="settings-section">
        <h3>Profile picture</h3>
        <div className="avatar-settings-row">
          <UserAvatar name={user.displayName || user.email} photoURL={profile?.photoURL} size="lg" />
          <div className="avatar-settings-actions">
            <label className="secondary-button">
              {avatarBusy ? 'Uploading…' : 'Change photo'}
              <input
                type="file"
                accept="image/*"
                className="file-input-hidden"
                onChange={handleAvatarChange}
                disabled={avatarBusy}
              />
            </label>
            {profile?.photoURL && (
              <button type="button" className="link-button" onClick={handleRemoveAvatar} disabled={avatarBusy}>
                Remove photo
              </button>
            )}
          </div>
        </div>
        {avatarError && <p className="error-banner">{avatarError}</p>}
        {avatarStatus && <p className="hint">{avatarStatus}</p>}
      </section>

      <section className="settings-section">
        <h3>Display name</h3>
        <form onSubmit={handleSaveName} className="settings-form">
          <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} maxLength={40} required />
          <button type="submit" className="secondary-button" disabled={nameBusy}>
            Save
          </button>
        </form>
        {nameStatus && <p className="hint">{nameStatus}</p>}
      </section>

      <section className="settings-section">
        <h3>Appearance</h3>
        <div className="theme-options" role="radiogroup" aria-label="Theme">
          {THEME_OPTIONS.map((opt) => (
            <label key={opt.value} className="theme-option">
              <input
                type="radio"
                name="theme"
                value={opt.value}
                checked={theme === opt.value}
                onChange={() => handleThemeChange(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </section>

      {isPasswordProvider ? (
        <>
          <section className="settings-section">
            <h3>Change password</h3>
            <form onSubmit={handleChangePassword} className="settings-form-stack">
              <label>
                <span>Current password</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={currentPasswordForPw}
                  onChange={(e) => setCurrentPasswordForPw(e.target.value)}
                  required
                />
              </label>
              <label>
                <span>New password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </label>
              <label>
                <span>Confirm new password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </label>
              {pwError && <p className="error-banner">{pwError}</p>}
              {pwStatus && <p className="hint">{pwStatus}</p>}
              <button type="submit" className="secondary-button" disabled={pwBusy}>
                Update password
              </button>
            </form>
          </section>

          <section className="settings-section">
            <h3>Change email</h3>
            <form onSubmit={handleChangeEmail} className="settings-form-stack">
              <label>
                <span>Current password</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={currentPasswordForEmail}
                  onChange={(e) => setCurrentPasswordForEmail(e.target.value)}
                  required
                />
              </label>
              <label>
                <span>New email</span>
                <input
                  type="email"
                  autoComplete="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
              </label>
              {emailError && <p className="error-banner">{emailError}</p>}
              {emailStatus && <p className="hint">{emailStatus}</p>}
              <button type="submit" className="secondary-button" disabled={emailBusy}>
                Update email
              </button>
            </form>
          </section>
        </>
      ) : (
        <section className="settings-section">
          <h3>Sign-in</h3>
          <p className="hint">
            You're signed in with Google ({user.email}) — password and email are managed by your Google
            account.
          </p>
        </section>
      )}

      <section className="settings-section settings-danger">
        <h3>Delete account</h3>
        <p className="hint">
          Permanently deletes your account along with your tanks, posts, replies, and profile. This
          cannot be undone.
        </p>
        {isPasswordProvider && (
          <label>
            <span>Current password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
            />
          </label>
        )}
        {deleteError && <p className="error-banner">{deleteError}</p>}
        <button type="button" className="danger-button" onClick={handleDeleteAccount} disabled={deleteBusy}>
          Delete my account
        </button>
      </section>
    </div>
  );
}
