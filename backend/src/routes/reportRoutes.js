const router = require("express").Router();
const { protect, authorize } = require("../middlewares/authMiddleware");
const { getReports, resolveReport } = require("../controllers/reportController");
const { param, body, validationResult } = require("express-validator");

const adminGuard = [protect, authorize("ADMIN")];

const reportIdRule = () => [param("id").isMongoId().withMessage("Invalid report ID")];
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return res.status(400).json({ success: false, message: errors.array().map((e) => e.msg).join("; ") });
};

router.get("/", adminGuard, getReports);
router.put("/:id", adminGuard, reportIdRule(), body("action").optional().isIn(["dismiss", "hide_content"]), validate, resolveReport);

module.exports = router;
