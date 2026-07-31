import React, { useEffect, useState } from 'react';
import { getUserProfile, updateDisplayName } from '../lib/users.js';
import { listPostsByAuthor } from '../lib/forum.js';
import { listTanks } from '../lib/storage.js';
import { getSpeciesById } from '../data/species.js';
import { updateProfile } from 'firebase/auth';
import { auth } from '../lib/firebase.js';
import { useAuth } from '../context/AuthContext.jsx';

function fmtDate(d) {
  if (!d) return '';
  return d.toLocaleDateString(undefined, { dateStyle: 'medium' });
}

export default function Profile({ uid, currentUser, onBack }) {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [tanks, setTanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');

  const isOwnProfile = currentUser.uid === uid;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getUserProfile(uid), listPostsByAuthor(uid), listTanks(uid)]).then(
      ([p, userPosts, userTanks]) => {
        if (cancelled) return;
        setProfile(p);
        setPosts(userPosts);
        setTanks(userTanks);
        setLoading(false);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [uid]);

  function startEditing() {
    setNameInput(profile?.displayName || '');
    setEditing(true);
  }

  async function saveName(e) {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    await updateDisplayName(uid, trimmed);
    if (auth.currentUser?.uid === uid) {
      await updateProfile(auth.currentUser, { displayName: trimmed });
      refreshUser();
    }
    setProfile((prev) => ({ ...prev, displayName: trimmed }));
    setEditing(false);
  }

  if (loading) {
    return (
      <div className="panel">
        <button className="link-button" onClick={onBack}>
          &larr; Back
        </button>
        <p className="empty-state">Loading…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="panel">
        <button className="link-button" onClick={onBack}>
          &larr; Back
        </button>
        <p className="empty-state">User not found.</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <button className="link-button" onClick={onBack}>
        &larr; Back
      </button>

      {editing ? (
        <form onSubmit={saveName} className="tank-switcher-form">
          <input
            autoFocus
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            maxLength={40}
          />
          <button type="submit" className="link-button">
            Save
          </button>
          <button type="button" className="link-button" onClick={() => setEditing(false)}>
            Cancel
          </button>
        </form>
      ) : (
        <h2>
          {profile.displayName}
          {isOwnProfile && (
            <button className="link-button profile-edit-name" onClick={startEditing}>
              Edit
            </button>
          )}
        </h2>
      )}

      <section>
        <h3>Posts ({posts.length})</h3>
        {posts.length === 0 ? (
          <p className="empty-state">No posts yet.</p>
        ) : (
          <ul className="post-list">
            {posts.map((p) => (
              <li key={p.id} className="post-list-item">
                <div className="post-title-link">{p.title}</div>
                <p className="post-meta">{fmtDate(p.createdAt)}</p>
                <p className="post-snippet">{p.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3>Tanks ({tanks.length})</h3>
        {tanks.length === 0 ? (
          <p className="empty-state">No tanks yet.</p>
        ) : (
          <div className="profile-tanks">
            {tanks.map((t) => {
              const stocked = t.stockedIds.map(getSpeciesById).filter(Boolean);
              return (
                <div key={t.id} className="profile-tank-card">
                  <h4>{t.name}</h4>
                  {stocked.length === 0 ? (
                    <p className="empty-state">Nothing stocked yet.</p>
                  ) : (
                    <ul className="profile-tank-species">
                      {stocked.map((sp) => (
                        <li key={sp.id}>
                          {sp.name} <span className="hint">({sp.scientificName})</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
