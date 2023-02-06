import jwt from "jsonwebtoken";
const JWT_TOKEN_SALT = "thisIsMyjwtSalt";

export const createToken = (value: string) => {
  return jwt.sign(value, JWT_TOKEN_SALT);
};

export const verifyToken = (value: string) => {
  return jwt.verify(value, JWT_TOKEN_SALT);
};
