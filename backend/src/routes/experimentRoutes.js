const router = require("express").Router();

const {
  createExperiment,
  getExperiments,
  getExperimentById,
  updateExperiment,
  deleteExperiment,
} = require("../controllers/experimentController");

router.post("/", createExperiment);
router.get("/", getExperiments);

// IMPORTANT: this enables GET /experiments/:id
router.get("/:id", getExperimentById);

router.put("/:id", updateExperiment);
router.delete("/:id", deleteExperiment);

module.exports = router;

