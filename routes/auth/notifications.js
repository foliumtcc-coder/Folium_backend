// routes/notificationsRouter.js
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Middleware para validar token JWT
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // guarda info do usuário
    next();
  } catch (err) {
    console.error('Token inválido:', err);
    return res.status(401).json({ error: 'Token inválido' });
  }
}

// GET /api/notifications/:email → retorna notificações do usuário
router.get('/:email', authenticate, async (req, res) => {
  const { email } = req.params;

  try {
    const { data, error } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('user_email', email)
      .order('criado_em', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('Erro ao buscar notificações:', err);
    res.status(500).json({ error: 'Erro ao buscar notificações' });
  }
});

// POST /api/notifications/read/:id → marca uma notificação como lida
router.post('/read/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('notificacoes')
      .update({ read: true, atualizado_em: new Date() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('Erro ao marcar notificação como lida:', err);
    res.status(500).json({ error: 'Erro ao marcar notificação como lida' });
  }
});

export default router;
