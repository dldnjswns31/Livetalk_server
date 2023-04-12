"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chatController_1 = require("./../controllers/chatController");
const authorizeUtils_1 = require("./../utils/authorizeUtils");
const express_1 = require("express");
const http_status_codes_1 = require("http-status-codes");
const chatController_2 = require("../controllers/chatController");
const chatRouter = (0, express_1.Router)();
chatRouter.use((req, res, next) => {
    const token = req.headers.authorization;
    if (token) {
        const data = (0, authorizeUtils_1.verifyToken)(token);
        if (data) {
            res.locals.jwtUser = data;
            next();
        }
        else {
            res
                .status(http_status_codes_1.StatusCodes.UNAUTHORIZED)
                .send({ message: "올바르지 않은 토큰입니다." });
        }
    }
    else {
        res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).send({ message: "토큰이 없습니다." });
    }
});
// DB 모든 유저 (/)
chatRouter.get("/", chatController_2.getAllUserList);
// 채팅 목록 (/conversation)
chatRouter.get("/conversations", chatController_2.getAllConversationList);
// 해당 유저와의 채팅 내역 (/conversation/user?id=:id)
chatRouter.get("/conversations/user", chatController_2.getUserMessageHistory);
// 채팅 내역 추가로 불러오기 (/conversations/message?id=:id)
chatRouter.get("/conversations/message", chatController_1.getMoreMessages);
exports.default = chatRouter;
