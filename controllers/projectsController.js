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
    const criado_por = req.user.id;

    if (!titulo || !descricao) {
      return res.status(400).json({ error: 'Título e descrição são obrigatórios.' });
    }

    let slug = slugify(titulo, { lower: true, strict: true });
    const { data: existing } = await supabase
      .from('projetos')
      .select('slug')
      .eq('slug', slug);

    if (existing?.length > 0) slug += '-' + Date.now();

    const { data: projeto, error: projectError } = await supabase
      .from('projetos')
      .insert([{
        slug,
        titulo,
        descricao,
        imagem,
        criado_por,
        publico: !!publico
      }])
      .select()
      .single();

    if (projectError) {
      console.error('[PROJECT] Erro ao inserir projeto:', projectError);
      throw projectError;
    }

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

          await supabase.from('projetos_membros').insert({
            projeto_id: projeto.id,
            usuario_id: usuarioMembro.id,
            aceito: false,
            adicionado_em: new Date()
          });

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
   Buscar projeto por ID
---------------------------- */
export const getProjectById = async (req, res) => {
  const projetoId = req.params.id;
  const logadoId = req.user.id;

  try {
    // Busca projeto
    const { data: projeto, error: projectError } = await supabase
      .from('projetos')
      .select('*')
      .eq('id', projetoId)
      .single();

    if (projectError || !projeto) return res.status(404).json({ error: 'Projeto não encontrado' });

    // Verifica se usuário pode acessar (projeto privado)
    if (!projeto.publico) {
      const { data: membro } = await supabase
        .from('projetos_membros')
        .select('*')
        .eq('projeto_id', projetoId)
        .eq('usuario_id', logadoId)
        .eq('aceito', true)
        .single();

      if (logadoId !== projeto.criado_por && !membro) {
        return res.status(403).json({ error: 'Projeto privado' });
      }
    }

    // Busca etapas
    const { data: etapas } = await supabase
      .from('etapas')
      .select('*, usuarios(name1)')
      .eq('projeto_id', projetoId);

    // Busca membros
    const { data: membros } = await supabase
      .from('projetos_membros')
      .select('usuario_id, usuarios(name1)')
      .eq('projeto_id', projetoId)
      .eq('aceito', true);

    res.json({ projeto, etapas, membros });

  } catch (err) {
    console.error('[PROJECT] Erro ao buscar projeto:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
};
