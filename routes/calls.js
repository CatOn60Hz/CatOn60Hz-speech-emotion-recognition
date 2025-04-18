const express = require("express");
const callController = require("../controllers/callController");

const router = express.Router();

router.post("/", callController.saveCall);
router.get("/emotions", callController.getEmotions);
router.get("/analyze", callController.analyzeBehavior);

module.exports = router;