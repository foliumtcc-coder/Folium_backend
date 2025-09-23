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

import cloudinary from '../utils/cloudinary.js'; // Certifique que está exportando cloudinary configurado
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const updateProject = async (req, res) => {
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

    // Só permite dono atualizar
    if (projeto.criado_por !== logadoId) {
      return res.status(403).json({ error: 'Você não tem permissão para atualizar este projeto.' });
    }

    const { titulo, descricao, membros, publico } = req.body;
    let imagem = projeto.imagem;

    // Upload da imagem (se houver)
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload_stream({
          folder: 'projetos',
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
        }, (error, result) => {
          if (error) throw error;
          return result;
        });

        // Se multer estiver configurado para buffer:
        await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'projetos' },
            (error, result) => {
              if (error) reject(error);
              else {
                imagem = result.secure_url;
                resolve();
              }
            }
          );
          stream.end(req.file.buffer);
        });

      } catch (err) {
        console.error('[CLOUDINARY] Erro no upload:', err);
        return res.status(500).json({ error: 'Erro ao fazer upload da imagem.' });
      }
    }

    // Atualiza projeto
    const { data: updatedProjeto, error: updateError } = await supabase
      .from('projetos')
      .update({
        titulo,
        descricao,
        imagem,
        publico: !!publico,
        atualizado_em: new Date()
      })
      .eq('id', projetoId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Atualiza membros se fornecido
    if (membros) {
      // Limpa membros antigos
      await supabase.from('projetos_membros').delete().eq('projeto_id', projetoId);

      const emails = membros.split(',').map(m => m.trim()).filter(Boolean);
      for (const email of emails) {
        const { data: usuarioMembro } = await supabase
          .from('usuarios')
          .select('id')
          .eq('email', email)
          .single();
        if (!usuarioMembro) continue;

        await supabase.from('projetos_membros').insert({
          projeto_id: projetoId,
          usuario_id: usuarioMembro.id,
          aceito: false,
          adicionado_em: new Date()
        });

        await supabase.from('notificacoes').insert({
          usuario_id: usuarioMembro.id,
          projeto_id: projetoId,
          mensagem: `Você foi convidado para participar do projeto ${titulo}.`,
          tipo: 'convite',
          lida: false,
          criada_em: new Date()
        });
      }
    }

    res.json({ message: 'Projeto atualizado com sucesso!', projeto: updatedProjeto });

  } catch (err) {
    console.error('[PROJECT] Erro ao atualizar projeto:', err);
    res.status(500).json({ error: 'Erro ao atualizar projeto.' });
  }
};



// projectsController.js
export const deleteProject = async (req, res) => {
  const projetoId = req.params.id;
  const userId = req.user.id;

  try {
    // Buscar projeto no Supabase
    const { data: projeto, error: projectError } = await supabase
      .from('projetos')
      .select('*')
      .eq('id', projetoId)
      .single();

    if (projectError || !projeto) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    // Verificar se o usuário é dono
    if (projeto.criado_por !== userId) {
      return res.status(403).json({ error: 'Não autorizado a deletar este projeto' });
    }

    // Deletar etapas relacionadas
    await supabase
      .from('etapas')
      .delete()
      .eq('projeto_id', projetoId);

    // Deletar membros relacionados
    await supabase
      .from('projetos_membros')
      .delete()
      .eq('projeto_id', projetoId);

    // Deletar o próprio projeto
    await supabase
      .from('projetos')
      .delete()
      .eq('id', projetoId);

    return res.json({ message: 'Projeto deletado com sucesso' });
  } catch (err) {
    console.error('[PROJECT] Erro ao deletar projeto:', err);
    return res.status(500).json({ error: 'Erro ao deletar projeto' });
  }
};

