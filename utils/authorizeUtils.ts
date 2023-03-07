import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_TOKEN_SALT = process.env.JWT_SALT;

interface IJwtPayload {
  uid: string;
  email: string;
  nickname: string;
}

export const createToken = (obj: IJwtPayload) => {
  return jwt.sign(obj, JWT_TOKEN_SALT as string);
};

export const verifyToken = (value: string): IJwtPayload | undefined => {
  try {
    const data = jwt.verify(value, JWT_TOKEN_SALT as string) as IJwtPayload;
    return data;
  } catch (err) {
    console.log(err);
  }
};
