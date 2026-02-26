import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import '../pages/Community.css';
import {
  getPostById,
  getSavedPosts,
  addComment,
  likeToggle,
  sharePost,
  savePost,
  unsavePost,
  deleteComment,
  updatePost,
  deletePost as deletePostApi,
} from '../api/posts';

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', content: '', tags: [] });

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchPost();
  }, [id, token]);

  const fetchPost = () => {
    getPostById(id)
      .then(({ data }) => {
        const p = data.post ?? data;
        setPost(p);
        setLiked(p?.likes?.some((l) => String(l && (l._id || l)) === String(user._id)) || false);
        return getSavedPosts();
      })
      .then((res) => {
        const savedList = res?.data?.posts || [];
        setSaved(savedList.some((s) => s._id === id));
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load post'))
      .finally(() => setLoading(false));
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      setSubmitting(true);
      await addComment(id, commentText.trim());
      setCommentText('');
      fetchPost();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async () => {
    try {
      const { data } = await likeToggle(id);
      setPost((p) => (p ? { ...p, likeCount: data.likeCount } : p));
      setLiked(data.liked);
    } catch (_) {}
  };

  const handleShare = async () => {
    try {
      await sharePost(id);
      const url = `${window.location.origin}/community/${id}`;
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
      setPost((p) => (p ? { ...p, shareCount: (p.shareCount || 0) + 1 } : p));
    } catch (_) {
      alert('Could not copy link');
    }
  };

  const handleSave = async () => {
    try {
      if (saved) await unsavePost(id);
      else await savePost(id);
      setSaved(!saved);
    } catch (_) {}
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await deleteComment(id, commentId);
      fetchPost();
    } catch (_) {}
  };

  const isAuthor = post && user._id && (String((post.author && (post.author._id || post.author))) === String(user._id));

  const handleStartEdit = () => {
    setEditForm({
      title: post.title || '',
      content: post.content || '',
      tags: Array.isArray(post.tags) ? post.tags.join(', ') : '',
    });
    setEditing(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: editForm.title.trim(),
        content: editForm.content.trim(),
        tags: editForm.tags ? editForm.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };
      const { data } = await updatePost(id, payload);
      const updated = data.post ?? data;
      setPost(updated);
      setEditForm({ title: updated.title || '', content: updated.content || '', tags: Array.isArray(updated.tags) ? updated.tags.join(', ') : '' });
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update post');
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    try {
      await deletePostApi(id);
      navigate('/community');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete post');
    }
  };

  if (!token) return null;
  if (loading) return <div className="community-loading">Loading...</div>;
  if (error && !post) return <div className="community-error">{error}</div>;
  if (!post) return <div className="community-error">Post not found.</div>;

  const comments = (post.comments || []).filter((c) => c.status !== 'hidden');
  const isAdmin = (user.role || '').toLowerCase() === 'admin';

  return (
    <div className="post-detail-page">
      <Link to="/community" className="post-detail-back">
        ← Back to Community
      </Link>

      <article className="post-detail-card">
        <div className="post-card-header">
          <span className="post-author">
            {post.author?.name || 'Unknown'} · {(post.author?.role || '').toLowerCase()}
          </span>
          <span className="post-date">{new Date(post.createdAt).toLocaleString()}</span>
          {isAuthor && (
            <div className="post-author-actions">
              {!editing ? (
                <>
                  <button type="button" className="btn btn-edit" onClick={handleStartEdit}>Edit</button>
                  <button type="button" className="btn btn-danger-sm" onClick={handleDeletePost}>Delete</button>
                </>
              ) : (
                <button type="button" className="btn" onClick={() => setEditing(false)}>Cancel</button>
              )}
            </div>
          )}
        </div>
        {!editing ? (
          <>
            <h1 className="post-detail-title">{post.title}</h1>
            <p className="post-detail-content">{post.content}</p>
          </>
        ) : (
          <form onSubmit={handleSaveEdit} className="post-edit-form">
            <input
              type="text"
              className="form-input"
              value={editForm.title}
              onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Title"
              required
            />
            <textarea
              className="form-input"
              rows={6}
              value={editForm.content}
              onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Content"
              required
            />
            <input
              type="text"
              className="form-input"
              value={editForm.tags}
              onChange={(e) => setEditForm((f) => ({ ...f, tags: e.target.value }))}
              placeholder="Tags (comma-separated)"
            />
            <button type="submit" className="btn btn-primary">Save changes</button>
          </form>
        )}
        {post.tags && post.tags.length > 0 && (
          <div className="post-tags">
            {post.tags.map((t) => (
              <span key={t} className="post-tag">
                {t}
              </span>
            ))}
          </div>
        )}
        {!editing && (
          <div className="post-actions">
            <button type="button" className={`post-action ${liked ? 'liked' : ''}`} onClick={handleLike}>
              ♥ {post.likeCount || 0}
            </button>
            <button type="button" className="post-action" onClick={handleShare}>
              ↗ Share ({post.shareCount || 0})
            </button>
            <button type="button" className={`post-action ${saved ? 'saved' : ''}`} onClick={handleSave}>
              {saved ? '✓ Saved' : 'Save'}
            </button>
          </div>
        )}
      </article>

      <section className="post-detail-comments">
        <h3>Comments ({comments.length})</h3>
        <form onSubmit={handleAddComment} className="comment-form">
          <textarea
            className="form-input"
            rows={3}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment..."
          />
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Posting...' : 'Post comment'}
          </button>
        </form>
        <div className="comment-list">
          {comments.length === 0 ? (
            <p className="text-secondary">No comments yet.</p>
          ) : (
            comments.map((c) => (
              <div key={c._id} className="comment-item">
                <div className="comment-header">
                  <strong>{c.author?.name || 'Unknown'}</strong>
                  <span className="comment-date">{new Date(c.createdAt).toLocaleString()}</span>
                  {(c.author && (c.author._id || c.author) === user._id) || isAdmin ? (
                    <button
                      type="button"
                      className="comment-delete"
                      onClick={() => handleDeleteComment(c._id)}
                      title="Delete comment"
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
                <p className="comment-content">{c.content}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default PostDetail;
