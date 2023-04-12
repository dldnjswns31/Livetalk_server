"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
// Create Schema for Users
const conversationSchema = new mongoose_1.default.Schema({
    participants: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "users" }],
    lastMessage: {
        type: String,
    },
}, {
    timestamps: true,
});
const conversationModel = mongoose_1.default.model("conversations", conversationSchema);
exports.default = conversationModel;
