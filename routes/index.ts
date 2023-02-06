import { NextFunction, Request, Response } from "express";

var express = require("express");
var router = express.Router();

router.get("/", function (req: Request, res: Response, next: NextFunction) {
  console.log("index");
  res.send("hello");
});

module.exports = router;
