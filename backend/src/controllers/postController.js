const Post = require("../models/Post");
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
 * Get posts feed. Query: sort=latest|popular (default latest). JWT required.
 */
const getPosts = asyncHandler(async (req, res) => {
  const sort = (req.query.sort || "latest").toLowerCase();
  const filter = { status: "active" };
  const sortOption = sort === "popular" ? { likeCount: -1, createdAt: -1 } : { createdAt: -1 };
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
 * Get a single post by id with comments and engagement. JWT required.
 */
const getPostById = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ _id: req.params.id, status: "active" })
    .populate("author", "name email role")
    .populate("comments.author", "name email role")
    .lean();
  if (!post) {
    return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Post not found");
  }
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    post,
  });
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

module.exports = {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
};
