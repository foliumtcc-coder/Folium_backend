import { createClient } from '@supabase/supabase-js';
import cloudinary from '../utils/cloudinary.js';
import multer from 'multer';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const upload = multer({ storage: multer.memoryStorage() });

// Middleware para upload de avatar/banner
export const uploadProfileImages = (req, res, next) => {
  const singleUpload = upload.fields([
    { name: 'imagem_perfil', maxCount: 1 },
    { name: 'banner_fundo', maxCount: 1 }
  ]);

  singleUpload(req, res, async (err) => {
    if (err) return res.status(400).json({ error: 'Erro no upload do arquivo' });

    if (req.files['imagem_perfil']) {
      const buffer = req.files['imagem_perfil'][0].buffer;
      const result = await cloudinary.uploader.upload_stream({
        folder: 'usuarios',
        allowed_formats: ['jpg','png','jpeg','webp']
      }, (error, uploaded) => {
        if (error) console.error('Cloudinary avatar error:', error);
        else req.avatarUrl = uploaded.secure_url;
      });
      result.end(buffer);
    }

    if (req.files['banner_fundo']) {
      const buffer = req.files['banner_fundo'][0].buffer;
      const result = await cloudinary.uploader.upload_stream({
        folder: 'usuarios',
        allowed_formats: ['jpg','png','jpeg','webp']
      }, (error, uploaded) => {
        if (error) console.error('Cloudinary banner error:', error);
        else req.bannerUrl = uploaded.secure_url;
      });
      result.end(buffer);
    }

    next();
  });
};

// Atualizar perfil
export async function updateProfile(req, res) {
  const userId = req.user.id;
  const { descricao, instagram, linkedin, github } = req.body;

  try {
    const updateData = {
      descricao,
      instagram,
      linkedin,
      github,
    };

    if (req.avatarUrl) updateData.imagem_perfil = req.avatarUrl;
    if (req.bannerUrl) updateData.banner_fundo = req.bannerUrl;

    const { data, error } = await supabase
      .from('usuarios')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Perfil atualizado com sucesso!', user: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
}
