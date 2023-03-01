import { Router } from "express";
import { signin, signup, verify } from "./../controllers/authController";

const authRouter = Router();

authRouter.post("/signup", signup);
authRouter.post("/signin", signin);
authRouter.get("/verify", verify);

export default authRouter;
