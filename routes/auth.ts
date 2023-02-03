import { Request, Response } from "express";
import UserModel from "../models/users";

const express = require("express");

const router = express.Router();

router.post("/signup", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = new UserModel({ email, password });

  try {
    await user.save();
    res.status(200).json(req.body);
  } catch (err) {
    res.status(400).json(err);
  }
});

module.exports = router;
