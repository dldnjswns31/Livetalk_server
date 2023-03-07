import mongoose from "mongoose";
import { verifyToken } from "./../utils/authorizeUtils";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import conversationModel from "../models/conversation";
import userModel from "../models/users";

const chatRouter = Router();
let jwtUser: null | { uid: string; email: string; nickname: string } = null;

chatRouter.use((req, res, next) => {
  const token = req.headers.authorization;
  if (token) {
    const data = verifyToken(token);
    if (data) {
      jwtUser = data;
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
chatRouter.get("/", async (req, res) => {
  try {
    userModel
      .aggregate([
        {
          $project: {
            uid: "$_id",
            nickname: 1,
            _id: 0,
          },
        },
      ])
      .exec((err, allUsers) => {
        res.status(StatusCodes.OK).send({ data: allUsers });
      });
  } catch (err) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ data: "DB 조회 에러" });
  }
});

// 채팅 목록 (/conversation)
chatRouter.get("/conversations", (req, res) => {
  let from = new mongoose.Types.ObjectId(jwtUser!.uid);
  conversationModel
    .aggregate([
      {
        $lookup: {
          from: "users",
          localField: "participants",
          foreignField: "_id",
          as: "participantObj",
        },
      },
    ])
    .match({ participants: { $all: [{ $elemMatch: { $eq: from } }] } })
    .exec((err, conversations) => {
      if (err) {
        console.log(err);
        res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .send({ data: "채팅 목록 불러오기 실패" });
      } else {
        res.send(conversations);
      }
    });
});
// 해당 유저와의 채팅 내역 (/conversation/query?id=:id)

// 채팅 송신

export default chatRouter;
