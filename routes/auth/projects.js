// routes/auth/projects.js
import express from 'express';
import { createProject, acceptInvite } from '../../controllers/projectsController.js'; // note o .js no final
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware para autenticação via token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // aqui você terá os dados do usuário decodificado
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// Criar projeto (só para usuários logados)
router.post('/', authenticateToken, createProject);

// Aceitar convite (só para usuários logados)
router.patch('/:projeto_id/accept', authenticateToken, acceptInvite);

export default router;

