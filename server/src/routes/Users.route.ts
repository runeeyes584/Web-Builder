import express from "express";
import { getUserStatus, handleClerkWebhook } from "../controllers/Users.controller";

const router = express.Router();

router.post("/clerk", handleClerkWebhook);
router.get("/status/:clerkId", getUserStatus);

export default router;
