const router = require("express").Router();
const { protect, authorize } = require("../middlewares/authMiddleware");
const { createPost, getPosts, getPostById, updatePost, deletePost } = require("../controllers/postController");
const { createPostRules, updatePostRules, postIdRule, validate } = require("../validators/postValidators");

// All community routes require JWT and any allowed role (Researcher, Participant, Medical Reviewer, Admin)
const communityGuard = [protect, authorize("ADMIN", "RESEARCHER", "PARTICIPANT", "MEDICAL_REVIEWER")];

router.post("/", communityGuard, createPostRules(), validate, createPost);
router.get("/", communityGuard, getPosts);
router.get("/:id", communityGuard, postIdRule(), validate, getPostById);
router.put("/:id", communityGuard, updatePostRules(), validate, updatePost);
router.delete("/:id", communityGuard, postIdRule(), validate, deletePost);

module.exports = router;
