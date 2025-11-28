import { Request, Response } from "express";
import { Webhook } from "svix";
import { prisma } from "../lib/prisma";

export const handleClerkWebhook = async (req: Request, res: Response) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET!;
  const payload = req.body;
  const headers = req.headers;

  const svix_id = headers["svix-id"] as string;
  const svix_timestamp = headers["svix-timestamp"] as string;
  const svix_signature = headers["svix-signature"] as string;

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ message: "Missing Svix headers" });
  }

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: any;

  try {
    evt = wh.verify(JSON.stringify(payload), {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("❌ Webhook verification failed:", err);
    return res.status(400).json({ message: "Invalid signature" });
  }

  const eventType = evt.type;
  const data = evt.data;
  const { id, email_addresses, first_name, last_name, username } = data;

  try {
    if (eventType === "user.created" || eventType === "user.updated") {
      await prisma.user.upsert({
        where: { clerk_id: id },
        update: {
          email: email_addresses[0]?.email_address,
          first_name,
          last_name,
          username,
        },
        create: {
          clerk_id: id,
          email: email_addresses[0]?.email_address,
          first_name,
          last_name,
          username,
          role: "user", // 👈 mặc định user
        },
      });

      console.log(`✅ Synced Clerk user: ${email_addresses[0]?.email_address}`);
    }

    if (eventType === "user.deleted") {
      await prisma.user.deleteMany({ where: { clerk_id: id } });
      console.log(`🗑️ Deleted Clerk user: ${id}`);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserStatus = async (req: Request, res: Response) => {
  try {
    const { clerkId } = req.params;

    const user = await prisma.user.findUnique({
      where: { clerk_id: clerkId },
      select: { is_deleted: true, role: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ is_deleted: user.is_deleted, role: user.role });
  } catch (error) {
    console.error("Error fetching user status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
