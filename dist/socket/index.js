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
exports.getIO = exports.initSocket = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const socket_io_1 = require("socket.io");
const message_1 = __importDefault(require("../models/message"));
const conversation_1 = __importDefault(require("../models/conversation"));
let io;
let userlist = [];
// socket 연결
const initSocket = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: "https://livetalk-client.vercel.app",
            methods: ["GET", "POST"],
        },
    });
    io.use((socket, next) => {
        const { uid, nickname } = socket.handshake.auth;
        socket.uid = uid;
        socket.nickname = nickname;
        socket.join(uid);
        next();
    });
    io.on("connection", (socket) => {
        sendConnectingUser(socket);
        disconnect(socket);
        sendMessage(socket, io);
        joinRoom(socket);
        leaveRoom(socket);
        readMessage(socket, io);
    });
};
exports.initSocket = initSocket;
// socket 반환
const getIO = () => {
    if (!io)
        throw new Error("Socket.io not initialized");
    return io;
};
exports.getIO = getIO;
// socket 이벤트 핸들러 모음
const sendConnectingUser = (socket) => {
    for (let [id, socket] of io.of("/").sockets) {
        if (!userlist.find((item) => item.uid === socket.uid)) {
            userlist.push({
                uid: socket.uid,
                nickname: socket.nickname,
            });
        }
    }
    socket.broadcast.emit("userlist", userlist);
    socket.on("userlist", () => {
        socket.emit("userlist", userlist);
    });
};
const disconnect = (socket) => {
    socket.on("disconnect", () => {
        userlist = userlist.filter((user) => user.uid !== socket.uid);
        io.emit("userlist", userlist);
        console.log(`Socket ${socket.id} disconnected`);
    });
};
const sendMessage = (socket, io) => {
    socket.on("message", (data) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const from = socket.uid;
        const { to, message: messageContent } = data;
        const fromObjectId = new mongoose_1.default.Types.ObjectId(from);
        const toObjectId = new mongoose_1.default.Types.ObjectId(to);
        const conversation = yield conversation_1.default.findOneAndUpdate({
            participants: {
                $all: [
                    { $elemMatch: { $eq: fromObjectId } },
                    { $elemMatch: { $eq: toObjectId } },
                ],
            },
        }, {
            participants: [fromObjectId, toObjectId],
            lastMessage: messageContent,
        }, {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
        });
        let message;
        let connectingUser = (_a = io.sockets.adapter.rooms.get(getRoomname(to, from))) === null || _a === void 0 ? void 0 : _a.size;
        if (connectingUser === 1) {
            message = new message_1.default({
                conversation: conversation._id,
                to: toObjectId,
                from: fromObjectId,
                message: messageContent,
            });
        }
        else {
            message = new message_1.default({
                conversation: conversation._id,
                to: toObjectId,
                from: fromObjectId,
                message: messageContent,
                isRead: true,
            });
        }
        const savedMessage = yield message.save();
        // 채팅방에 메세지 전송
        io.to(getRoomname(from, to)).emit("private message", savedMessage);
        // 채팅 목록 갱신 용도
        io.to(to).to(from).emit("reload conversation");
    }));
};
const joinRoom = (socket) => {
    socket.on("join room", (uid) => __awaiter(void 0, void 0, void 0, function* () {
        socket.join(getRoomname(uid, socket.uid));
    }));
};
const leaveRoom = (socket) => {
    socket.on("leave room", (uid) => __awaiter(void 0, void 0, void 0, function* () {
        const myUid = socket.uid;
        const opponentUid = uid;
        const roomname = [myUid, opponentUid].sort().join("");
        socket.leave(roomname);
    }));
};
const readMessage = (socket, io) => {
    socket.on("read message", (uid) => __awaiter(void 0, void 0, void 0, function* () {
        socket.emit("remove unread", uid);
        io.to(getRoomname(uid, socket.uid)).emit("read message", uid);
    }));
};
function getRoomname(uid1, uid2) {
    return [uid1, uid2].sort().join("");
}
