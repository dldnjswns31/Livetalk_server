"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.USER_VALIDATION_ERRORS = exports.signupValidator = exports.loginValidator = void 0;
const validator_1 = __importDefault(require("validator"));
const loginValidator = (loginForm) => {
    if (Object.values(loginForm).some((v) => !v)) {
        return {
            isValid: false,
            message: exports.USER_VALIDATION_ERRORS.EMPTY_FORM,
        };
    }
    if (!validator_1.default.isEmail(loginForm.email)) {
        return {
            isValid: false,
            message: exports.USER_VALIDATION_ERRORS.INVALID_EMAIL,
        };
    }
    if (!validator_1.default.isLength(loginForm.password, { min: 8 })) {
        return {
            isValid: false,
            message: exports.USER_VALIDATION_ERRORS.INVALID_PASSWORD,
        };
    }
    return {
        isValid: true,
    };
};
exports.loginValidator = loginValidator;
const signupValidator = (signupForm) => {
    if (Object.values(signupForm).some((v) => !v)) {
        return {
            isValid: false,
            message: exports.USER_VALIDATION_ERRORS.EMPTY_FORM,
        };
    }
    if (!validator_1.default.isEmail(signupForm.email)) {
        return {
            isValid: false,
            message: exports.USER_VALIDATION_ERRORS.INVALID_EMAIL,
        };
    }
    if (!validator_1.default.isLength(signupForm.nickname, { max: 8 })) {
        return {
            isValid: false,
            message: exports.USER_VALIDATION_ERRORS.INVALID_NICKNAME,
        };
    }
    if (!validator_1.default.isLength(signupForm.password, { min: 8 })) {
        return {
            isValid: false,
            message: exports.USER_VALIDATION_ERRORS.INVALID_PASSWORD,
        };
    }
    return {
        isValid: true,
    };
};
exports.signupValidator = signupValidator;
exports.USER_VALIDATION_ERRORS = {
    EMPTY_FORM: "이메일 / 패스워드 값이 비어있습니다",
    INVALID_EMAIL: "이메일 형식에 맞게 입력해주세요",
    INVALID_PASSWORD: "패스워드 길이는 8 이상이어야 합니다",
    INVALID_NICKNAME: "닉네임의 길이는 8 이하이어야 합니다",
    USER_NOT_FOUND: "로그인에 실패했습니다",
    EXIST_USER: "이미 존재하는 유저입니다",
};
