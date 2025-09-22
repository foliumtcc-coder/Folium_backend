import express from 'express';
import { getNotifications, markAsRead, authenticate } from '../../controllers/notificationsController.js';

const router = express.Router();

router.get('/', authenticate, getNotifications);
router.post('/read/:id', authenticate, markAsRead);

export default router;

