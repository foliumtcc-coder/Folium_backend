// routes/auth/projects.js
import express from 'express';
import jwt from 'jsonwebtoken';
import { createProject, acceptInvite, uploadProject } from '../../controllers/projectsController.js'; // inclui uploadProject

const router = express.Router();

/* ---------------------------
   Middleware de autenticação
---------------------------- */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // dados do usuário do token
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

/* ---------------------------
   Rotas
---------------------------- */
// Criar projeto (só para usuários logados)
router.post('/create', authenticateToken, uploadProject, createProject);

// Aceitar convite (só para usuários logados)
router.patch('/:projeto_id/accept', authenticateToken, acceptInvite);

export default router;
