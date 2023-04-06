import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";

import userModel from "../models/users";
import conversationModel from "../models/conversation";
import messageModel from "../models/message";

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
    const uid = new mongoose.Types.ObjectId(jwtUser.uid);
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
        {
          $match: {
            participants: { $all: [{ $elemMatch: { $eq: uid } }] },
          },
        },
        {
          $project: {
            lastMessage: 1,
            updatedAt: 1,
            "participantObj._id": 1,
            "participantObj.nickname": 1,
          },
        },
        {
          $lookup: {
            from: "messages",
            let: { conversation: "$_id", uid },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$conversation", "$$conversation"] },
                      { $eq: ["$to", uid] },
                      { $eq: ["$isRead", false] },
                    ],
                  },
                },
              },
              { $count: "unreadCount" },
            ],
            as: "unreadCount",
          },
        },
        {
          $project: {
            lastMessage: 1,
            updatedAt: 1,
            "participantObj._id": 1,
            "participantObj.nickname": 1,
            unreadCount: { $arrayElemAt: ["$unreadCount.unreadCount", 0] },
          },
        },
        {
          $sort: {
            updatedAt: -1,
          },
        },
      ])
      .exec();
    res.status(StatusCodes.OK).send(conversations);
  } catch (err) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ data: "채팅 목록 불러오기 실패" });
  }
};

export const getUserMessageHistory = async (req: Request, res: Response) => {
  const myUid = new mongoose.Types.ObjectId(res.locals.jwtUser.uid);
  const opponentUid = new mongoose.Types.ObjectId(req.query.uid as string);
  try {
    await messageModel.updateMany(
      { to: myUid, from: opponentUid, isRead: false },
      { $set: { isRead: true } }
    );

    const messages = await messageModel
      .aggregate([
        {
          $match: {
            $or: [
              { $and: [{ to: myUid }, { from: opponentUid }] },
              { $and: [{ to: opponentUid }, { from: myUid }] },
            ],
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        { $limit: 30 },
        { $sort: { createdAt: 1 } },
        {
          $project: {
            _id: 1,
            from: 1,
            to: 1,
            message: 1,
            isRead: 1,
            createdAt: 1,
          },
        },
      ])
      .exec();

    res.status(StatusCodes.OK).send(messages);
  } catch (err) {
    console.log(err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ data: "채팅 불러오기 실패" });
  }
};

export const getMoreMessages = async (req: Request, res: Response) => {
  try {
    const uid = req.query.uid as string;
    const messageID = req.query.messageID as string;
    const user1 = new mongoose.Types.ObjectId(res.locals.jwtUser.uid);
    const user2 = new mongoose.Types.ObjectId(uid);

    const messages = await messageModel
      .aggregate([
        {
          $match: {
            $or: [
              { $and: [{ to: user1 }, { from: user2 }] },
              { $and: [{ to: user2 }, { from: user1 }] },
            ],
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        { $match: { _id: { $lt: new mongoose.Types.ObjectId(messageID) } } },
        { $limit: 30 },
      ])
      .exec();

    res.status(StatusCodes.OK).send(messages.reverse());
  } catch (err) {
    console.log(err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ data: "채팅 불러오기 실패" });
  }
};
