import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import {
  Button,
  Card,
  Modal,
  Input,
  Textarea,
  PostCardSkeleton,
  EmptyState,
  ErrorMessage,
} from '../components/ui';

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
  const [activeTab, setActiveTab] = useState('feed');
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Community</h1>
        <p className="mt-1 text-gray-600">Discuss, share, and connect with researchers and participants.</p>
      </header>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setActiveTab('feed')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'feed' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Feed
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('saved')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'saved' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Saved
            </button>
          </div>
          {activeTab === 'feed' && (
            <>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="latest">Latest</option>
                <option value="popular">Most liked</option>
                <option value="most_commented">Most commented</option>
              </select>
              <div className="flex flex-1 min-w-0 max-w-xs">
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchFeed()}
                  className="block w-full rounded-l-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <Button type="button" size="sm" onClick={fetchFeed} className="rounded-l-none">
                  Search
                </Button>
              </div>
            </>
          )}
        </div>
        <Button onClick={() => setCreateOpen(!createOpen)} className="shrink-0">
          {createOpen ? 'Cancel' : '+ New Post'}
        </Button>
      </div>

      {error && (
        <ErrorMessage message={error} onDismiss={() => setError('')} className="mb-4" />
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create discussion" size="md">
        <form onSubmit={handleCreatePost} className="space-y-4">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Post title"
            required
          />
          <Textarea
            label="Content"
            rows={4}
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="What would you like to share?"
            required
          />
          <Input
            label="Tags (comma-separated)"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="health, research"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </form>
      </Modal>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.length === 0 ? (
            <EmptyState
              icon="💬"
              title={activeTab === 'saved' ? 'No saved posts' : 'No posts yet'}
              description={
                activeTab === 'saved'
                  ? 'Save posts from the feed to find them here.'
                  : 'Be the first to start a discussion.'
              }
              action={
                activeTab === 'feed' && (
                  <Button onClick={() => setCreateOpen(true)}>Create post</Button>
                )
              }
            />
          ) : (
            posts.map((post) => (
              <Card key={post._id} className="relative">
                {post.category && (
                  <span className="absolute -top-2.5 left-4 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-semibold uppercase tracking-wide shadow">
                    {post.category}
                  </span>
                )}
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <span className="text-sm text-gray-500">
                    {post.author?.name || 'Unknown'} · {(post.author?.role || '').toLowerCase()}
                  </span>
                  <span className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</span>
                  {isAuthor(post) && (
                    <div className="flex gap-2 ml-auto">
                      <Link
                        to={`/community/${post._id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeletePost(post._id)}
                        className="text-sm font-medium text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  <Link to={`/community/${post._id}`} className="hover:text-primary transition-colors">
                    {post.title}
                  </Link>
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-3">
                  {post.content.length > 200 ? post.content.slice(0, 200) + '...' : post.content}
                </p>
                {((post.aiTags && post.aiTags.length > 0) || (post.tags && post.tags.length > 0)) && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {post.aiTags?.map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium">
                        {t}
                      </span>
                    ))}
                    {post.tags?.map((t) => (
                      <span key={'u-' + t} className="px-2 py-0.5 rounded-full bg-primary-light text-primary text-xs font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => handleLike(post._id)}
                    className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                      isLiked(post) ? 'text-red-600' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <span>{isLiked(post) ? '♥' : '♡'}</span> {post.likeCount || 0}
                  </button>
                  <Link
                    to={`/community/${post._id}`}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                  >
                    💬 {post.commentCount || 0}
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleShare(post._id)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    ↗ Share
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSave(post._id, savedIds.has(post._id))}
                    className={`text-sm font-medium ${savedIds.has(post._id) ? 'text-secondary' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {savedIds.has(post._id) ? '✓ Saved' : 'Bookmark'}
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setChatOpen((o) => !o)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-white shadow-lg hover:bg-primary-hover flex items-center justify-center text-xl z-50 transition-transform hover:scale-105"
        aria-label={chatOpen ? 'Close chat' : 'Open AI assistant'}
      >
        {chatOpen ? '✕' : '💬'}
      </button>
      {chatOpen && (
        <div className="fixed bottom-24 right-6 w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-200 flex flex-col max-h-[70vh] z-40 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-white">
            <h3 className="font-semibold">Community AI Assistant</h3>
            <button
              type="button"
              onClick={() => setChatOpen(false)}
              className="p-1 rounded hover:bg-white/20"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
            {chatMessages.length === 0 && (
              <p className="text-sm text-gray-500">Ask about health, research, or community.</p>
            )}
            {chatMessages.map((m, i) => (
              <div
                key={i}
                className={`flex flex-col max-w-[90%] ${
                  m.role === 'user' ? 'ml-auto bg-primary-light rounded-lg rounded-br-none p-3' : 'bg-gray-100 rounded-lg rounded-bl-none p-3'
                }`}
              >
                <span className="text-xs font-semibold text-gray-500 mb-0.5">{m.role === 'user' ? 'You' : 'AI'}</span>
                <p className="text-sm whitespace-pre-wrap">{m.content}</p>
              </div>
            ))}
            {chatLoading && (
              <div className="bg-gray-100 rounded-lg rounded-bl-none p-3 max-w-[90%]">
                <p className="text-sm text-gray-600">Thinking…</p>
              </div>
            )}
          </div>
          {chatError && <p className="px-4 text-sm text-red-600">{chatError}</p>}
          <form onSubmit={handleSendChat} className="flex gap-2 p-3 border-t border-gray-200">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a message..."
              disabled={chatLoading}
              maxLength={4000}
              className="flex-1 min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <Button type="submit" disabled={chatLoading || !chatInput.trim()} size="md">
              Send
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Community;
