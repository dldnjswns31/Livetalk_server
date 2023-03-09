import mongoose from "mongoose";

// Create Schema for Users
const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
    lastMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const conversationModel = mongoose.model("conversations", conversationSchema);

export default conversationModel;
