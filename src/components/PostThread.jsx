import React, { useEffect, useState } from 'react';
import { getPost, listReplies, createReply, deletePost, deleteReply } from '../lib/forum.js';

function fmtDate(d) {
  if (!d) return '';
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function PostThread({ postId, user, onBack, onViewProfile, onPostDeleted }) {
  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getPost(postId), listReplies(postId)]).then(([p, r]) => {
      if (cancelled) return;
      setPost(p);
      setReplies(r);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  async function handleReply(e) {
    e.preventDefault();
    const trimmed = replyBody.trim();
    if (!trimmed) return;
    setPosting(true);
    const reply = await createReply(postId, user.uid, user.displayName || user.email, trimmed);
    setReplies((prev) => [...prev, reply]);
    setReplyBody('');
    setPosting(false);
  }

  async function handleDeletePost() {
    if (!window.confirm('Delete this post and all its replies?')) return;
    await deletePost(postId);
    onPostDeleted();
  }

  async function handleDeleteReply(replyId) {
    if (!window.confirm('Delete this reply?')) return;
    await deleteReply(postId, replyId);
    setReplies((prev) => prev.filter((r) => r.id !== replyId));
  }

  if (loading) {
    return (
      <div className="panel">
        <button className="link-button" onClick={onBack}>
          &larr; Back to forum
        </button>
        <p className="empty-state">Loading…</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="panel">
        <button className="link-button" onClick={onBack}>
          &larr; Back to forum
        </button>
        <p className="empty-state">This post no longer exists.</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <button className="link-button" onClick={onBack}>
        &larr; Back to forum
      </button>

      <h2>{post.title}</h2>
      <p className="post-meta">
        by{' '}
        <button className="link-button" onClick={() => onViewProfile(post.authorId)}>
          {post.authorName}
        </button>{' '}
        &middot; {fmtDate(post.createdAt)}
      </p>
      <p className="post-body">{post.body}</p>
      {user.uid === post.authorId && (
        <button className="link-button" onClick={handleDeletePost}>
          Delete post
        </button>
      )}

      <h3>Replies ({replies.length})</h3>
      {replies.length === 0 ? (
        <p className="empty-state">No replies yet — be the first.</p>
      ) : (
        <ul className="reply-list">
          {replies.map((r) => (
            <li key={r.id} className="reply-item">
              <p className="post-meta">
                <button className="link-button" onClick={() => onViewProfile(r.authorId)}>
                  {r.authorName}
                </button>{' '}
                &middot; {fmtDate(r.createdAt)}
              </p>
              <p className="post-body">{r.body}</p>
              {user.uid === r.authorId && (
                <button className="link-button" onClick={() => handleDeleteReply(r.id)}>
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleReply} className="reply-form">
        <textarea
          placeholder="Write a reply…"
          value={replyBody}
          onChange={(e) => setReplyBody(e.target.value)}
          rows={3}
          required
        />
        <button type="submit" className="primary-button" disabled={posting}>
          Post reply
        </button>
      </form>
    </div>
  );
}
