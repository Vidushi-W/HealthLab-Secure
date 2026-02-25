const Post = require("../models/Post");
const asyncHandler = require("../utils/asyncHandler");
const { error: errorResponse } = require("../utils/response");
const { HTTP_STATUS } = require("../config/constants");

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

module.exports = {
  createPost,
  getPosts,
  getPostById,
};
