import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { firebaseConfigured } from '../lib/firebase.js';

function friendlyError(err) {
  const code = err?.code || '';
  if (code.includes('email-already-in-use')) return 'An account with that email already exists.';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
    return 'Incorrect email or password.';
  }
  if (code.includes('weak-password')) return 'Password must be at least 6 characters.';
  if (code.includes('invalid-email')) return 'Enter a valid email address.';
  if (code.includes('popup-closed-by-user')) return null;
  return err?.message || 'Something went wrong. Please try again.';
}

export default function AuthScreen() {
  const { signUp, logIn, logInWithGoogle } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'signup') {
        await signUp(email, password);
      } else {
        await logIn(email, password);
      }
    } catch (err) {
      const msg = friendlyError(err);
      if (msg) setError(msg);
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError('');
    setBusy(true);
    try {
      await logInWithGoogle();
    } catch (err) {
      const msg = friendlyError(err);
      if (msg) setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app auth-screen">
      <div className="panel auth-panel">
        <h1>Aquarium Catalog</h1>
        <p className="tagline">Sign in to build and save your own tank.</p>

        {!firebaseConfigured && (
          <p className="error-banner">
            Firebase isn't configured yet. Copy <code>.env.example</code> to <code>.env</code> and fill
            in your Firebase project's config values, then restart the dev server.
          </p>
        )}

        <div className="auth-tabs">
          <button
            type="button"
            className={`tab-button${mode === 'login' ? ' active' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Log in
          </button>
          <button
            type="button"
            className={`tab-button${mode === 'signup' ? ' active' : ''}`}
            onClick={() => { setMode('signup'); setError(''); }}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </label>

          {error && <p className="error-banner">{error}</p>}

          <button type="submit" className="primary-button" disabled={busy}>
            {mode === 'signup' ? 'Create account' : 'Log in'}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button type="button" className="secondary-button" onClick={handleGoogle} disabled={busy}>
          Continue with Google
        </button>
      </div>
    </div>
  );
}
