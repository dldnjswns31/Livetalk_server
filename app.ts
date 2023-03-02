import express, { ErrorRequestHandler } from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import cors from "cors";
import createError from "http-errors";

import db from "./apis/db";
import indexRouter from "./routes";
import authRouter from "./routes/auth";
import { getRooms, saveMessage } from "./controllers/socket/chatController";

require("dotenv").config();
// mongoose connect
db;
declare module "socket.io" {
  interface Socket {
    uid: string;
    nickname: string;
    email: string;
  }
}

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
app.set("io", io);

io.use((socket, next) => {
  const { uid, nickname } = socket.handshake.auth;

  socket.uid = uid;
  socket.nickname = nickname;
  socket.join(uid);
  next();
});

io.on("connection", async (socket) => {
  console.log(`${socket.id} connected`);

  // 새로운 유저가 접속할 때마다 모든 유저에게 새로운 유저 목록 발송
  let users: {
    uid: string;
    nickname: string;
    messages: [];
  }[] = [];
  for (let [id, socket] of io.of("/").sockets) {
    if (!users.find((item) => item.uid === socket.uid)) {
      users.push({
        uid: socket.uid,
        nickname: socket.nickname,
        messages: [],
      });
    }
  }

  io.emit("users", users);
  socket.broadcast.emit("newUser", { userID: socket.id });

  // 접속한 유저에게 현재 참여하고 있는 채팅방 목록 전송
  getRooms(socket.uid).then((data) => {
    if (!data) return;
    socket.emit("rooms", data.rooms);
  });

  // 개인 메세지 전송
  socket.on("private message", (data) => {
    console.log("message");
    saveMessage(data);
    socket.to(data.to).emit("private message", data);
  });

  // 연결 끊을 시 현재 유저 목록 재전송
  socket.on("disconnect", () => {
    users = users.filter((user) => user.uid !== socket.uid);
    io.emit("users", users);
    console.log(`Socket ${socket.id} disconnected`);
  });
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
// app.use(connectDB);

app.use("/", indexRouter);
app.use("/auth", authRouter);

app.use((req, res, next) => {
  next(createError(404));
});

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
};
app.use(errorHandler);

const port = process.env.SERVER_PORT;

server.listen(port, () => {
  console.log(`Server is running on ${port} port...`);
});

export default app;
