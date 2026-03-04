const { body, param, validationResult } = require("express-validator");

const postIdRules = () => [param("id").isMongoId().withMessage("Invalid post ID")];

const createPostRules = () => [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("content").trim().notEmpty().withMessage("Content is required"),
  body("tags").optional().isArray().withMessage("tags must be an array"),
  body("tags.*").optional().isString().withMessage("tags must be an array of strings"),
];

const updatePostRules = () => [
  param("id").isMongoId().withMessage("Invalid post ID"),
  body("title").optional().trim().notEmpty().withMessage("Title cannot be empty"),
  body("content").optional().trim().notEmpty().withMessage("Content cannot be empty"),
  body("tags").optional().isArray().withMessage("tags must be an array"),
  body("tags.*").optional().isString().withMessage("tags must be an array of strings"),
];

const commentIdRules = () => [
  param("id").isMongoId().withMessage("Invalid post ID"),
  param("commentId").isMongoId().withMessage("Invalid comment ID"),
];

const addCommentRules = () => [
  param("id").isMongoId().withMessage("Invalid post ID"),
  body("content").trim().notEmpty().withMessage("Comment content is required"),
];

const updateCommentRules = () => [
  param("id").isMongoId().withMessage("Invalid post ID"),
  param("commentId").isMongoId().withMessage("Invalid comment ID"),
  body("content").trim().notEmpty().withMessage("Comment content is required"),
];

function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const message = errors.array().map((e) => e.msg).join("; ");
  return res.status(400).json({ success: false, message });
}

module.exports = {
  postIdRules,
  createPostRules,
  updatePostRules,
  commentIdRules,
  addCommentRules,
  updateCommentRules,
  validate,
};
