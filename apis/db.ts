import mongoose, { MongooseError } from "mongoose";
import dotenv from "dotenv";
import { NextFunction, Request, Response } from "express";

dotenv.config();

const URI = process.env.MONGODB_URI;

mongoose.connect(URI as string, { dbName: "live_chat" });

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function callback() {
  console.log("MongoDB Connected...");
});

export default db;

// const connectDB = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     await mongoose.connect(URI as string, { dbName: "live_chat" });
//     console.log("MongoDB connected!");
//     next();
//   } catch (err) {
//     const error = err as MongooseError;
//     console.error(error.message);
//     process.exit(1);
//   }
// };

// export default connectDB;
