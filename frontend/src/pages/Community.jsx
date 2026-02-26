import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Community.css';
import {
  getPosts,
  createPost,
  likeToggle,
  sharePost,
  savePost,
  unsavePost,
  getSavedPosts,
} from '../api/posts';

const Community = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sort, setSort] = useState('latest');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', tags: '' });
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'saved'
  const [likedPostIds, setLikedPostIds] = useState(new Set());

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user._id;

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchFeed();
  }, [token, sort, activeTab]);

  useEffect(() => {
    if (token && activeTab === 'saved') fetchSaved();
  }, [token, activeTab]);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const params = { sort };
      if (search.trim()) params.q = search.trim();
      const { data } = await getPosts(params);
      const list = data.posts || [];
      setPosts(list);
      const liked = new Set();
      list.forEach((p) => {
        if (p.likes && userId && p.likes.some((l) => String(l === 'object' ? l._id : l) === String(userId))) liked.add(p._id);
      });
      setLikedPostIds(liked);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load posts');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSaved = async () => {
    try {
      setLoading(true);
      const { data } = await getSavedPosts();
      const list = data.posts || [];
      setPosts(list);
      setSavedIds(new Set(list.map((p) => p._id)));
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load saved posts');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required');
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };
      await createPost(payload);
      setFormData({ title: '', content: '', tags: '' });
      setCreateOpen(false);
      fetchFeed();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const { data } = await likeToggle(postId);
      setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, likeCount: data.likeCount } : p)));
      setLikedPostIds((prev) => {
        const next = new Set(prev);
        if (data.liked) next.add(postId);
        else next.delete(postId);
        return next;
      });
    } catch (_) {}
  };

  const handleShare = async (postId) => {
    try {
      await sharePost(postId);
      const url = `${window.location.origin}/community/${postId}`;
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
      setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, shareCount: (p.shareCount || 0) + 1 } : p)));
    } catch (_) {
      alert('Could not copy link');
    }
  };

  const handleSave = async (postId, isSaved) => {
    try {
      if (isSaved) await unsavePost(postId);
      else await savePost(postId);
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (isSaved) next.delete(postId);
        else next.add(postId);
        return next;
      });
    } catch (_) {}
  };

  const isLiked = (post) => likedPostIds.has(post._id);

  if (!token) return null;

  return (
    <div className="community-page">
      <div className="community-header">
        <h1>Community</h1>
        <p className="community-subtitle">Discuss, share, and connect with researchers and participants.</p>
      </div>

      <div className="community-toolbar">
        <div className="community-tabs">
          <button className={activeTab === 'feed' ? 'active' : ''} onClick={() => setActiveTab('feed')}>
            Feed
          </button>
          <button className={activeTab === 'saved' ? 'active' : ''} onClick={() => setActiveTab('saved')}>
            Saved
          </button>
        </div>
        {activeTab === 'feed' && (
          <>
            <div className="community-sort">
              <label>Sort:</label>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="latest">Latest</option>
                <option value="popular">Most liked</option>
                <option value="most_commented">Most commented</option>
              </select>
            </div>
            <div className="community-search">
              <input
                type="text"
                placeholder="Search posts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchFeed()}
              />
              <button type="button" className="btn btn-primary" onClick={fetchFeed}>
                Search
              </button>
            </div>
          </>
        )}
        <button className="btn btn-primary" onClick={() => setCreateOpen(!createOpen)}>
          {createOpen ? 'Cancel' : '+ New Post'}
        </button>
      </div>

      {error && <div className="community-error">{error}</div>}

      {createOpen && (
        <div className="community-create-card">
          <h3>Create discussion</h3>
          <form onSubmit={handleCreatePost}>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input
                type="text"
                className="form-input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Post title"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Content</label>
              <textarea
                className="form-input"
                rows={4}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="What would you like to share?"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tags (comma-separated)</label>
              <input
                type="text"
                className="form-input"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="health, research"
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Posting...' : 'Post'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="community-loading">Loading...</div>
      ) : (
        <div className="community-feed">
          {posts.length === 0 ? (
            <p className="community-empty">
              {activeTab === 'saved' ? 'No saved posts.' : 'No posts yet. Be the first to post!'}
            </p>
          ) : (
            posts.map((post) => (
              <article key={post._id} className="post-card">
                <div className="post-card-header">
                  <span className="post-author">
                    {post.author?.name || 'Unknown'} · {(post.author?.role || '').toLowerCase()}
                  </span>
                  <span className="post-date">{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 className="post-title">
                  <Link to={`/community/${post._id}`}>{post.title}</Link>
                </h3>
                <p className="post-content">{post.content.length > 200 ? post.content.slice(0, 200) + '...' : post.content}</p>
                {post.tags && post.tags.length > 0 && (
                  <div className="post-tags">
                    {post.tags.map((t) => (
                      <span key={t} className="post-tag">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <div className="post-actions">
                  <button
                    type="button"
                    className={`post-action ${isLiked(post) ? 'liked' : ''}`}
                    onClick={() => handleLike(post._id)}
                    title="Like"
                  >
                    ♥ {post.likeCount || 0}
                  </button>
                  <Link to={`/community/${post._id}`} className="post-action">
                    💬 {post.commentCount || 0}
                  </Link>
                  <button type="button" className="post-action" onClick={() => handleShare(post._id)} title="Share / Copy link">
                    ↗ Share
                  </button>
                  <button
                    type="button"
                    className={`post-action ${savedIds.has(post._id) ? 'saved' : ''}`}
                    onClick={() => handleSave(post._id, savedIds.has(post._id))}
                    title="Save"
                  >
                    {savedIds.has(post._id) ? '✓ Saved' : 'Save'}
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Community;
