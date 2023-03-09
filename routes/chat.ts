import mongoose from "mongoose";
import { verifyToken } from "./../utils/authorizeUtils";
import { Request, Router } from "express";
import { StatusCodes } from "http-status-codes";
import conversationModel from "../models/conversation";
import userModel from "../models/users";
import chatModel from "../models/chat";

const chatRouter = Router();
let jwtUser: { uid: string; email: string; nickname: string };

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
    .project({
      participants: 0,
      "participantObj.password": 0,
      "participantObj.email": 0,
      "participantObj.createdAt": 0,
      "participantObj.updatedAt": 0,
      "participantObj.__v": 0,
    })
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

interface IRequestQuery {
  uid: string;
}

// 해당 유저와의 채팅 내역 (/conversation/query?id=:id)
chatRouter.get(
  "/conversations/query",
  (req: Request<{}, {}, {}, IRequestQuery>, res) => {
    let user1 = new mongoose.Types.ObjectId(jwtUser.uid);
    let user2 = new mongoose.Types.ObjectId(req.query.uid);
    chatModel
      .aggregate([
        {
          $lookup: {
            from: "users",
            localField: "to",
            foreignField: "_id",
            as: "toObj",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "from",
            foreignField: "_id",
            as: "fromObj",
          },
        },
      ])
      .match({
        $or: [
          // { $and: [{ to: user1 }, { from: user2 }] },
          // { $and: [{ to: user2 }, { from: user1 }] },
          { $and: [{ to: jwtUser.uid }, { from: req.query.uid }] },
          { $and: [{ to: req.query.uid }, { from: jwtUser.uid }] },
        ],
      })
      .project({
        __v: 0,
        conversation: 0,
        updatedAt: 0,
        toObj: 0,
        fromObj: 0,
      })
      .exec((err, chat) => {
        if (err) {
          console.log(err);
          res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .send({ data: "채팅 불러오기 실패" });
        } else {
          res.status(StatusCodes.OK).send(chat);
        }
      });
  }
);

// 채팅 송신
chatRouter.post("/message", (req, res) => {
  let from = new mongoose.Types.ObjectId(jwtUser.uid);
  let to = new mongoose.Types.ObjectId(req.body.to);

  conversationModel.findOneAndUpdate(
    {
      participants: {
        $all: [{ $elemMatch: { $eq: from } }, { $elemMatch: { $eq: to } }],
      },
    },
    {
      participants: [jwtUser.uid, req.body.to],
      lastMessage: req.body.message,
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
    function (err, conversation) {
      if (err) {
        console.log(err);
        res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .send({ data: "메세지 전송 오류" });
      } else {
        let chat = new chatModel({
          conversation: conversation._id,
          to,
          from,
          message: req.body.message,
        });

        req.app
          .get("io")
          .to(req.body.to)
          .to(jwtUser.uid)
          .emit("private message", req.body.message);
        chat.save((err) => {
          if (err) {
            console.log(err);
            res
              .status(StatusCodes.INTERNAL_SERVER_ERROR)
              .send("메세지 저장 실패");
          } else {
            res
              .status(StatusCodes.OK)
              .send({ message: "Success", conversationId: conversation._id });
          }
        });
      }
    }
  );
});

export default chatRouter;
