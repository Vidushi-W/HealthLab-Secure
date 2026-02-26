const router = require("express").Router();
const { requiredAuth } = require("../middleware/auth");
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
} = require("../controllers/postController");

// List posts (auth optional for read; Community page requires login so we protect all)
router.get("/", requiredAuth, getPosts);
router.get("/saved", requiredAuth, getSavedPosts);
router.get("/:id", requiredAuth, getPostById);

router.post("/", requiredAuth, createPost);
router.put("/:id", requiredAuth, updatePost);
router.delete("/:id", requiredAuth, deletePost);

router.put("/:id/like", requiredAuth, likeToggle);
router.post("/:id/share", requiredAuth, sharePost);
router.post("/:id/save", requiredAuth, savePost);
router.delete("/:id/save", requiredAuth, unsavePost);

module.exports = router;
