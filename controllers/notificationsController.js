import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Buscar notificações do usuário logado
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
    console.error('Erro ao buscar notificações:', err);
    res.status(500).json({ error: 'Erro ao buscar notificações' });
  }
};

// Marcar notificação como lida
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
    console.error('Erro ao marcar notificação como lida:', err);
    res.status(500).json({ error: 'Erro ao marcar notificação como lida' });
  }
};

// Criar notificação (para qualquer evento)
export const createNotification = async (userEmail, mensagem) => {
  try {
    const { error } = await supabase
      .from('notificacoes')
      .insert({
        user_email: userEmail,
        mensagem,
        read: false,
        criado_em: new Date()
      });

    if (error) throw error;
  } catch (err) {
    console.error('Erro ao criar notificação:', err);
  }
};


