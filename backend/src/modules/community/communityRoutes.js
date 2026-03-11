const router = require("express").Router();
const { protect } = require("../../middleware/authMiddleware");
const { uploadPostImage } = require("../../middleware/upload");
const {
  postIdRules,
  createPostRules,
  updatePostRules,
  commentIdRules,
  addCommentRules,
  updateCommentRules,
  validate,
} = require("./communityValidators");
const {
  getPosts,
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
} = require("./communityController");
const { chat } = require("./chatbot/chatbotController");
const { chatRules, validate: validateChat } = require("./chatbot/chatbotValidators");

router.get("/", protect, getPosts);
router.get("/saved", protect, getSavedPosts);
router.post("/chat", protect, chatRules(), validateChat, chat);

router.get("/:id", protect, postIdRules(), validate, getPostById);

router.post("/", protect, uploadPostImage, createPostRules(), validate, createPost);
router.put("/:id", protect, updatePostRules(), validate, updatePost);
router.delete("/:id", protect, postIdRules(), validate, deletePost);

router.put("/:id/like", protect, postIdRules(), validate, likeToggle);
router.post("/:id/share", protect, postIdRules(), validate, sharePost);
router.post("/:id/save", protect, postIdRules(), validate, savePost);
router.delete("/:id/save", protect, postIdRules(), validate, unsavePost);

router.post("/:id/comments", protect, addCommentRules(), validate, addComment);
router.put("/:id/comments/:commentId", protect, updateCommentRules(), validate, updateComment);
router.delete("/:id/comments/:commentId", protect, commentIdRules(), validate, deleteComment);

module.exports = router;
