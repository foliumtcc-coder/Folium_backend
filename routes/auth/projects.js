// routes/auth/projects.js
import express from 'express';
import jwt from 'jsonwebtoken';
import { createProject, acceptInvite, uploadProject, updateProject, getProjectByIdController } from '../../controllers/projectsController.js';

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

// Criar projeto
router.post('/create', authenticateToken, uploadProject, createProject);

// Aceitar convite
router.patch('/:projeto_id/accept', authenticateToken, acceptInvite);

// Atualizar projeto
router.put('/:id', authenticateToken, uploadProject, updateProject);

// **Nova rota GET para buscar projeto pelo ID**
router.get('/:id', authenticateToken, getProjectByIdController);

export default router;
