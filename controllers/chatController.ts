import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";

import userModel from "../models/users";
import conversationModel from "../models/conversation";
import chatModel from "../models/chat";

export const getAllUserList = async (req: Request, res: Response) => {
  try {
    const allUserList = await userModel
      .aggregate([
        {
          $project: {
            uid: "$_id",
            nickname: 1,
            _id: 0,
          },
        },
      ])
      .exec();
    res.status(StatusCodes.OK).send({ data: allUserList });
  } catch (err) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ data: "DB 조회 에러" });
  }
};

export const getAllConversationList = async (req: Request, res: Response) => {
  try {
    const jwtUser = res.locals.jwtUser;
    const from = new mongoose.Types.ObjectId(jwtUser.uid);
    const conversations = await conversationModel
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
      .exec();
    res.status(StatusCodes.OK).send(conversations);
  } catch (err) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ data: "채팅 목록 불러오기 실패" });
  }
};

export const getUserMessageHistory = async (req: Request, res: Response) => {
  try {
    const messages = await chatModel
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
          { $and: [{ to: res.locals.jwtUser.uid }, { from: req.query.uid }] },
          { $and: [{ to: req.query.uid }, { from: res.locals.jwtUser.uid }] },
        ],
      })
      .project({
        __v: 0,
        conversation: 0,
        updatedAt: 0,
        toObj: 0,
        fromObj: 0,
      })
      .exec();

    res.status(StatusCodes.OK).send(messages);
  } catch (err) {
    console.log(err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ data: "채팅 불러오기 실패" });
  }
};

// socket event
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const from = new mongoose.Types.ObjectId(res.locals.jwtUser.uid);
    const to = new mongoose.Types.ObjectId(req.body.to);

    const conversation = await conversationModel.findOneAndUpdate(
      {
        participants: {
          $all: [{ $elemMatch: { $eq: from } }, { $elemMatch: { $eq: to } }],
        },
      },
      {
        participants: [res.locals.jwtUser.uid, req.body.to],
        lastMessage: req.body.message,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    const chat = new chatModel({
      conversation: conversation._id,
      to,
      from,
      message: req.body.message,
    });

    await req.app
      .get("io")
      .to(req.body.to)
      .to(res.locals.jwtUser.uid)
      .emit("private message", req.body.message);

    await chat.save();
    res.status(StatusCodes.OK).send({
      message: "Success",
      conversationId: conversation._id,
    });
  } catch (err) {
    console.log(err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ data: "메세지 전송 오류" });
  }
};
