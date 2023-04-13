import express, { ErrorRequestHandler } from "express";
import { createServer } from "http";
import cors from "cors";
import createError from "http-errors";

import db from "./apis/db";
import indexRouter from "./routes";
import authRouter from "./routes/auth";
import chatRouter from "./routes/chat";
import { getIO, initSocket } from "./socket";

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
initSocket(server);
app.set("io", getIO());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/chat", chatRouter);

app.use((req, res, next) => {
  next(createError(404));
});

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
};
app.use(errorHandler);

const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`Server is running on ${port} port...`);
});

export default app;
