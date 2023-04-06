import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "conversations",
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const messageModel = mongoose.model("messages", messageSchema);

export default messageModel;
