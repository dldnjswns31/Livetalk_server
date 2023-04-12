"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.createToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const JWT_TOKEN_SALT = process.env.JWT_SALT;
const createToken = (obj) => {
    return jsonwebtoken_1.default.sign(obj, JWT_TOKEN_SALT);
};
exports.createToken = createToken;
const verifyToken = (value) => {
    try {
        const data = jsonwebtoken_1.default.verify(value, JWT_TOKEN_SALT);
        return data;
    }
    catch (err) {
        console.log(err);
    }
};
exports.verifyToken = verifyToken;
