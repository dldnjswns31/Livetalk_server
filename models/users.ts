import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

dotenv.config();
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS);

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

userSchema.pre("save", async function (next) {
  const user = this;

  if (!user.isModified("password")) next();
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const hash = await bcrypt.hash(user.password, salt);
  user.password = hash;
  next();
});

const UserModel = mongoose.model("user", userSchema);

export default UserModel;
