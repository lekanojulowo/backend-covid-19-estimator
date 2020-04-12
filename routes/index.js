var express = require("express");
var router = express.Router();
var estimator = require("../estimator.js");

router.get("/api/v1/on-covid-19", estimator.welcome);
router.post("/api/v1/on-covid-19", estimator.dataJson);
router.post("/api/v1/on-covid-19/json", estimator.dataJson);
router.post("/api/v1/on-covid-19/xml", estimator.dataXml);
router.get("/api/v1/on-covid-19/logs", estimator.logs);
router.post("/api/v1/on-covid-19/logs", estimator.logs);

module.exports = router;