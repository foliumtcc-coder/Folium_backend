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
