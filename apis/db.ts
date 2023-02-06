import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const PASSWORD = process.env.MONGODB_PASSWORD;

mongoose.connect(
  `mongodb+srv://wonjuntwo:${PASSWORD}@cluster0.n0fuc1q.mongodb.net/?retryWrites=true&w=majority`,
  { dbName: "live_chat" }
);

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function callback() {
  console.log("MongoDB Connected...");
});

module.exports = db;
