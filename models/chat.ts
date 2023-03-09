import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "chattingRoom",
    },
    from: { type: String, required: true },
    to: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const chatModel = mongoose.model("chats", chatSchema);

export default chatModel;
