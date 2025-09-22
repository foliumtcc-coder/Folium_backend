import express from 'express';
import { getNotifications, markAsRead } from '../../controllers/notificationsController.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// Buscar notificações do usuário logado
router.get('/me', authenticateToken, getNotifications);

// Marcar como lida
router.post('/read/:id', authenticateToken, markAsRead);

export default router;


