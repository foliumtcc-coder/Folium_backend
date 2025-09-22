import slugify from 'slugify';
import { pool, supabase } from '../db.js'; // supondo que supabase já esteja configurado no db.js
import cloudinary from '../utils/cloudinary.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

// Middleware de upload da imagem do projeto
export const uploadProject = (req, res, next) => {
  const singleUpload = upload.single('imagem');
  singleUpload(req, res, (err) => {
    if (err) return res.status(400).json({ error: 'Erro no upload do arquivo.' });
    if (!req.file) return next();

    const stream = cloudinary.uploader.upload_stream(
      { folder: 'projetos', allowed_formats: ['jpg', 'png', 'jpeg', 'webp'] },
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
    // 1️⃣ Cria slug único
    let slug = slugify(titulo, { lower: true, strict: true });
    const { rows: exists } = await pool.query('SELECT 1 FROM projetos WHERE slug=$1', [slug]);
    if (exists.length > 0) slug = slug + '-' + Date.now();

    // 2️⃣ Insere projeto
    const result = await pool.query(
      `INSERT INTO projetos (slug, titulo, descricao, imagem, user_id, status, membros)
       VALUES ($1,$2,$3,$4,$5,'em_andamento',$6) RETURNING *`,
      [slug, titulo, descricao, imagem, criado_por, membros ? membros.split(',') : []]
    );

    const projeto = result.rows[0];

    // 3️⃣ Insere membros e cria notificações
    if (membros) {
      const emails = membros.split(',').map(m => m.trim()).filter(Boolean);

      for (const email of emails) {
        // Insere membro como 'pending'
        await supabase
          .from('projetos_membros')
          .insert({ projeto_id: projeto.id, email, status: 'pending', criado_em: new Date() });

        // Cria notificação para o membro
        const { error: notifError } = await supabase
          .from('notificacoes')
          .insert({
            user_email: email,
            projeto_id: projeto.id,
            mensagem: `Você foi convidado para participar do projeto ${titulo}.`,
            criado_em: new Date()
          });

        if (notifError) console.error('Erro ao criar notificação:', notifError);
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

    return res.json({ message: 'Convite aceito com sucesso!', membro: data });
  } catch (err) {
    console.error('Erro ao aceitar convite:', err.message);
    return res.status(500).json({ error: 'Erro ao aceitar convite.' });
  }
};
