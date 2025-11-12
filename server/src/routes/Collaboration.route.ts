import { Router } from "express";
import {
    acceptInvitation,
    addCollaborator,
    getActiveSessions,
    getInvitationByToken,
    getProjectCollaborators,
    removeCollaborator,
    removeSession,
    sendInvitation,
    updateCollaboratorRole,
    updateInvitationRole,
    updateSession,
} from "../controllers/Collaboration.controller";

const router = Router();

// ==================== COLLABORATOR ROUTES ====================
router.get("/projects/:project_id/collaborators", getProjectCollaborators);
router.post("/projects/collaborators", addCollaborator);
router.put("/projects/collaborators/:id", updateCollaboratorRole);
router.delete("/projects/collaborators/:id", removeCollaborator);

// ==================== INVITATION ROUTES ====================
router.post("/projects/invitations", sendInvitation);
router.get("/projects/invitations/:token", getInvitationByToken);
router.post("/projects/invitations/accept", acceptInvitation);
router.put("/projects/invitations/:id", updateInvitationRole); // Update pending invitation role

// ==================== ACTIVE SESSION ROUTES ====================
router.post("/projects/sessions", updateSession);
router.get("/projects/:project_id/sessions", getActiveSessions);
router.delete("/projects/sessions", removeSession);

export default router;
