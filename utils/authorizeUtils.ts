import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_TOKEN_SALT = process.env.JWT_SALT;

export const createToken = (obj: { uid: any; email: any; nickname: any }) => {
  return jwt.sign(obj, JWT_TOKEN_SALT as string);
};

export const verifyToken = (value: string) => {
  return jwt.verify(value, JWT_TOKEN_SALT as string);
};
