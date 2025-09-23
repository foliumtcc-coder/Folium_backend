// src/controllers/projectsController.js
import slugify from 'slugify';
import { createClient } from '@supabase/supabase-js';
import cloudinary from '../utils/cloudinary.js';
import multer from 'multer';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const upload = multer({ storage: multer.memoryStorage() });

/* ---------------------------
   Middleware de upload
---------------------------- */
export const uploadProject = (req, res, next) => {
  const singleUpload = upload.single('imagem');

  singleUpload(req, res, (err) => {
    if (err) {
      console.error('[UPLOAD] Erro no multer:', err);
      return res.status(400).json({ error: 'Erro no upload do arquivo.' });
    }
    if (!req.file) return next(); // sem imagem, segue normalmente

    const stream = cloudinary.uploader.upload_stream(
      { folder: 'projetos', allowed_formats: ['jpg','png','jpeg','webp'] },
      (error, result) => {
        if (error) {
          console.error('[CLOUDINARY] Erro no upload:', error);
          return res.status(500).json({ error: 'Erro no Cloudinary' });
        }
        req.file.path = result.secure_url;
        next();
      }
    );

    stream.end(req.file.buffer);
  });
};

/* ---------------------------
   Criar projeto
---------------------------- */
export const createProject = async (req, res) => {
  try {
    const { titulo, descricao, membros, publico } = req.body;
    const imagem = req.file ? req.file.path : null;
    const criado_por = req.user.id; // pega do middleware de autenticação

    if (!titulo || !descricao) {
      return res.status(400).json({ error: 'Título e descrição são obrigatórios.' });
    }

    // Cria slug único
    let slug = slugify(titulo, { lower: true, strict: true });
    const { data: existing } = await supabase
      .from('projetos')
      .select('slug')
      .eq('slug', slug);

    if (existing?.length > 0) slug += '-' + Date.now();

    // Insere projeto com campo público
    const { data: projeto, error: projectError } = await supabase
      .from('projetos')
      .insert([{
        slug,
        titulo,
        descricao,
        imagem,
        criado_por,
        publico: !!publico // converte para boolean
      }])
      .select()
      .single();

    if (projectError) {
      console.error('[PROJECT] Erro ao inserir projeto:', projectError);
      throw projectError;
    }

    // Adiciona membros e cria notificações
    if (membros) {
      const emails = membros.split(',').map(m => m.trim()).filter(Boolean);

      for (const email of emails) {
        try {
          const { data: usuarioMembro } = await supabase
            .from('usuarios')
            .select('id')
            .eq('email', email)
            .single();

          if (!usuarioMembro) continue;

          // Insere na tabela de membros
          await supabase.from('projetos_membros').insert({
            projeto_id: projeto.id,
            usuario_id: usuarioMembro.id,
            aceito: false,
            adicionado_em: new Date()
          });

          // Cria notificação
          await supabase.from('notificacoes').insert({
            usuario_id: usuarioMembro.id,
            projeto_id: projeto.id,
            mensagem: `Você foi convidado para participar do projeto ${titulo}.`,
            tipo: 'convite',
            lida: false,
            criada_em: new Date()
          });

        } catch (err) {
          console.error('[PROJECT] Erro em membro ou notificação:', err);
        }
      }
    }

    res.status(201).json({ message: 'Projeto criado com sucesso!', projeto });

  } catch (err) {
    console.error('[PROJECT] Erro interno:', err);
    res.status(500).json({ error: 'Erro ao criar projeto' });
  }
};

/* ---------------------------
   Aceitar convite
---------------------------- */
export const acceptInvite = async (req, res) => {
  const { projeto_id } = req.params;
  const usuario_id = req.user.id;

  try {
    const { data, error } = await supabase
      .from('projetos_membros')
      .update({ aceito: true, adicionado_em: new Date() })
      .eq('projeto_id', projeto_id)
      .eq('usuario_id', usuario_id)
      .eq('aceito', false)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Convite não encontrado ou já aceito.' });

    res.json({ message: 'Convite aceito com sucesso!', membro: data });

  } catch (err) {
    console.error('[INVITE] Erro interno:', err);
    res.status(500).json({ error: 'Erro ao aceitar convite.' });
  }
};

/* ---------------------------
   Buscar projetos (públicos + privados do usuário)
---------------------------- */
export const getProjects = async (req, res) => {
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
      const { data: privateMemberships } = await supabase
        .from('projetos_membros')
        .select('projeto_id')
        .eq('usuario_id', usuario_id)
        .eq('aceito', true);

      const privateIds = privateMemberships.map(p => p.projeto_id);

      if (privateIds.length) {
        const { data: privateProjectsData } = await supabase
          .from('projetos')
          .select('*')
          .in('id', privateIds)
          .order('criado_em', { ascending: false });
        privateProjects = privateProjectsData || [];
      }
    }

    const projects = [...privateProjects, ...publicProjects];
    res.json(projects);

  } catch (err) {
    console.error('[PROJECT] Erro ao buscar projetos:', err);
    res.status(500).json({ error: 'Erro ao buscar projetos' });
  }
};
