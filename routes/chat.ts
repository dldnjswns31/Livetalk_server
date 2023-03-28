import { verifyToken } from "./../utils/authorizeUtils";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";

import {
  getAllConversationList,
  getAllUserList,
  getUserMessageHistory,
} from "../controllers/chatController";

const chatRouter = Router();

chatRouter.use((req, res, next) => {
  const token = req.headers.authorization;
  if (token) {
    const data = verifyToken(token);
    if (data) {
      res.locals.jwtUser = data;
      next();
    } else {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .send({ message: "올바르지 않은 토큰입니다." });
    }
  } else {
    res.status(StatusCodes.UNAUTHORIZED).send({ message: "토큰이 없습니다." });
  }
});

// DB 모든 유저 (/)
chatRouter.get("/", getAllUserList);

// 채팅 목록 (/conversation)
chatRouter.get("/conversations", getAllConversationList);

// 해당 유저와의 채팅 내역 (/conversation/query?id=:id)
chatRouter.get("/conversations/query", getUserMessageHistory);

export default chatRouter;
