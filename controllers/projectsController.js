import slugify from 'slugify';
import { createClient } from '@supabase/supabase-js';
import cloudinary from '../utils/cloudinary.js';
import multer from 'multer';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const upload = multer({ storage: multer.memoryStorage() });

// Middleware de upload
export const uploadProject = (req, res, next) => {
  const singleUpload = upload.single('imagem');
  singleUpload(req, res, (err) => {
    if (err) return res.status(400).json({ error: 'Erro no upload do arquivo.' });
    if (!req.file) return next();

    const stream = cloudinary.uploader.upload_stream(
      { folder: 'projetos', allowed_formats: ['jpg','png','jpeg','webp'] },
      (error, result) => {
        if (error) return res.status(500).json({ error: 'Erro no Cloudinary' });
        req.file.path = result.secure_url;
        next();
      }
    );
    stream.end(req.file.buffer);
  });
};

// Criar projeto
export const createProject = async (req, res) => {
  const { titulo, descricao, criado_por, membros } = req.body;
  const imagem = req.file ? req.file.path : null;

  try {
    // Cria slug
    let slug = slugify(titulo, { lower: true, strict: true });
    const { data: existing } = await supabase
      .from('projetos')
      .select('slug')
      .eq('slug', slug);

    if (existing.length > 0) slug += '-' + Date.now();

    // Insere projeto
    const { data: projeto, error: projectError } = await supabase
      .from('projetos')
      .insert([{
        slug, titulo, descricao, imagem, user_id: criado_por,
        status: 'em_andamento', membros: membros ? membros.split(',') : []
      }])
      .select()
      .single();

    if (projectError) throw projectError;

    // Insere membros e cria notificações
    if (membros) {
      const emails = membros.split(',').map(m => m.trim()).filter(Boolean);

      for (const email of emails) {
        await supabase
          .from('projetos_membros')
          .insert({ projeto_id: projeto.id, email, status: 'pending', criado_em: new Date() });

        await supabase
          .from('notificacoes')
          .insert({
            user_email: email,
            projeto_id: projeto.id,
            mensagem: `Você foi convidado para participar do projeto ${titulo}.`,
            criado_em: new Date()
          });
      }
    }

    res.status(201).json({ message: 'Projeto criado com sucesso!', projeto });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar projeto' });
  }
};

// Aceitar convite
export const acceptInvite = async (req, res) => {
  const { projeto_id } = req.params;
  const { email } = req.body;

  try {
    const { data, error } = await supabase
      .from('projetos_membros')
      .update({ status: 'accepted', atualizado_em: new Date() })
      .eq('projeto_id', projeto_id)
      .eq('email', email)
      .eq('status', 'pending')
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Convite não encontrado ou já aceito.' });

    res.json({ message: 'Convite aceito com sucesso!', membro: data });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao aceitar convite.' });
  }
};
