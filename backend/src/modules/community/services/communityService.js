const Post = require("../model/Post");
const { generateSmartTags } = require("./aiTaggingService");

async function getPosts(query = {}) {
  const { sort = "latest", q } = query;
  const match = {};
  if (q && String(q).trim()) {
    const term = String(q).trim();
    match.$or = [
      { title: new RegExp(term, "i") },
      { content: new RegExp(term, "i") },
      { tags: new RegExp(term, "i") },
    ];
  }
  const sortStage =
    sort === "popular"
      ? { $sort: { likeCount: -1, createdAt: -1 } }
      : sort === "most_commented"
      ? { $sort: { commentCount: -1, createdAt: -1 } }
      : { $sort: { createdAt: -1 } };
  const pipeline = [
    { $match: Object.keys(match).length ? match : {} },
    { $addFields: { likeCount: { $size: { $ifNull: ["$likes", []] } }, commentCount: { $size: { $ifNull: ["$comments", []] } } } },
    sortStage,
    { $lookup: { from: "users", localField: "author", foreignField: "_id", as: "authorDoc" } },
    { $unwind: { path: "$authorDoc", preserveNullAndEmptyArrays: true } },
    { $addFields: { author: "$authorDoc" } },
    {
      $project: {
        _id: 1,
        title: 1,
        content: 1,
        tags: 1,
        aiTags: 1,
        category: 1,
        likes: 1,
        shareCount: 1,
        savedBy: 1,
        createdAt: 1,
        updatedAt: 1,
        likeCount: 1,
        commentCount: 1,
        author: { _id: 1, name: 1, email: 1 },
      },
    },
  ];
  return Post.aggregate(pipeline);
}

async function getSavedPosts(userId) {
  const posts = await Post.find({ savedBy: userId }).populate("author", "name email").sort({ createdAt: -1 }).lean();
  return posts.map((p) => ({
    ...p,
    likeCount: (p.likes && p.likes.length) || 0,
    commentCount: (p.comments && p.comments.length) || 0,
  }));
}

async function getPostById(postId) {
  const post = await Post.findById(postId).populate("author", "name email").populate("comments.author", "name").lean();
  if (!post) return null;
  return {
    ...post,
    likeCount: (post.likes && post.likes.length) || 0,
    commentCount: (post.comments && post.comments.length) || 0,
  };
}

async function createPost(userId, data) {
  const { title, content, tags } = data;
  let ai = null;
  try {
    ai = await generateSmartTags({ title, content });
  } catch (_) {}
  const post = await Post.create({
    title: title || "",
    content: content || "",
    tags: Array.isArray(tags) ? tags : [],
    category: (ai && ai.category) || null,
    aiTags: Array.isArray(ai && ai.aiTags) ? ai.aiTags : [],
    author: userId,
  });
  const populated = await Post.findById(post._id).populate("author", "name email").lean();
  return { post: { ...populated, likeCount: 0, commentCount: 0 }, ai };
}

async function updatePost(postId, userId, data) {
  const post = await Post.findById(postId);
  if (!post) return null;
  if (String(post.author) !== String(userId)) return { forbidden: true };
  if (data.title !== undefined) post.title = data.title;
  if (data.content !== undefined) post.content = data.content;
  if (data.tags !== undefined) post.tags = Array.isArray(data.tags) ? data.tags : [];
  await post.save();
  const populated = await Post.findById(postId).populate("author", "name email").lean();
  return {
    ...populated,
    likeCount: (post.likes && post.likes.length) || 0,
    commentCount: (post.comments && post.comments.length) || 0,
  };
}

async function deletePost(postId, userId) {
  const post = await Post.findById(postId);
  if (!post) return null;
  if (String(post.author) !== String(userId)) return { forbidden: true };
  await Post.findByIdAndDelete(postId);
  return true;
}

async function likeToggle(postId, userId) {
  const post = await Post.findById(postId);
  if (!post) return null;
  const likes = post.likes || [];
  const idx = likes.findIndex((id) => String(id) === String(userId));
  if (idx >= 0) {
    likes.splice(idx, 1);
    post.likes = likes;
  } else {
    post.likes = [...likes, userId];
  }
  await post.save();
  return { likeCount: post.likes.length, liked: post.likes.some((id) => String(id) === String(userId)) };
}

async function sharePost(postId) {
  const post = await Post.findByIdAndUpdate(postId, { $inc: { shareCount: 1 } }, { new: true });
  return post ? { shareCount: post.shareCount } : null;
}

async function savePost(postId, userId) {
  const post = await Post.findByIdAndUpdate(postId, { $addToSet: { savedBy: userId } }, { new: true });
  return post ? {} : null;
}

async function unsavePost(postId, userId) {
  await Post.findByIdAndUpdate(postId, { $pull: { savedBy: userId } });
  return {};
}

async function addComment(postId, userId, content) {
  const post = await Post.findById(postId);
  if (!post) return null;
  post.comments = post.comments || [];
  post.comments.push({ author: userId, content: String(content).trim(), status: "visible" });
  await post.save();
  const updated = await Post.findById(postId).populate("author", "name email").populate("comments.author", "name").lean();
  return { ...updated, commentCount: (updated.comments && updated.comments.length) || 0 };
}

async function updateComment(postId, commentId, userId, content) {
  const post = await Post.findById(postId);
  if (!post) return null;
  const comment = (post.comments || []).find((c) => String(c._id) === String(commentId));
  if (!comment) return { notFound: true };
  if (String(comment.author) !== String(userId)) return { forbidden: true };
  comment.content = String(content).trim();
  await post.save();
  return {};
}

async function deleteComment(postId, commentId, userId) {
  const post = await Post.findById(postId);
  if (!post) return null;
  const comment = (post.comments || []).find((c) => String(c._id) === String(commentId));
  if (!comment) return { notFound: true };
  if (String(comment.author) !== String(userId)) return { forbidden: true };
  post.comments = post.comments.filter((c) => String(c._id) !== String(commentId));
  await post.save();
  return {};
}

module.exports = {
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
};
