import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Middleware JWT
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token inválido:', err);
    res.status(401).json({ error: 'Token inválido' });
  }
};

// GET /notifications → notificações do usuário logado
export const getNotifications = async (req, res) => {
  const email = req.user.email;
  try {
    const { data, error } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('user_email', email)
      .order('criado_em', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar notificações' });
  }
};

// POST /notifications/read/:id → marca como lida
export const markAsRead = async (req, res) => {
  const { id } = req.params;
  const email = req.user.email;

  try {
    const { data, error } = await supabase
      .from('notificacoes')
      .update({ read: true, atualizado_em: new Date() })
      .eq('id', id)
      .eq('user_email', email)
      .select()
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Notificação não encontrada' });

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao marcar notificação como lida' });
  }
};


