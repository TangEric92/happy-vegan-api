const express = require("express");
const router = express.Router();

// On ajoute un prefix aux routes qu'on recupere via le require
router.use("/api/user", require("./user"));
router.use("/api/good", require("./good"));
router.use("/api/service", require("./service"));

module.exports = router;
