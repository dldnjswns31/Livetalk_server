import { ErrorRequestHandler, NextFunction, Request } from "express";

const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const fs = require("fs");
require("dotenv").config();

const indexRouter = require("./routes/index");

const app = express();

app.use(
  logger("dev", {
    stream: fs.createWriteStream("app.log", { flags: "w" }),
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use((req: Request, res: Response, next: NextFunction) => {
  next(createError(404));
});

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
};
app.use(errorHandler);

const port = process.env.SERVER_PORT;

app.listen(port, () => {
  console.log(`Server is running on ${port} port...`);
});

module.exports = app;
