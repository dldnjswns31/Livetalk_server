import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import bcrypt from "bcrypt";

import { loginValidator, signupValidator } from "./../utils/validator";
import { createToken, verifyToken } from "./../utils/authorizeUtils";
import userModel from "../models/users";

export const signin = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { isValid, message } = loginValidator({ email, password });

  if (!isValid) {
    return res.status(StatusCodes.BAD_REQUEST).send(message);
  }
  try {
    const dbUser = await userModel.findOne({ email }).exec();
    if (dbUser) {
      let isPasswordSame = await bcrypt.compare(password, dbUser.password);
      if (isPasswordSame) {
        const token = createToken({
          uid: dbUser._id.toString(),
          email: dbUser.email,
          nickname: dbUser.nickname,
        });
        res.setHeader("authorization", token);
        res.setHeader("Access-Control-Expose-Headers", "authorization");

        res.status(StatusCodes.OK).send({
          message: "성공적으로 로그인 했습니다.",
          data: {
            uid: dbUser._id,
            email: dbUser.email,
            nickname: dbUser.nickname,
          },
        });
      } else {
        res.status(StatusCodes.BAD_REQUEST).send("틀린 비밀번호입니다.");
      }
    } else
      res.status(StatusCodes.BAD_REQUEST).send("존재하지 않는 유저입니다.");
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
  }
};

export const signup = async (req: Request, res: Response) => {
  const { email, password, nickname } = req.body;
  const { isValid, message } = signupValidator({ email, nickname, password });
  if (!isValid) {
    return res.status(StatusCodes.BAD_REQUEST).send(message);
  }

  const duplicateEmail = await userModel.findOne({ email }).exec();
  if (duplicateEmail) {
    return res.status(StatusCodes.CONFLICT).send("이미 사용중인 이메일입니다.");
  }

  const duplicateNickname = await userModel.findOne({ nickname }).exec();
  if (duplicateNickname) {
    return res.status(StatusCodes.CONFLICT).send("이미 사용중인 닉네임입니다.");
  }

  const user = new userModel({ email, password, nickname });

  try {
    await user.save();
    res.status(StatusCodes.OK).send("회원가입 완료됐습니다.");
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
  }
};

export const verify = (req: Request, res: Response) => {
  if (req.headers.authorization) {
    const data = verifyToken(req.headers.authorization);
    if (data) {
      return res.status(StatusCodes.OK).send(data);
    } else {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .send("토큰이 만료되었습니다.");
    }
  } else {
    return res.status(StatusCodes.UNAUTHORIZED).send("토큰이 없습니다.");
  }
};
