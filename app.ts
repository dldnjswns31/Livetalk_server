import express, { ErrorRequestHandler } from "express";
import { Server, Socket } from "socket.io";
import { createServer } from "http";
import cors from "cors";
import createError from "http-errors";
import connectDB from "./apis/db";
import indexRouter from "./routes";
import authRouter from "./routes/auth";

require("dotenv").config();
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
  console.log(io.sockets.adapter, socket.id);
  console.log("---------");
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

  socket.on("private message", (data) => {
    socket.to(data.to).emit("private message", data);
  });

  socket.on("disconnect", () => {
    users = users.filter((user) => user.uid !== socket.uid);
    io.emit("users", users);
    console.log(`Socket ${socket.id} disconnected`);
  });
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(connectDB);

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
