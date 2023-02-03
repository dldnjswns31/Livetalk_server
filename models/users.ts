import mongoose from "mongoose";

const users = new mongoose.Schema(
  {
    email: {
      type: String,
      requried: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const UserModel = mongoose.model("user", users);

export default UserModel;
