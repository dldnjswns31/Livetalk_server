import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      requried: true,
    },
    password: {
      type: String,
      required: true,
    },
    nickname: {
      type: String,
      require: true,
    },
  },
  {
    timestamps: true,
  }
);

const UserModel = mongoose.model("user", userSchema);

export default UserModel;
