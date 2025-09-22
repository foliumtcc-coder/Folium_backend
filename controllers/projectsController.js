import slugify from 'slugify';
import { createClient } from '@supabase/supabase-js';
import cloudinary from '../utils/cloudinary.js';
import multer from 'multer';
console.log('Entrou no endpoint createProject', req.body, req.file);

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const upload = multer({ storage: multer.memoryStorage() });

// Middleware de upload
export const uploadProject = (req, res, next) => {
  const singleUpload = upload.single('imagem');
  singleUpload(req, res, (err) => {
    if (err) {
      console.error('Erro no upload do arquivo:', err);
      return res.status(400).json({ error: 'Erro no upload do arquivo.' });
    }
    if (!req.file) return next();

    const stream = cloudinary.uploader.upload_stream(
      { folder: 'projetos', allowed_formats: ['jpg','png','jpeg','webp'] },
      (error, result) => {
        if (error) {
          console.error('Erro no Cloudinary:', error);
          return res.status(500).json({ error: 'Erro no Cloudinary' });
        }
        req.file.path = result.secure_url;
        next();
      }
    );
    stream.end(req.file.buffer);
  });
};

// Criar projeto
export const createProject = async (req, res) => {
  console.log('REQ.BODY:', req.body);
  console.log('REQ.FILE:', req.file);
  console.log('REQ.USER:', req.user);
  console.log('slug gerado:', slug);
  console.log('Entrou no endpoint createProject', req.body, req.file);

  const { titulo, descricao, criado_por, membros } = req.body;
  const imagem = req.file ? req.file.path : null;

  try {
    let slug = slugify(titulo, { lower: true, strict: true });
    const { data: existing, error: existingError } = await supabase
      .from('projetos')
      .select('slug')
      .eq('slug', slug);

    if (existingError) {
      console.error('Erro ao buscar slug existente:', existingError);
      throw existingError;
    }

    if (existing.length > 0) slug += '-' + Date.now();

    const { data: projeto, error: projectError } = await supabase
      .from('projetos')
      .insert([{
        slug,
        nome: titulo,
        descricao,
        imagem,
        user_email: criado_por,
        status: 'em_andamento'
      }])
      .select()
      .single();

    if (projectError) {
      console.error('Erro ao criar projeto:', projectError);
      throw projectError;
    }

    console.log('Projeto criado com sucesso:', projeto);

    if (membros) {
      const emails = membros.split(',').map(m => m.trim()).filter(Boolean);
      for (const email of emails) {
        const { error: memberError } = await supabase
          .from('projetos_membros')
          .insert({ projeto_id: projeto.id, email, aceito: false, adicionado_em: new Date() });

        if (memberError) console.error('Erro ao adicionar membro:', memberError);

        const { error: notifError } = await supabase
          .from('notificacoes')
          .insert({
            email_usuario: email,
            mensagem: `Você foi convidado para participar do projeto ${titulo}.`,
            lida: false,
            criada_em: new Date()
          });

        if (notifError) console.error('Erro ao criar notificação:', notifError);
      }
    }

    res.status(201).json({ message: 'Projeto criado com sucesso!', projeto });

  } catch (err) {
    console.error('Erro geral no createProject:', err);
    res.status(500).json({ error: 'Erro ao criar projeto' });
  }
};

// Aceitar convite
export const acceptInvite = async (req, res) => {
  const { projeto_id } = req.params;
  const email = req.user.email;

  console.log('Aceitar convite para projeto_id:', projeto_id, 'usuário:', email);

  try {
    const { data, error } = await supabase
      .from('projetos_membros')
      .update({ aceito: true, adicionado_em: new Date() })
      .eq('projeto_id', projeto_id)
      .eq('email', email)
      .eq('aceito', false)
      .select()
      .single();

    if (error) {
      console.error('Erro ao aceitar convite:', error);
      throw error;
    }
    if (!data) return res.status(404).json({ error: 'Convite não encontrado ou já aceito.' });

    console.log('Convite aceito com sucesso:', data);
    res.json({ message: 'Convite aceito com sucesso!', membro: data });

  } catch (err) {
    console.error('Erro geral no acceptInvite:', err);
    res.status(500).json({ error: 'Erro ao aceitar convite.' });
  }
};
