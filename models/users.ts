import mongoose from "mongoose";
import bcrypt from "bcrypt";

const saltRounds = 10;

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
  const salt = await bcrypt.genSalt(saltRounds);
  const hash = await bcrypt.hash(user.password, salt);
  user.password = hash;
  next();
});

const UserModel = mongoose.model("user", userSchema);

export default UserModel;
