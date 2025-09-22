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
  console.log('[UPLOAD] Iniciando upload do arquivo');
  const singleUpload = upload.single('imagem');

  singleUpload(req, res, (err) => {
    if (err) {
      console.error('[UPLOAD] Erro no multer:', err);
      return res.status(400).json({ error: 'Erro no upload do arquivo.' });
    }
    if (!req.file) {
      console.log('[UPLOAD] Nenhum arquivo enviado, seguindo sem imagem.');
      return next();
    }

    const stream = cloudinary.uploader.upload_stream(
      { folder: 'projetos', allowed_formats: ['jpg','png','jpeg','webp'] },
      (error, result) => {
        if (error) {
          console.error('[CLOUDINARY] Erro no upload:', error);
          return res.status(500).json({ error: 'Erro no Cloudinary' });
        }
        console.log('[CLOUDINARY] Upload finalizado:', result.secure_url);
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
  console.log('[PROJECT] Endpoint createProject chamado');
  console.log('[PROJECT] req.body:', req.body);
  console.log('[PROJECT] req.file:', req.file);

  try {
    const { titulo, descricao, criado_por, membros } = req.body;
    const imagem = req.file ? req.file.path : null;

    if (!titulo || !descricao || !criado_por) {
      console.warn('[PROJECT] Dados obrigatórios faltando');
      return res.status(400).json({ error: 'Título, descrição e criador são obrigatórios.' });
    }

    // Buscar ID do criador
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', criado_por)
      .single();

    if (!usuario) {
      return res.status(404).json({ error: 'Criador não encontrado.' });
    }

    // Cria slug único
    let slug = slugify(titulo, { lower: true, strict: true });
    const { data: existing } = await supabase
      .from('projetos')
      .select('slug')
      .eq('slug', slug);

    if (existing?.length > 0) slug += '-' + Date.now();

    // Insere projeto
    const { data: projeto, error: projectError } = await supabase
      .from('projetos')
      .insert([{
        slug,
        nome: titulo,
        descricao,
        imagem,
        user_id: usuario.id,
        status: 'em_andamento'
      }])
      .select()
      .single();

    if (projectError) {
      console.error('[PROJECT] Erro ao inserir projeto:', projectError);
      throw projectError;
    }

    console.log('[PROJECT] Projeto criado:', projeto);

    // Adiciona membros e cria notificações
    if (membros) {
      const emails = membros.split(',').map(m => m.trim()).filter(Boolean);
      console.log('[PROJECT] Membros a adicionar:', emails);

      for (const email of emails) {
        try {
          // Buscar ID do usuário membro
          const { data: usuarioMembro } = await supabase
            .from('usuarios')
            .select('id')
            .eq('email', email)
            .single();

          if (!usuarioMembro) {
            console.warn(`[PROJECT] Usuário não encontrado: ${email}`);
            continue;
          }

          // Inserir na tabela de membros
          const { error: memberError } = await supabase
            .from('projetos_membros')
            .insert({
              projeto_id: projeto.id,
              usuario_id: usuarioMembro.id,
              aceito: false,
              adicionado_em: new Date()
            });

          if (memberError) console.error('[PROJECT] Erro ao adicionar membro:', memberError);

          // Criar notificação
          const { error: notifError } = await supabase
            .from('notificacoes')
            .insert({
              usuario_id: usuarioMembro.id,
              projeto_id: projeto.id,
              mensagem: `Você foi convidado para participar do projeto ${titulo}.`,
              tipo: 'convite',
              lida: false,
              criada_em: new Date()
            });

          if (notifError) console.error('[PROJECT] Erro ao criar notificação:', notifError);

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
  const email = req.user.email; // precisa vir do middleware de autenticação

  console.log('[INVITE] Endpoint acceptInvite chamado');
  console.log('[INVITE] projeto_id:', projeto_id, 'email:', email);

  try {
    // Buscar ID do usuário
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .single();

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Atualizar convite
    const { data, error } = await supabase
      .from('projetos_membros')
      .update({ aceito: true, adicionado_em: new Date() })
      .eq('projeto_id', projeto_id)
      .eq('usuario_id', usuario.id)
      .eq('aceito', false)
      .select()
      .single();

    if (error) {
      console.error('[INVITE] Erro ao atualizar membro:', error);
      throw error;
    }

    if (!data) {
      console.warn('[INVITE] Convite não encontrado ou já aceito');
      return res.status(404).json({ error: 'Convite não encontrado ou já aceito.' });
    }

    console.log('[INVITE] Convite aceito:', data);
    res.json({ message: 'Convite aceito com sucesso!', membro: data });

  } catch (err) {
    console.error('[INVITE] Erro interno:', err);
    res.status(500).json({ error: 'Erro ao aceitar convite.' });
  }
};
