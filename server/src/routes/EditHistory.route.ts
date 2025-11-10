import { Router } from 'express';
import { EditHistoryController } from '../controllers/EditHistory.controller';

const router = Router();

// GET routes
router.get('/page/:pageId', EditHistoryController.getHistoryByPage);
router.get('/user/:clerkId', EditHistoryController.getHistoryByUser);
router.get('/:id', EditHistoryController.getHistoryById);

// POST routes
router.post('/', EditHistoryController.createHistory);
router.post('/page/:pageId/cleanup', EditHistoryController.cleanupOldHistory);

// DELETE routes
router.delete('/:id', EditHistoryController.deleteHistory);
router.delete('/page/:pageId', EditHistoryController.deleteAllHistoryByPage);

export default router;
