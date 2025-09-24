// src/routes/projects.js
import express from 'express';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import {
  createProject,
  acceptInvite,
  uploadProject,
  updateProject,
  getProjectById,
  deleteProject
} from '../../controllers/projectsController.js';

const router = express.Router();

// Cria o cliente Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
router.delete('/:projectId', authenticateToken, deleteProjectController);

// NOVA ROTA: projetos de um usuário
router.get('/user/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;

  try {
    // Busca projetos que o usuário criou
    const { data: criados, error: errorCriados } = await supabase
      .from('projetos')
      .select('*')
      .eq('criado_por', userId);

    if (errorCriados) throw errorCriados;

    // Busca projetos em que ele é membro
    const { data: membros, error: errorMembros } = await supabase
      .from('projetos_membros')
      .select('projeto_id, projetos(*)')
      .eq('usuario_id', userId)
      .eq('aceito', true);

    if (errorMembros) throw errorMembros;

    // Mapeia os projetos do membro
    const projetosMembro = membros.map(m => m.projetos);

    // Junta projetos criados e de membro, removendo duplicados
    const projetos = [...criados, ...projetosMembro].filter(
      (v, i, a) => a.findIndex(p => p.id === v.id) === i
    );

    res.json(projetos);
  } catch (err) {
    console.error('Erro ao buscar projetos do usuário:', err);
    res.status(500).json({ error: 'Erro ao buscar projetos do usuário' });
  }
});

export default router;
