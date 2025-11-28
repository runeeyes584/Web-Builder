import { Router } from "express";
import {
    deleteUser,
    getAdminStats,
    getAllProjects,
    getAllUsers,
    getProjectById,
    getUserById,
    restoreUser,
} from "../controllers/Admin.controller";

const router = Router();

// Statistics route
router.get("/stats", getAdminStats);

// User management routes
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.delete("/users/:id", deleteUser);
router.post("/users/:id/restore", restoreUser);

// Project management routes
router.get("/projects", getAllProjects);
router.get("/projects/:id", getProjectById);

router.get("/stats", getAdminStats);

export default router;
