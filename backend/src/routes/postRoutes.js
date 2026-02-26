const router = require("express").Router();
const { protect, authorize } = require("../middlewares/authMiddleware");
const {
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
} = require("../controllers/postController");
const {
  createPostRules,
  updatePostRules,
  postIdRule,
  commentIdRule,
  addCommentRules,
  updateCommentRules,
  reportRules,
  postStatusRules,
  validate,
} = require("../validators/postValidators");

const communityGuard = [protect, authorize("ADMIN", "RESEARCHER", "PARTICIPANT", "MEDICAL_REVIEWER")];
const adminGuard = [protect, authorize("ADMIN")];

// Saved must be before /:id
router.get("/saved", communityGuard, getSavedPosts);

router.post("/", communityGuard, createPostRules(), validate, createPost);
router.get("/", communityGuard, getPosts);
router.get("/:id", communityGuard, postIdRule(), validate, getPostById);
router.put("/:id", communityGuard, updatePostRules(), validate, updatePost);
router.delete("/:id", communityGuard, postIdRule(), validate, deletePost);

// Status: admin only (before other /:id/... to avoid conflict)
router.put("/:id/status", adminGuard, postIdRule(), postStatusRules(), validate, updatePostStatus);

// Comments
router.post("/:id/comments", communityGuard, addCommentRules(), validate, addComment);
router.put("/:id/comments/:commentId", communityGuard, postIdRule(), commentIdRule(), updateCommentRules(), validate, updateComment);
router.delete("/:id/comments/:commentId", communityGuard, postIdRule(), commentIdRule(), validate, deleteComment);
router.post("/:id/comments/:commentId/report", communityGuard, postIdRule(), commentIdRule(), reportRules(), validate, reportComment);

// Like, share, save, report post
router.put("/:id/like", communityGuard, postIdRule(), validate, likeToggle);
router.post("/:id/share", communityGuard, postIdRule(), validate, share);
router.post("/:id/save", communityGuard, postIdRule(), validate, savePost);
router.delete("/:id/save", communityGuard, postIdRule(), validate, unsavePost);
router.post("/:id/report", communityGuard, postIdRule(), reportRules(), validate, reportPost);

module.exports = router;
