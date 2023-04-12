"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verify = exports.signup = exports.signin = void 0;
const http_status_codes_1 = require("http-status-codes");
const bcrypt_1 = __importDefault(require("bcrypt"));
const validator_1 = require("./../utils/validator");
const authorizeUtils_1 = require("./../utils/authorizeUtils");
const users_1 = __importDefault(require("../models/users"));
const signin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const { isValid, message } = (0, validator_1.loginValidator)({ email, password });
    if (!isValid) {
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send(message);
    }
    try {
        const dbUser = yield users_1.default.findOne({ email }).exec();
        if (dbUser) {
            let isPasswordSame = yield bcrypt_1.default.compare(password, dbUser.password);
            if (isPasswordSame) {
                const token = (0, authorizeUtils_1.createToken)({
                    uid: dbUser._id.toString(),
                    email: dbUser.email,
                    nickname: dbUser.nickname,
                });
                res.setHeader("authorization", token);
                res.setHeader("Access-Control-Expose-Headers", "authorization");
                res.status(http_status_codes_1.StatusCodes.OK).send({
                    message: "성공적으로 로그인 했습니다.",
                    data: {
                        uid: dbUser._id,
                        email: dbUser.email,
                        nickname: dbUser.nickname,
                    },
                });
            }
            else {
                res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send("틀린 비밀번호입니다.");
            }
        }
        else
            res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send("존재하지 않는 유저입니다.");
    }
    catch (err) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
    }
});
exports.signin = signin;
const signup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, nickname } = req.body;
    const { isValid, message } = (0, validator_1.signupValidator)({ email, nickname, password });
    if (!isValid) {
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send(message);
    }
    const duplicateEmail = yield users_1.default.findOne({ email }).exec();
    if (duplicateEmail) {
        return res.status(http_status_codes_1.StatusCodes.CONFLICT).send("이미 사용중인 이메일입니다.");
    }
    const duplicateNickname = yield users_1.default.findOne({ nickname }).exec();
    if (duplicateNickname) {
        return res.status(http_status_codes_1.StatusCodes.CONFLICT).send("이미 사용중인 닉네임입니다.");
    }
    const user = new users_1.default({ email, password, nickname });
    try {
        yield user.save();
        res.status(http_status_codes_1.StatusCodes.OK).send("회원가입 완료됐습니다.");
    }
    catch (err) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send("server error");
    }
});
exports.signup = signup;
const verify = (req, res) => {
    if (req.headers.authorization) {
        const data = (0, authorizeUtils_1.verifyToken)(req.headers.authorization);
        if (data) {
            return res.status(http_status_codes_1.StatusCodes.OK).send(data);
        }
        else {
            return res
                .status(http_status_codes_1.StatusCodes.UNAUTHORIZED)
                .send("토큰이 만료되었습니다.");
        }
    }
    else {
        return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).send("토큰이 없습니다.");
    }
};
exports.verify = verify;
