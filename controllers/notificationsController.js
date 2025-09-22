import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Buscar notificações do usuário logado
export const getNotifications = async (req, res) => {
  const usuario_id = req.user.id; // agora pega o ID do usuário

  try {
    const { data, error } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('usuario_id', usuario_id)
      .order('criada_em', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('Erro ao buscar notificações:', err);
    res.status(500).json({ error: 'Erro ao buscar notificações' });
  }
};

// Marcar notificação como lida
export const markAsRead = async (req, res) => {
  const { id } = req.params;
  const usuario_id = req.user.id;

  try {
    const { data, error } = await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('id', id)
      .eq('usuario_id', usuario_id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Notificação não encontrada' });

    res.json(data);
  } catch (err) {
    console.error('Erro ao marcar notificação como lida:', err);
    res.status(500).json({ error: 'Erro ao marcar notificação como lida' });
  }
};
