var express = require("express");
var router = express.Router();

router.get("/", function (req, res, next) {
  console.log("index");
  res.send("hello");
});

module.exports = router;
