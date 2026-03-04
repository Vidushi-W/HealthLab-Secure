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
  deletePost,
  sendChatMessage,
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
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');

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

  const isAuthor = (post) => {
    if (!userId || !post.author) return false;
    const authorId = post.author._id || post.author;
    return String(authorId) === String(userId);
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    try {
      await deletePost(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete post');
    }
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    const text = (chatInput || '').trim();
    if (!text || chatLoading) return;
    setChatError('');
    setChatMessages((prev) => [...prev, { role: 'user', content: text }]);
    setChatInput('');
    setChatLoading(true);
    try {
      const history = chatMessages.map((m) => ({ role: m.role, content: m.content }));
      const { data } = await sendChatMessage({ message: text, history });
      const reply = (data && data.reply) ? data.reply : 'No response.';
      setChatMessages((prev) => [...prev, { role: 'model', content: reply }]);
    } catch (err) {
      setChatError(err.response?.data?.message || 'Failed to get reply');
      setChatMessages((prev) => prev.slice(0, -1));
    } finally {
      setChatLoading(false);
    }
  };

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
                {post.category && (
                  <div className="post-card-category-wrap">
                    <span className="post-card-category" title="AI category">{post.category}</span>
                  </div>
                )}
                <div className="post-card-header">
                  <span className="post-author">
                    {post.author?.name || 'Unknown'} · {(post.author?.role || '').toLowerCase()}
                  </span>
                  <span className="post-date">{new Date(post.createdAt).toLocaleDateString()}</span>
                  {isAuthor(post) && (
                    <div className="post-card-author-actions">
                      <Link to={`/community/${post._id}`} className="post-action post-action-edit">Edit</Link>
                      <button type="button" className="post-action post-action-delete" onClick={() => handleDeletePost(post._id)}>Delete</button>
                    </div>
                  )}
                </div>
                <h3 className="post-title">
                  <Link to={`/community/${post._id}`}>{post.title}</Link>
                </h3>
                <p className="post-content">{post.content.length > 200 ? post.content.slice(0, 200) + '...' : post.content}</p>
                {((post.aiTags && post.aiTags.length > 0) || (post.tags && post.tags.length > 0)) && (
                  <div className="post-tags-wrap">
                    {post.aiTags && post.aiTags.length > 0 && (
                      post.aiTags.map((t) => (
                        <span key={t} className="post-tag post-tag-ai" title="AI tag">{t}</span>
                      ))
                    )}
                    {post.tags && post.tags.length > 0 && (
                      post.tags.map((t) => (
                        <span key={'u-' + t} className="post-tag">{t}</span>
                      ))
                    )}
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

      {/* AI Chatbot */}
      <button
        type="button"
        className="community-chat-fab"
        onClick={() => setChatOpen((o) => !o)}
        title="AI assistant"
        aria-label="Open AI chat"
      >
        {chatOpen ? '✕' : '💬'}
      </button>
      {chatOpen && (
        <div className="community-chat-panel">
          <div className="community-chat-header">
            <h3>Community AI Assistant</h3>
            <button type="button" className="community-chat-close" onClick={() => setChatOpen(false)} aria-label="Close">✕</button>
          </div>
          <div className="community-chat-messages">
            {chatMessages.length === 0 && (
              <p className="community-chat-placeholder">Ask about health, research, or community. I’m here to help.</p>
            )}
            {chatMessages.map((m, i) => (
              <div key={i} className={`community-chat-msg community-chat-msg-${m.role}`}>
                <span className="community-chat-msg-role">{m.role === 'user' ? 'You' : 'AI'}</span>
                <p className="community-chat-msg-content">{m.content}</p>
              </div>
            ))}
            {chatLoading && <div className="community-chat-msg community-chat-msg-model"><p className="community-chat-msg-content">Thinking…</p></div>}
          </div>
          {chatError && <p className="community-chat-error">{chatError}</p>}
          <form onSubmit={handleSendChat} className="community-chat-form">
            <input
              type="text"
              className="form-input community-chat-input"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a message..."
              disabled={chatLoading}
              maxLength={4000}
            />
            <button type="submit" className="btn btn-primary community-chat-send" disabled={chatLoading || !chatInput.trim()}>
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Community;
