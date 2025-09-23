// routes/auth/projects.js
import express from 'express';
import jwt from 'jsonwebtoken';
import { createProject, acceptInvite, uploadProject, updateProject, getProjectById } from '../../controllers/projectsController.js'; // <--- use getProjectById

const router = express.Router();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// Rotas
router.post('/create', authenticateToken, uploadProject, createProject);
router.patch('/:projeto_id/accept', authenticateToken, acceptInvite);

// Rota para buscar projeto por ID
router.get('/:id', authenticateToken, getProjectById); // <--- use getProjectById do controller

export default router;
