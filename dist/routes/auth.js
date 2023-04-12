"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("./../controllers/authController");
const authRouter = (0, express_1.Router)();
authRouter.post("/signup", authController_1.signup);
authRouter.post("/signin", authController_1.signin);
authRouter.get("/verify", authController_1.verify);
exports.default = authRouter;
