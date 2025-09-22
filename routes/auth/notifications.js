import express from 'express';
import { getNotifications, markAsRead } from '../controllers/notificationsController.js';
import { authenticate } from '../utils/authenticate.js'; // seu middleware JWT

const router = express.Router();

// Buscar notificações do usuário logado
router.get('/', authenticate, getNotifications);

// Marcar notificação como lida
router.post('/read/:id', authenticate, markAsRead);

export default router;


