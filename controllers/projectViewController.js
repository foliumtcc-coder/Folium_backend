// src/controllers/projectViewController.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Retorna todos os projetos públicos
export const getPublicProjects = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('projetos')
      .select('*')
      .eq('publico', true)
      .order('criado_em', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar projetos públicos' });
  }
};

// Retorna projetos privados do usuário logado
export const getPrivateProjects = async (req, res) => {
  const usuario_id = req.user.id;
  try {
    const { data: memberships } = await supabase
      .from('projetos_membros')
      .select('projeto_id')
      .eq('usuario_id', usuario_id)
      .eq('aceito', true);

    const privateIds = memberships.map(m => m.projeto_id);
    if (!privateIds.length) return res.json([]);

    const { data: projects, error } = await supabase
      .from('projetos')
      .select('*')
      .in('id', privateIds)
      .order('criado_em', { ascending: false });

    if (error) throw error;
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar projetos privados' });
  }
};

// Retorna todos os projetos visíveis para o usuário (públicos + privados)
export const getAllProjects = async (req, res) => {
  const usuario_id = req.user?.id;
  try {
    // Projetos públicos
    const { data: publicProjects } = await supabase
      .from('projetos')
      .select('*')
      .eq('publico', true)
      .order('criado_em', { ascending: false });

    let privateProjects = [];
    if (usuario_id) {
      const { data: memberships } = await supabase
        .from('projetos_membros')
        .select('projeto_id')
        .eq('usuario_id', usuario_id)
        .eq('aceito', true);

      const privateIds = memberships.map(m => m.projeto_id);
      if (privateIds.length) {
        const { data: privateData } = await supabase
          .from('projetos')
          .select('*')
          .in('id', privateIds)
          .order('criado_em', { ascending: false });
        privateProjects = privateData;
      }
    }

    res.json([...privateProjects, ...publicProjects]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar todos os projetos' });
  }
};

// Retorna projetos de um usuário específico (perfil)
// Retorna projetos de um usuário específico (perfil)
export const getUserProjects = async (req, res) => {
  const perfilId = String(req.params.id); // id do dono do perfil
  const logadoId = req.user ? String(req.user.id) : null;

  try {
    // Projetos públicos do perfil
    const { data: publicProjects, error: publicError } = await supabase
      .from('projetos')
      .select('*')
      .eq('criado_por', perfilId)
      .eq('publico', true)
      .order('criado_em', { ascending: false });

    if (publicError) throw publicError;

    let privateProjects = [];

    // Se o usuário logado é o dono do perfil, também retorna privados
    if (logadoId && logadoId === perfilId) {
      const { data: privateData, error: privateError } = await supabase
        .from('projetos')
        .select('*')
        .eq('criado_por', perfilId)
        .eq('publico', false)
        .order('criado_em', { ascending: false });

      if (privateError) throw privateError;
      privateProjects = privateData;
    }

    res.json([...publicProjects, ...privateProjects]);
  } catch (err) {
    console.error('[PROJECT VIEW] Erro ao buscar projetos do usuário:', err);
    res.status(500).json({ error: 'Erro ao buscar projetos do usuário' });
  }
};
