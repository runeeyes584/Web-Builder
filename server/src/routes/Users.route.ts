import express from "express";
import { handleClerkWebhook } from "../controllers/Users.controller";

const router = express.Router();

router.post("/clerk", handleClerkWebhook);

export default router;
