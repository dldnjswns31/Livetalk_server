"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMoreMessages = exports.getUserMessageHistory = exports.getAllConversationList = exports.getAllUserList = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const http_status_codes_1 = require("http-status-codes");
const users_1 = __importDefault(require("../models/users"));
const conversation_1 = __importDefault(require("../models/conversation"));
const message_1 = __importDefault(require("../models/message"));
const getAllUserList = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const allUserList = yield users_1.default
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
        res.status(http_status_codes_1.StatusCodes.OK).send({ data: allUserList });
    }
    catch (err) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send("DB 조회 에러");
    }
});
exports.getAllUserList = getAllUserList;
const getAllConversationList = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const jwtUser = res.locals.jwtUser;
        const uid = new mongoose_1.default.Types.ObjectId(jwtUser.uid);
        const conversations = yield conversation_1.default
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
        res.status(http_status_codes_1.StatusCodes.OK).send(conversations);
    }
    catch (err) {
        res
            .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
            .send("채팅 목록 불러오기 실패");
    }
});
exports.getAllConversationList = getAllConversationList;
const getUserMessageHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const myUid = new mongoose_1.default.Types.ObjectId(res.locals.jwtUser.uid);
    const opponentUid = new mongoose_1.default.Types.ObjectId(req.query.uid);
    try {
        yield message_1.default.updateMany({ to: myUid, from: opponentUid, isRead: false }, { $set: { isRead: true } });
        const messages = yield message_1.default
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
        res.status(http_status_codes_1.StatusCodes.OK).send(messages);
    }
    catch (err) {
        console.log(err);
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send("채팅 불러오기 실패");
    }
});
exports.getUserMessageHistory = getUserMessageHistory;
const getMoreMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const uid = req.query.uid;
        const messageID = req.query.messageID;
        const user1 = new mongoose_1.default.Types.ObjectId(res.locals.jwtUser.uid);
        const user2 = new mongoose_1.default.Types.ObjectId(uid);
        const messages = yield message_1.default
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
            { $match: { _id: { $lt: new mongoose_1.default.Types.ObjectId(messageID) } } },
            { $limit: 30 },
        ])
            .exec();
        res.status(http_status_codes_1.StatusCodes.OK).send(messages.reverse());
    }
    catch (err) {
        console.log(err);
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send("채팅 불러오기 실패");
    }
});
exports.getMoreMessages = getMoreMessages;
