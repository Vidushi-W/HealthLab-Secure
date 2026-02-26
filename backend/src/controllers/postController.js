const Post = require("../models/Post");
const User = require("../models/User");
const Report = require("../models/Report");
const asyncHandler = require("../utils/asyncHandler");
const { error: errorResponse } = require("../utils/response");
const { HTTP_STATUS } = require("../config/constants");

/** True if user is the post author or admin (allowed to edit/delete). */
function canEditPost(post, user) {
  if (!user || !post) return false;
  const isAuthor = post.author && post.author._id ? post.author._id.toString() === user._id.toString() : post.author.toString() === user._id.toString();
  const isAdmin = (user.role || "").toUpperCase() === "ADMIN";
  return isAuthor || isAdmin;
}

/**
 * Create a discussion post. JWT required; author and authorRole from req.user.
 */
const createPost = asyncHandler(async (req, res) => {
  const { title, content, tags, mediaLinks } = req.body;
  const post = await Post.create({
    title: title.trim(),
    content: content.trim(),
    author: req.user._id,
    authorRole: req.user.role || "participant",
    tags: Array.isArray(tags) ? tags.filter(Boolean).map((t) => String(t).trim()) : [],
    mediaLinks: Array.isArray(mediaLinks) ? mediaLinks.filter(Boolean).map((l) => String(l).trim()) : [],
    status: "active",
  });
  const populated = await Post.findById(post._id).populate("author", "name email role");
  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: "Post created",
    post: populated,
  });
});

/**
 * Get posts feed. Query: sort=latest|popular|most_commented, q=search, tags=, author=. JWT required.
 */
const getPosts = asyncHandler(async (req, res) => {
  const sort = (req.query.sort || "latest").toLowerCase();
  const q = (req.query.q || "").trim();
  const tagsParam = req.query.tags;
  const authorId = req.query.author;
  const filter = { status: "active" };

  if (q) {
    filter.$or = [
      { title: new RegExp(q, "i") },
      { content: new RegExp(q, "i") },
      { tags: new RegExp(q, "i") },
    ];
  }
  if (tagsParam) {
    const tags = (Array.isArray(tagsParam) ? tagsParam : tagsParam.split(",")).map((t) => t.trim()).filter(Boolean);
    if (tags.length) filter.tags = { $in: tags };
  }
  if (authorId) filter.author = authorId;

  let sortOption = { createdAt: -1 };
  if (sort === "popular") sortOption = { likeCount: -1, createdAt: -1 };
  else if (sort === "most_commented") sortOption = { commentCount: -1, createdAt: -1 };

  const posts = await Post.find(filter)
    .populate("author", "name email role")
    .sort(sortOption)
    .lean();
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    posts,
  });
});

/**
 * Get a single post by id with comments and engagement. JWT required. Non-admin sees only visible comments.
 */
const getPostById = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ _id: req.params.id }).populate("author", "name email role").populate("comments.author", "name email role").lean();
  if (!post) return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Post not found");
  if (post.status === "deleted") return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Post not found");
  const isAdmin = (req.user.role || "").toUpperCase() === "ADMIN";
  if (!isAdmin && post.status !== "active") return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Post not found");
  if (!isAdmin && post.comments) {
    post.comments = post.comments.filter((c) => c.status !== "hidden");
  }
  return res.status(HTTP_STATUS.OK).json({ success: true, post });
});

/**
 * Update discussion title or content. Only original author or admin. updatedAt set automatically.
 */
const updatePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id).populate("author", "name email role");
  if (!post) {
    return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Post not found");
  }
  if (post.status === "deleted") {
    return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Post not found");
  }
  if (!canEditPost(post, req.user)) {
    return errorResponse(res, HTTP_STATUS.FORBIDDEN, "Only the author or admin can edit this post");
  }
  if (req.body.title !== undefined) post.title = String(req.body.title).trim();
  if (req.body.content !== undefined) post.content = String(req.body.content).trim();
  await post.save();
  const updated = await Post.findById(post._id).populate("author", "name email role");
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Post updated",
    post: updated,
  });
});

/**
 * Soft delete: set status to "deleted". Only original author or admin.
 */
const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Post not found");
  }
  if (post.status === "deleted") {
    return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Post not found");
  }
  if (!canEditPost(post, req.user)) {
    return errorResponse(res, HTTP_STATUS.FORBIDDEN, "Only the author or admin can delete this post");
  }
  post.status = "deleted";
  await post.save();
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Post deleted",
  });
});

/** True if user is comment author or admin. */
function canEditComment(comment, user) {
  if (!user || !comment) return false;
  const authorId = comment.author && comment.author._id ? comment.author._id.toString() : comment.author.toString();
  const isAuthor = authorId === user._id.toString();
  const isAdmin = (user.role || "").toUpperCase() === "ADMIN";
  return isAuthor || isAdmin;
}

/**
 * Add comment to post. Logged-in user.
 */
const addComment = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Post not found");
  if (post.status === "deleted") return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Post not found");
  const content = (req.body.content || "").trim();
  if (!content) return errorResponse(res, HTTP_STATUS.BAD_REQUEST, "Comment content is required");
  post.comments.push({
    author: req.user._id,
    authorRole: req.user.role || "participant",
    content,
    status: "visible",
  });
  post.commentCount = (post.commentCount || 0) + 1;
  await post.save();
  const updated = await Post.findById(post._id).populate("author", "name email role").populate("comments.author", "name email role");
  return res.status(HTTP_STATUS.CREATED).json({ success: true, message: "Comment added", post: updated });
});

