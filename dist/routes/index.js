"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
let indexRouter = (0, express_1.Router)();
indexRouter.get("/", function (req, res, next) {
    console.log("index");
    res.send("hello");
});
exports.default = indexRouter;
