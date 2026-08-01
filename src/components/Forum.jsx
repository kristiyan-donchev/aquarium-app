import React, { useEffect, useState } from 'react';
import { listPosts, createPost } from '../lib/forum.js';
import { initials, avatarColorClass } from '../lib/avatar.js';
import PostThread from './PostThread.jsx';

function fmtDate(d) {
  if (!d) return '';
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function snippet(text, max = 160) {
  if (text.length <= max) return text;
  return text.slice(0, max).trim() + '…';
}

export default function Forum({ user, onViewProfile }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);

  function loadPosts() {
    setLoading(true);
    listPosts().then((list) => {
      setPosts(list);
      setLoading(false);
    });
  }

  useEffect(() => {
    loadPosts();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    const t = title.trim();
    const b = body.trim();
    if (!t || !b) return;
    setPosting(true);
    const post = await createPost(user.uid, user.displayName || user.email, t, b);
    setPosts((prev) => [post, ...prev]);
    setTitle('');
    setBody('');
    setCreating(false);
    setPosting(false);
  }

  if (selectedPostId) {
    return (
      <PostThread
        postId={selectedPostId}
        user={user}
        onBack={() => setSelectedPostId(null)}
        onViewProfile={onViewProfile}
        onPostDeleted={() => {
          setSelectedPostId(null);
          loadPosts();
        }}
      />
    );
  }

  return (
    <div className="panel">
      <h2>Forum</h2>
      <p className="hint">Ask questions, share tips, and talk tanks with other hobbyists.</p>

      {creating ? (
        <form onSubmit={handleCreate} className="post-form">
          <label>
            <span>Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              required
            />
          </label>
          <label>
            <span>Post</span>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} required />
          </label>
          <div className="post-form-actions">
            <button type="submit" className="primary-button" disabled={posting}>
              Publish
            </button>
            <button type="button" className="secondary-button" onClick={() => setCreating(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="primary-button post-new-button" onClick={() => setCreating(true)}>
          New post
        </button>
      )}

      {loading ? (
        <p className="empty-state">Loading…</p>
      ) : posts.length === 0 ? (
        <p className="empty-state">No posts yet — start the conversation.</p>
      ) : (
        <ul className="post-list">
          {posts.map((p) => (
            <li
              key={p.id}
              className="post-card post-card-clickable"
              role="button"
              tabIndex={0}
              onClick={() => setSelectedPostId(p.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedPostId(p.id);
                }
              }}
            >
              <div className={`avatar ${avatarColorClass(p.authorName)}`} aria-hidden="true">
                {initials(p.authorName)}
              </div>
              <div className="post-card-body">
                <h3 className="post-card-title">{p.title}</h3>
                <p className="post-meta">
                  by{' '}
                  <button
                    className="link-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewProfile(p.authorId);
                    }}
                  >
                    {p.authorName}
                  </button>{' '}
                  &middot; {fmtDate(p.createdAt)}
                </p>
                <p className="post-snippet">{snippet(p.body)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
