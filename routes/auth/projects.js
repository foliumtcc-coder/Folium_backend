import express from 'express';
import jwt from 'jsonwebtoken';
import {
  createProject,
  acceptInvite,
  uploadProject,
  updateProject,
  getProjectById,
  deleteProject   // <-- importar a função de deletar
} from '../../controllers/projectsController.js';

const router = express.Router();

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// Rotas
router.post('/create', authenticateToken, uploadProject, createProject);
router.patch('/:projeto_id/accept', authenticateToken, acceptInvite);
router.get('/:id', authenticateToken, getProjectById);   // GET projeto
router.put('/:id', authenticateToken, uploadProject, updateProject); // PUT atualizar

// --- NOVA ROTA DELETE ---
router.delete('/:id', authenticateToken, deleteProject); // DELETE projeto

export default router;
