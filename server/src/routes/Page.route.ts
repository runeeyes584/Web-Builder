import express from "express";
import {
    createPage,
    deletePage,
    getAllPages,
    getPageById,
    getPagesByProject,
    updatePage,
} from "../controllers/Page.controller";

const router = express.Router();

// GET routes
router.get("/", getAllPages);                        // Get all pages
router.get("/project/:project_id", getPagesByProject); // Get pages by project
router.get("/:id", getPageById);                     // Get single page

// POST routes
router.post("/", createPage);                        // Create new page

// PUT routes
router.put("/:id", updatePage);                      // Update page

// DELETE routes
router.delete("/:id", deletePage);                   // Delete page

export default router;
