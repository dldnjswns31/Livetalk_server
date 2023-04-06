import { NextFunction, Request, Response, Router } from "express";

let indexRouter = Router();

indexRouter.get(
  "/",
  function (req: Request, res: Response, next: NextFunction) {
    console.log("index");
    res.send("hello");
  }
);

export default indexRouter;