/**
 * Edit comment. Author or admin only.
 */
const updateComment = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id).populate("comments.author", "name email role");
  if (!post) return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Post not found");
  const comment = post.comments.id(req.params.commentId);
  if (!comment) return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Comment not found");
  if (!canEditComment(comment, req.user)) return errorResponse(res, HTTP_STATUS.FORBIDDEN, "Only the author or admin can edit this comment");
  const content = (req.body.content || "").trim();
  if (!content) return errorResponse(res, HTTP_STATUS.BAD_REQUEST, "Comment content is required");
  comment.content = content;
  await post.save();
  const updated = await Post.findById(post._id).populate("author", "name email role").populate("comments.author", "name email role");
  return res.status(HTTP_STATUS.OK).json({ success: true, message: "Comment updated", post: updated });
});

/**
 * Delete comment. Author or admin only. Removes from array and decrements commentCount.
 */
const deleteComment = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Post not found");
  const comment = post.comments.id(req.params.commentId);
  if (!comment) return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Comment not found");
  if (!canEditComment(comment, req.user)) return errorResponse(res, HTTP_STATUS.FORBIDDEN, "Only the author or admin can delete this comment");
  comment.remove();
  post.commentCount = Math.max(0, (post.commentCount || 1) - 1);
  await post.save();
  return res.status(HTTP_STATUS.OK).json({ success: true, message: "Comment deleted" });
});

/**
 * Toggle like. One like per user; click again removes.
 */
const likeToggle = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Post not found");
  if (post.status === "deleted") return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Post not found");
  const userId = req.user._id;
  const idx = post.likes.findIndex((id) => id.toString() === userId.toString());
  if (idx >= 0) {
    post.likes.splice(idx, 1);
    post.likeCount = Math.max(0, (post.likeCount || 1) - 1);
  } else {
    post.likes.push(userId);
    post.likeCount = (post.likeCount || 0) + 1;
  }
  await post.save();
  const updated = await Post.findById(post._id).populate("author", "name email role");
  return res.status(HTTP_STATUS.OK).json({ success: true, liked: idx < 0, likeCount: post.likeCount, post: updated });
});

/**
 * Increment share count.
 */
const share = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Post not found");
  if (post.status === "deleted") return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Post not found");
  post.shareCount = (post.shareCount || 0) + 1;
  await post.save();
  const updated = await Post.findById(post._id).populate("author", "name email role");
  return res.status(HTTP_STATUS.OK).json({ success: true, message: "Share recorded", shareCount: updated.shareCount, post: updated });
});

/**
 * Save (bookmark) post for current user.
 */
const savePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Post not found");
  await User.findByIdAndUpdate(req.user._id, { $addToSet: { savedPosts: post._id } });
  return res.status(HTTP_STATUS.OK).json({ success: true, message: "Post saved" });
});

/**
 * Remove saved post.
 */
const unsavePost = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $pull: { savedPosts: req.params.id } });
  return res.status(HTTP_STATUS.OK).json({ success: true, message: "Post unsaved" });
});

/**
 * Get current user's saved posts.
 */
const getSavedPosts = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("savedPosts").populate("savedPosts");
  const posts = (user.savedPosts || []).filter((p) => p && p.status === "active");
  return res.status(HTTP_STATUS.OK).json({ success: true, posts });
});

/**
 * Report a post.
 */
const reportPost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Post not found");
  const reason = (req.body.reason || "").trim();
  if (!reason) return errorResponse(res, HTTP_STATUS.BAD_REQUEST, "Reason is required");
  await Report.create({
    targetType: "post",
    postId: post._id,
    reporter: req.user._id,
    reason,
  });
  return res.status(HTTP_STATUS.CREATED).json({ success: true, message: "Report submitted" });
});

/**
 * Report a comment.
 */
const reportComment = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Post not found");
  const comment = post.comments.id(req.params.commentId);
  if (!comment) return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Comment not found");
  const reason = (req.body.reason || "").trim();
  if (!reason) return errorResponse(res, HTTP_STATUS.BAD_REQUEST, "Reason is required");
  await Report.create({
    targetType: "comment",
    postId: post._id,
    commentId: comment._id,
    reporter: req.user._id,
    reason,
  });
  return res.status(HTTP_STATUS.CREATED).json({ success: true, message: "Report submitted" });
});

/**
 * Admin: update post status (active, hidden, deleted, reported).
 */
const updatePostStatus = asyncHandler(async (req, res) => {
  if ((req.user.role || "").toUpperCase() !== "ADMIN") {
    return errorResponse(res, HTTP_STATUS.FORBIDDEN, "Admin only");
  }
  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  ).populate("author", "name email role");
  if (!post) return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Post not found");
  return res.status(HTTP_STATUS.OK).json({ success: true, message: "Status updated", post });
});

module.exports = {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  addComment,
  updateComment,
  deleteComment,
  likeToggle,
  share,
  savePost,
  unsavePost,
  getSavedPosts,
  reportPost,
  reportComment,
  updatePostStatus,
};
