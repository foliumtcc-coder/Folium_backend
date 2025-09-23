// src/routes/projects.js
import express from 'express';
import jwt from 'jsonwebtoken';
import {
  createProject,
  acceptInvite,
  uploadProject,
  updateProject,
  getProjectById,
  deleteProject
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

// Rotas existentes
router.post('/create', authenticateToken, uploadProject, createProject);
router.patch('/:projeto_id/accept', authenticateToken, acceptInvite);
router.get('/:id', authenticateToken, getProjectById);
router.put('/:id', authenticateToken, uploadProject, updateProject);
router.delete('/:id', authenticateToken, deleteProject);

// NOVA ROTA: projetos de um usuário
router.get('/user/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;

  try {
    const { data: projetos, error } = await supabase
      .from('projetos')
      .select('*')
      .or(`criado_por.eq.${userId},projetos_membros.usuario_id.eq.${userId}`); 
      // caso queira incluir projetos em que é membro

    if (error) throw error;
    res.json(projetos);
  } catch (err) {
    console.error('Erro ao buscar projetos do usuário:', err);
    res.status(500).json({ error: 'Erro ao buscar projetos do usuário' });
  }
});

export default router;
