import React, { useEffect, useState } from 'react';
import { getUserProfile } from '../lib/users.js';
import { listPostsByAuthor } from '../lib/forum.js';
import { listTanks } from '../lib/storage.js';
import { getSpeciesById } from '../data/species.js';
import { initials, avatarColorClass } from '../lib/avatar.js';

function fmtDate(d) {
  if (!d) return '';
  return d.toLocaleDateString(undefined, { dateStyle: 'medium' });
}

export default function Profile({ uid, onBack }) {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [tanks, setTanks] = useState([]);
  const [loading, setLoading] = useState(true);

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

      <h2>{profile.displayName}</h2>

      <section>
        <h3>Posts ({posts.length})</h3>
        {posts.length === 0 ? (
          <p className="empty-state">No posts yet.</p>
        ) : (
          <ul className="post-list">
            {posts.map((p) => (
              <li key={p.id} className="post-card">
                <div className={`avatar ${avatarColorClass(profile.displayName)}`} aria-hidden="true">
                  {initials(profile.displayName)}
                </div>
                <div className="post-card-body">
                  <h3 className="post-card-title">{p.title}</h3>
                  <p className="post-meta">{fmtDate(p.createdAt)}</p>
                  <p className="post-snippet">{p.body}</p>
                </div>
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
