import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageSquare, Share2, Bookmark } from 'lucide-react';
import {
  getPosts,
  getPostSuggestions,
  createPost,
  likeToggle,
  votePoll,
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
  const [activeTag, setActiveTag] = useState('');
  const [activeAuthor, setActiveAuthor] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', tags: '' });
  const [postImageFile, setPostImageFile] = useState(null);
  const [pollEnabled, setPollEnabled] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('feed');
  const [likedPostIds, setLikedPostIds] = useState(new Set());
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const [voteStateByPost, setVoteStateByPost] = useState({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [pageSize] = useState(10);
  const [pageWindowStart, setPageWindowStart] = useState(1);
  const suggestionHideTimerRef = useRef(null);

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user._id;
  const [followedTopics, setFollowedTopics] = useState(() => {
    try {
      const raw = localStorage.getItem('community_followed_topics');
      const parsed = JSON.parse(raw || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  });

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (activeTab === 'feed') {
      setPage(1);
      setPageWindowStart(1);
      fetchFeed({ newPage: 1 });
    }
  }, [token, sort, activeTab, activeTag, activeAuthor, followedTopics]);

  useEffect(() => {
    if (token && activeTab === 'saved') {
      setPage(1);
      setPageWindowStart(1);
      fetchSaved();
    }
  }, [token, activeTab]);

  useEffect(() => {
    if (activeTab !== 'feed') {
      setSearchSuggestions([]);
      return;
    }
    const term = search.trim();
    if (term.length < 2) {
      setSearchSuggestions([]);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const { data } = await getPostSuggestions(term);
        setSearchSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : []);
      } catch (_) {
        setSearchSuggestions([]);
      }
    }, 220);
    return () => clearTimeout(handle);
  }, [search, activeTab]);

  const fetchFeed = async (overrides = {}) => {
    try {
      setLoading(true);
      const appliedSort = overrides.sort ?? sort;
      const appliedSearch = overrides.search ?? search;
      const appliedTag = overrides.tag ?? activeTag;
      const appliedAuthor = overrides.author ?? activeAuthor;
      const appliedPage = overrides.newPage ?? page;

      const params = { sort: appliedSort, page: appliedPage, limit: pageSize };
      if (String(appliedSearch || '').trim()) params.q = String(appliedSearch).trim();
      if (appliedTag) params.tag = appliedTag;
      if (appliedAuthor) params.author = appliedAuthor;
      if (appliedSort === 'following' && followedTopics.length > 0) {
        params.followingTags = followedTopics.join(',');
      }
      const { data } = await getPosts(params);
      const list = data.posts || [];
      setPosts(list);
      
      // Handle pagination metadata
      if (data.pagination) {
        setTotal(data.pagination.total || 0);
        setTotalPages(data.pagination.totalPages || 0);
        setHasNextPage(data.pagination.hasNextPage || false);
        setHasPrevPage(data.pagination.hasPrevPage || false);
        setPage(appliedPage);
      }
      
      const liked = new Set();
      const voteState = {};
      list.forEach((p) => {
        const likeIds = Array.isArray(p.likes) ? p.likes : [];
        const downvoteIds = Array.isArray(p.downvotes) ? p.downvotes : [];
        const likedByMe = likeIds.some((l) => String(l && (l._id || l)) === String(userId));
        const downvotedByMe = downvoteIds.some((l) => String(l && (l._id || l)) === String(userId));
        if (likedByMe) liked.add(p._id);
        voteState[p._id] = likedByMe ? 'up' : (downvotedByMe ? 'down' : null);
      });
      setLikedPostIds(liked);
      setVoteStateByPost(voteState);
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
      const voteState = {};
      list.forEach((p) => {
        const likeIds = Array.isArray(p.likes) ? p.likes : [];
        const downvoteIds = Array.isArray(p.downvotes) ? p.downvotes : [];
        const likedByMe = likeIds.some((l) => String(l && (l._id || l)) === String(userId));
        const downvotedByMe = downvoteIds.some((l) => String(l && (l._id || l)) === String(userId));
        voteState[p._id] = likedByMe ? 'up' : (downvotedByMe ? 'down' : null);
      });
      setVoteStateByPost(voteState);
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
    if (pollEnabled) {
      const question = pollQuestion.trim();
      const options = pollOptions.map((opt) => opt.trim()).filter(Boolean);
      if (!question) {
        setError('Poll question is required when poll is enabled');
        return;
      }
      if (options.length < 2) {
        setError('Add at least 2 poll options');
        return;
      }
    }
    try {
      setSubmitting(true);
      const payload = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };
      if (pollEnabled) {
        payload.poll = {
          question: pollQuestion.trim(),
          options: pollOptions.map((opt) => opt.trim()).filter(Boolean),
        };
      }
      if (postImageFile) {
        console.log(`🖼️ Image file selected for post:`, postImageFile.name, `(${(postImageFile.size/1024).toFixed(1)}KB)`);
        payload.imageFile = postImageFile;
      } else {
        console.log(`🖼️ No image file selected`);
      }
      console.log(`📤 Creating post with payload:`, { hasTitle: !!payload.title, hasContent: !!payload.content, hasPoll: !!payload.poll, hasImage: !!payload.imageFile});
      const result = await createPost(payload);
      console.log(`✅ Post created successfully. Response image field:`, result?.data?.post?.image || 'undefined');
      setFormData({ title: '', content: '', tags: '' });
      setPostImageFile(null);
      setPollEnabled(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      setCreateOpen(false);
      fetchFeed();
    } catch (err) {
      console.error(`❌ Failed to create post:`, err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const persistFollowedTopics = (topics) => {
    if (!Array.isArray(topics) || topics.length === 0) return;
    try {
      const next = Array.from(new Set([...(followedTopics || []), ...topics.map((t) => String(t).trim()).filter(Boolean)])).slice(0, 30);
      localStorage.setItem('community_followed_topics', JSON.stringify(next));
      setFollowedTopics(next);
    } catch (_) {}
  };

  const handleLike = async (postId, vote = 'up') => {
    try {
      const { data } = await likeToggle(postId, { vote });
      setPosts((prev) => prev.map((p) => (
        p._id === postId
          ? {
              ...p,
              likeCount: data.upvoteCount ?? data.likeCount ?? p.likeCount ?? 0,
              upvoteCount: data.upvoteCount ?? p.upvoteCount ?? p.likeCount ?? 0,
              downvoteCount: data.downvoteCount ?? p.downvoteCount ?? 0,
              score: data.score ?? ((data.upvoteCount ?? p.upvoteCount ?? 0) - (data.downvoteCount ?? p.downvoteCount ?? 0)),
            }
          : p
      )));
      setLikedPostIds((prev) => {
        const next = new Set(prev);
        if (data.voted === 'up' || data.liked) next.add(postId);
        else next.delete(postId);
        return next;
      });
      setVoteStateByPost((prev) => ({ ...prev, [postId]: data.voted || null }));
      const target = posts.find((p) => p._id === postId);
      if (vote === 'up' && target) {
        const tags = [...(target.tags || []), ...(target.aiTags || [])];
        persistFollowedTopics(tags);
      }
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

  const handlePollVote = async (postId, optionIndex) => {
    try {
      const { data } = await votePoll(postId, optionIndex);
      const nextPoll = data?.poll;
      if (!nextPoll) return;
      setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, poll: nextPoll } : p)));
    } catch (_) {}
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

  const handleTagClick = (tag) => {
    setActiveTag(tag);
    setActiveAuthor('');
    setSort('latest');
  };

  const clearDiscoveryFilters = () => {
    setActiveTag('');
    setActiveAuthor('');
  };

  const applySuggestion = (suggestion) => {
    if (!suggestion) return;
    if (suggestion.type === 'tag') {
      setActiveTag(suggestion.value);
      setActiveAuthor('');
      setSearch('');
      setPage(1);
      setPageWindowStart(1);
    } else if (suggestion.type === 'user') {
      setActiveAuthor(suggestion.value);
      setActiveTag('');
      setSearch('');
      setPage(1);
      setPageWindowStart(1);
    } else {
      setSearch(suggestion.value);
      setPage(1);
      setPageWindowStart(1);
      fetchFeed({ search: suggestion.value, newPage: 1 });
    }
    setShowSuggestions(false);
  };

  const highlightText = (text, term) => {
    const value = String(text || '');
    const query = String(term || '').trim();
    if (!query) return value;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'i');
    const parts = value.split(regex);
    return parts.map((part, idx) => (
      part.toLowerCase() === query.toLowerCase()
        ? <mark key={`m-${idx}`} className="bg-amber-100 text-amber-900 px-0.5 rounded-sm">{part}</mark>
        : <React.Fragment key={`t-${idx}`}>{part}</React.Fragment>
    ));
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <header className="mb-6 sm:mb-8 rounded-2xl border border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-emerald-50 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Community</h1>
            <p className="mt-1 text-gray-600">Discuss, share, and connect with researchers and participants.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-white/80 border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
              {total > 0 ? `${posts.length} on page ${page}` : '0'} posts
            </span>
            <span className="inline-flex items-center rounded-full bg-white/80 border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
              {savedIds.size} saved
            </span>
          </div>
        </div>
      </header>

      <div className="sticky top-4 z-20 mb-6 rounded-2xl border border-slate-200 bg-white/90 backdrop-blur p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
                <option value="trending">Trending</option>
                <option value="most_discussed">Most Discussed</option>
                <option value="following">Following</option>
              </select>
              <div className="relative flex flex-1 min-w-0 max-w-sm">
                <input
                  type="text"
                  placeholder="Search posts, tags, users..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => {
                    if (suggestionHideTimerRef.current) clearTimeout(suggestionHideTimerRef.current);
                    suggestionHideTimerRef.current = setTimeout(() => setShowSuggestions(false), 150);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && fetchFeed({ newPage: 1 })}
                  className="block w-full rounded-l-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <Button type="button" size="sm" onClick={() => fetchFeed({ newPage: 1 })} className="rounded-l-none shadow-none">
                  Search
                </Button>
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-20 rounded-lg border border-gray-200 bg-white shadow-lg max-h-72 overflow-y-auto">
                    {searchSuggestions.map((s, idx) => (
                      <button
                        key={`${s.type}-${s.value}-${idx}`}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applySuggestion(s)}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b last:border-b-0 border-slate-100"
                      >
                        <p className="text-sm text-slate-800">{s.value}</p>
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">{s.type} · {s.count || 0} posts</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {(activeTag || activeAuthor) && (
                <button
                  type="button"
                  onClick={clearDiscoveryFilters}
                  className="text-xs font-semibold text-slate-600 px-2 py-1 rounded-md border border-slate-200 hover:bg-slate-50"
                >
                  Clear filters
                </button>
              )}
            </>
          )}
        </div>
        <Button
          onClick={() => setCreateOpen(!createOpen)}
          className="shrink-0 px-5 py-3 text-base font-semibold shadow-lg shadow-primary/20 bg-primary hover:bg-primary-hover rounded-xl"
        >
          {createOpen ? 'Cancel' : '+ New Post'}
        </Button>
      </div>
      </div>

      <div className="mb-5 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-emerald-50 px-4 py-3 shadow-sm">
        <p className="text-sm text-slate-700">
          Share your research question, findings, or a quick discussion point to get feedback from the community.
        </p>
      </div>

      {(activeTag || activeAuthor || sort === 'following') && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {sort === 'following' && (
            <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
              Following topics
            </span>
          )}
          {activeTag && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
              Tag: {activeTag}
            </span>
          )}
          {activeAuthor && (
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
              User: {activeAuthor}
            </span>
          )}
        </div>
      )}

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
            className="bg-white"
            required
          />
          <Textarea
            label="Content"
            rows={4}
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="What would you like to share?"
            className="bg-white"
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image (optional)</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={(e) => setPostImageFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary-hover"
            />
            {postImageFile && (
              <p className="mt-1 text-xs text-gray-500">
                {postImageFile.name} ({(postImageFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
          <Input
            label="Tags (comma-separated)"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="health, research"
            className="bg-white"
          />
          <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-3">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-800">
              <input
                type="checkbox"
                checked={pollEnabled}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setPollEnabled(checked);
                  if (!checked) {
                    setPollQuestion('');
                    setPollOptions(['', '']);
                  }
                }}
                className="h-4 w-4 rounded border border-slate-300 !bg-white accent-[#023047]"
                style={{ backgroundColor: '#ffffff' }}
              />
              Add poll
            </label>
            {pollEnabled && (
              <div className="space-y-3">
                <Input
                  label="Poll question"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="Ask the community something"
                  maxLength={200}
                  className="bg-white"
                  required
                />
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Poll options</label>
                  {pollOptions.map((option, index) => (
                    <div key={`poll-option-${index}`} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const next = [...pollOptions];
                          next[index] = e.target.value;
                          setPollOptions(next);
                        }}
                        placeholder={`Option ${index + 1}`}
                        className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      {pollOptions.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setPollOptions((prev) => prev.filter((_, i) => i !== index))}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-slate-500">Add at least 2 options, up to 6.</p>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="bg-white"
                      disabled={pollOptions.length >= 6}
                      onClick={() => setPollOptions((prev) => (prev.length >= 6 ? prev : [...prev, '']))}
                    >
                      + Add option
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
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
              <Card key={post._id} className="relative border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-200">
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
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2 tracking-tight leading-tight">
                  <Link to={`/community/${post._id}`} className="hover:text-primary transition-colors">
                    {highlightText(post.title, search)}
                  </Link>
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-3">
                  {highlightText(post.content.length > 220 ? post.content.slice(0, 220) + '...' : post.content, search)}
                </p>
                {post.poll?.question && Array.isArray(post.poll?.options) && post.poll.options.length > 0 && (
                  <div className="mb-3 rounded-xl border-2 border-blue-300 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 p-3 shadow-sm">
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="text-lg">🗳️</span>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-blue-900">{post.poll.question}</p>
                        <p className="text-xs text-blue-600">{post.poll.totalVotes || 0} vote{post.poll.totalVotes === 1 ? '' : 's'}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {post.poll.options.map((opt, idx) => {
                        const isSelected = post.poll.selectedOptionIndex === idx;
                        const label = typeof opt === 'string' ? opt : opt?.text;
                        const voteCount = typeof opt === 'object' ? (opt.voteCount || 0) : 0;
                        const percentage = typeof opt === 'object' ? (opt.percentage || 0) : 0;
                        return (
                          <button
                            key={`poll-opt-${post._id}-${idx}`}
                            type="button"
                            onClick={() => handlePollVote(post._id, idx)}
                            className={`w-full text-left rounded-lg border-2 px-3 py-2 transition-all ${
                              isSelected
                                ? 'border-blue-500 bg-white shadow-md ring-1 ring-blue-200'
                                : 'border-blue-200 bg-white hover:border-blue-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-xs font-semibold text-blue-900">
                                {isSelected && '✓ '}{label}
                              </span>
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{percentage}%</span>
                            </div>
                            <div className="w-full bg-blue-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {((post.aiTags && post.aiTags.length > 0) || (post.tags && post.tags.length > 0)) && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {post.aiTags?.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleTagClick(t)}
                        className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium hover:bg-emerald-100 transition-colors"
                      >
                        {t}
                      </button>
                    ))}
                    {post.tags?.map((t) => (
                      <button
                        key={'u-' + t}
                        type="button"
                        onClick={() => handleTagClick(t)}
                        className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium hover:bg-slate-200 transition-colors"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
                {post.topComment?.content && (
                  <Link
                    to={`/community/${post._id}`}
                    className="block mb-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 hover:border-slate-300 transition-colors"
                  >
                    <p className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">
                      Top comment {post.topComment?.author?.name ? `by ${post.topComment.author.name}` : ''}
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {highlightText(String(post.topComment.content).slice(0, 130) + (String(post.topComment.content).length > 130 ? '...' : ''), search)}
                    </p>
                  </Link>
                )}
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100 mt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleLike(post._id, 'up')}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors border ${
                        isLiked(post) ? 'text-red-600 bg-red-50' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      title="Like this post"
                    >
                      <Heart size={16} fill={isLiked(post) ? 'currentColor' : 'none'} />
                      <span className="text-xs font-medium">{post.upvoteCount || post.likeCount || 0}</span>
                    </button>
                    <Link
                      to={`/community/${post._id}`}
                      className="flex items-center gap-1.5 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                      title="View comments"
                    >
                      <MessageSquare size={16} />
                      <span className="text-xs font-medium">{post.commentCount || 0}</span>
                    </Link>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleShare(post._id)}
                      className="text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
                      title="Share this post"
                    >
                      <Share2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSave(post._id, savedIds.has(post._id))}
                      className={`p-2 rounded-lg transition-colors ${
                        savedIds.has(post._id) ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      title={savedIds.has(post._id) ? 'Remove from bookmarks' : 'Bookmark this post'}
                    >
                      <Bookmark size={16} fill={savedIds.has(post._id) ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {total >= 10 && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8 px-4 py-6 rounded-2xl border border-slate-200 bg-slate-50">
          {totalPages > 3 && (
            <button
              onClick={() => setPageWindowStart(Math.max(1, pageWindowStart - 3))}
              disabled={pageWindowStart === 1 || loading}
              className="btn btn-sm btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous pages"
            >
              ←
            </button>
          )}
          
          <div className="flex gap-2">
            {Array.from({ length: Math.min(3, totalPages - pageWindowStart + 1) }, (_, i) => pageWindowStart + i).map((pageNum) => (
              <button
                key={`page-${pageNum}`}
                onClick={() => {
                  setPage(pageNum);
                  fetchFeed({ newPage: pageNum });
                }}
                disabled={loading}
                className={`btn btn-sm w-12 h-12 rounded-lg border-2 transition-all ${
                  pageNum === page 
                    ? 'btn-active bg-primary text-white border-primary' 
                    : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>
          
          {totalPages > 3 && pageWindowStart + 2 < totalPages && (
            <button
              onClick={() => setPageWindowStart(Math.min(totalPages - 2, pageWindowStart + 3))}
              disabled={pageWindowStart + 2 >= totalPages || loading}
              className="btn btn-sm btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next pages"
            >
              →
            </button>
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
          <form onSubmit={handleSendChat} className="flex gap-2 p-3 border-t border-gray-200 bg-white">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a message..."
              disabled={chatLoading}
              maxLength={4000}
              className="flex-1 min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-white"
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
