import express from "express";
import {
    createProject,
    deleteProject,
    getAllProjects,
    getProjectById,
    getProjectsByUser,
    getUserRole,
    updateProject,
} from "../controllers/Project.controller";

const router = express.Router();

// GET routes
router.get("/", getAllProjects);                    // Get all projects
router.get("/user/:clerk_id", getProjectsByUser);  // Get projects by user (LOAD)
router.get("/:id", getProjectById);                // Get single project
router.get("/:projectId/role/:clerkId", getUserRole); // Get user's role in project

// POST routes
router.post("/", createProject);                   // Create new project (SAVE)

// PUT routes
router.put("/:id", updateProject);                 // Update project

// DELETE routes
router.delete("/:id", deleteProject);              // Delete project

export default router;
