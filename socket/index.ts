import http from "http";
import mongoose from "mongoose";
import { Server, Socket } from "socket.io";
import messageModel from "../models/message";
import conversationModel from "../models/conversation";

let io: Server;
let userlist: {
  uid: string;
  nickname: string;
}[] = [];

// socket 연결
const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
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

// socket 반환
const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

// socket 이벤트 핸들러 모음

const sendConnectingUser = (socket: Socket) => {
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

const disconnect = (socket: Socket) => {
  socket.on("disconnect", () => {
    userlist = userlist.filter((user) => user.uid !== socket.uid);
    io.emit("userlist", userlist);
    console.log(`Socket ${socket.id} disconnected`);
  });
};

const sendMessage = (socket: Socket, io: Server) => {
  socket.on("message", async (data) => {
    const from = socket.uid;
    const { to, message: messageContent } = data;
    const fromObjectId = new mongoose.Types.ObjectId(from);
    const toObjectId = new mongoose.Types.ObjectId(to);

    const conversation = await conversationModel.findOneAndUpdate(
      {
        participants: {
          $all: [
            { $elemMatch: { $eq: fromObjectId } },
            { $elemMatch: { $eq: toObjectId } },
          ],
        },
      },
      {
        participants: [fromObjectId, toObjectId],
        lastMessage: messageContent,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    let message;
    let connectingUser = io.sockets.adapter.rooms.get(
      getRoomname(to, from)
    )?.size;

    if (connectingUser === 1) {
      message = new messageModel({
        conversation: conversation._id,
        to: toObjectId,
        from: fromObjectId,
        message: messageContent,
      });
    } else {
      message = new messageModel({
        conversation: conversation._id,
        to: toObjectId,
        from: fromObjectId,
        message: messageContent,
        isRead: true,
      });
    }

    const savedMessage = await message.save();

    // 채팅방에 메세지 전송
    io.to(getRoomname(from, to)).emit("private message", savedMessage);
    // 채팅 목록 갱신 용도
    io.to(to).to(from).emit("reload conversation");
  });
};

const joinRoom = (socket: Socket) => {
  socket.on("join room", async (uid) => {
    socket.join(getRoomname(uid, socket.uid));
  });
};

const leaveRoom = (socket: Socket) => {
  socket.on("leave room", async (uid) => {
    const myUid = socket.uid;
    const opponentUid = uid;
    const roomname = [myUid, opponentUid].sort().join("");

    socket.leave(roomname);
  });
};

const readMessage = (socket: Socket, io: Server) => {
  socket.on("read message", async (uid) => {
    socket.emit("remove unread", uid);
    io.to(getRoomname(uid, socket.uid)).emit("read message", uid);
  });
};

function getRoomname(uid1: string, uid2: string) {
  return [uid1, uid2].sort().join("");
}

export { initSocket, getIO };
