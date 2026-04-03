const { HTTP_STATUS } = require("../../config/constants");
const { error: errorResponse } = require("../../utils/response");
const communityService = require("./services/communityService");

function getUserId(req) {
  return req.user && (req.user.id || req.user._id);
}

async function getPosts(req, res, next) {
  try {
    const posts = await communityService.getPosts(req.query);
    return res.status(HTTP_STATUS.OK).json({ success: true, posts });
  } catch (err) {
    next(err);
  }
}

async function getSearchSuggestions(req, res, next) {
  try {
    const suggestions = await communityService.getSearchSuggestions(req.query);
    return res.status(HTTP_STATUS.OK).json({ success: true, suggestions });
  } catch (err) {
    next(err);
  }
}

async function getSavedPosts(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, "Authentication required");
    const posts = await communityService.getSavedPosts(userId);
    return res.status(HTTP_STATUS.OK).json({ success: true, posts });
  } catch (err) {
    next(err);
  }
}

async function getPostById(req, res, next) {
  try {
    const post = await communityService.getPostById(req.params.id);
    if (!post) return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Post not found");
    return res.status(HTTP_STATUS.OK).json({ success: true, post });
  } catch (err) {
    next(err);
  }
}

async function createPost(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, "Authentication required");
    const body = req.body || {};
    const payload = {
      title: body.title,
      content: body.content,
      tags: body.tags,
    };
    if (req.file && req.file.filename) {
      payload.image = `post-images/${req.file.filename}`;
    }
    const result = await communityService.createPost(userId, payload);
    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      post: result.post,
      ai: result.ai ? { category: result.ai.category, tags: result.ai.aiTags } : undefined,
    });
  } catch (err) {
    next(err);
  }
}

async function updatePost(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, "Authentication required");
    const result = await communityService.updatePost(req.params.id, userId, req.body);
    if (!result) return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Post not found");
    if (result.forbidden) return errorResponse(res, HTTP_STATUS.FORBIDDEN, "Not authorized to update this post");
    return res.status(HTTP_STATUS.OK).json({ success: true, post: result });
  } catch (err) {
    next(err);
  }
}

async function deletePost(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, "Authentication required");
    const result = await communityService.deletePost(req.params.id, userId);
    if (!result) return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Post not found");
    if (result.forbidden) return errorResponse(res, HTTP_STATUS.FORBIDDEN, "Not authorized to delete this post");
    return res.status(HTTP_STATUS.OK).json({ success: true, message: "Post deleted" });
  } catch (err) {
    next(err);
  }
}

async function likeToggle(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, "Authentication required");
    const vote = req.body && req.body.vote ? String(req.body.vote).toLowerCase() : "up";
    const result = await communityService.voteToggle(req.params.id, userId, vote);
    if (!result) return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Post not found");
    return res.status(HTTP_STATUS.OK).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function sharePost(req, res, next) {
  try {
    const result = await communityService.sharePost(req.params.id);
    if (!result) return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Post not found");
    return res.status(HTTP_STATUS.OK).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function savePost(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, "Authentication required");
    const result = await communityService.savePost(req.params.id, userId);
    if (!result) return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Post not found");
    return res.status(HTTP_STATUS.OK).json({ success: true, message: "Post saved" });
  } catch (err) {
    next(err);
  }
}

async function unsavePost(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, "Authentication required");
    await communityService.unsavePost(req.params.id, userId);
    return res.status(HTTP_STATUS.OK).json({ success: true, message: "Post unsaved" });
  } catch (err) {
    next(err);
  }
}

async function addComment(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, "Authentication required");
    const content = (req.body && req.body.content) ? String(req.body.content).trim() : "";
    if (!content) return errorResponse(res, HTTP_STATUS.BAD_REQUEST, "Comment content is required");
    const result = await communityService.addComment(req.params.id, userId, content);
    if (!result) return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Post not found");
    return res.status(HTTP_STATUS.CREATED).json({ success: true, post: result, commentCount: result.commentCount });
  } catch (err) {
    next(err);
  }
}

async function updateComment(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, "Authentication required");
    const content = (req.body && req.body.content) ? String(req.body.content).trim() : "";
    if (!content) return errorResponse(res, HTTP_STATUS.BAD_REQUEST, "Comment content is required");
    const result = await communityService.updateComment(req.params.id, req.params.commentId, userId, content);
    if (!result) return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Post not found");
    if (result.notFound) return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Comment not found");
    if (result.forbidden) return errorResponse(res, HTTP_STATUS.FORBIDDEN, "Not authorized to update this comment");
    return res.status(HTTP_STATUS.OK).json({ success: true, message: "Comment updated" });
  } catch (err) {
    next(err);
  }
}

async function deleteComment(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, "Authentication required");
    const result = await communityService.deleteComment(req.params.id, req.params.commentId, userId);
    if (!result) return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Post not found");
    if (result.notFound) return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Comment not found");
    if (result.forbidden) return errorResponse(res, HTTP_STATUS.FORBIDDEN, "Not authorized to delete this comment");
    return res.status(HTTP_STATUS.OK).json({ success: true, message: "Comment deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPosts,
  getSearchSuggestions,
  getSavedPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  likeToggle,
  sharePost,
  savePost,
  unsavePost,
  addComment,
  updateComment,
  deleteComment,
};
