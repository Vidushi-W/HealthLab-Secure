const { body, param, validationResult } = require("express-validator");

const createPostRules = () => [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("content").trim().notEmpty().withMessage("Content is required"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
  body("tags.*").optional().trim(),
  body("mediaLinks").optional().isArray().withMessage("Media links must be an array"),
  body("mediaLinks.*").optional().trim(),
];

const postIdRule = () => [param("id").isMongoId().withMessage("Invalid post ID")];

/** Update: at least one of title or content required */
const updatePostRules = () => [
  param("id").isMongoId().withMessage("Invalid post ID"),
  body("title").optional().trim(),
  body("content").optional().trim(),
  body().custom((value, { req }) => {
    const hasTitle = req.body.title !== undefined && String(req.body.title).trim() !== "";
    const hasContent = req.body.content !== undefined && String(req.body.content).trim() !== "";
    if (!hasTitle && !hasContent) {
      throw new Error("At least one of title or content is required");
    }
    return true;
  }),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const messages = errors.array().map((e) => e.msg);
  return res.status(400).json({ success: false, message: messages.join("; ") });
};

module.exports = { createPostRules, updatePostRules, postIdRule, validate };
