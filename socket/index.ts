import http from "http";
import mongoose from "mongoose";
import { Server, Socket } from "socket.io";
import chatModel from "../models/chat";
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
    sendMessage(socket);
    joinRoom(socket);
    leaveRoom(socket);
  });
};

// socket 반환
const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

/*
    socket event handler
*/

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

const sendMessage = (socket: Socket) => {
  socket.on("message", async (data) => {
    const from = socket.uid;
    const { to, message } = data;
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
        participants: [from, to],
        lastMessage: message,
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
      message: message,
    });

    const savedMessage = await chat.save();

    if (!socket.rooms.has(conversation._id.toString())) {
      socket.join(conversation._id.toString());
    }

    io.to(conversation._id.toString()).emit("private message", savedMessage);
    io.to(to).to(from).emit("reload conversation");
  });
};

const joinRoom = (socket: Socket) => {
  socket.on("join room", async (data) => {
    const user1 = new mongoose.Types.ObjectId(data.uid);
    const user2 = new mongoose.Types.ObjectId(socket.uid);

    const conversation = await conversationModel
      .findOne(
        {
          participants: {
            $all: [
              { $elemMatch: { $eq: user1 } },
              { $elemMatch: { $eq: user2 } },
            ],
          },
        },
        { _id: 1 }
      )
      .exec();

    if (conversation) {
      socket.join(conversation._id.toString());
    }
  });
};

const leaveRoom = (socket: Socket) => {
  socket.on("leave room", async (data) => {
    const user1 = new mongoose.Types.ObjectId(data.uid);
    const user2 = new mongoose.Types.ObjectId(socket.uid);

    const conversation = await conversationModel
      .findOne(
        {
          participants: {
            $all: [
              { $elemMatch: { $eq: user1 } },
              { $elemMatch: { $eq: user2 } },
            ],
          },
        },
        { _id: 1 }
      )
      .exec();

    if (conversation) {
      socket.leave(conversation._id.toString());
    }
  });
};

export { initSocket, getIO };
