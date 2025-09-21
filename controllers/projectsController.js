import { Pool } from 'pg';
import cloudinary from '../utils/cloudinary.js';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Configuração do multer + Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'projetos', allowed_formats: ['jpg','png','jpeg','webp'] },
});
const parser = multer({ storage });

export const uploadProject = parser.single('proj-pic');

export const createProject = async (req, res) => {
  const { titulo, descricao, criado_por } = req.body;
  const imagem = req.file ? req.file.path : null;

  try {
    const result = await pool.query(
      `INSERT INTO projetos (titulo, descricao, imagem, criado_por) VALUES ($1,$2,$3,$4) RETURNING *`,
      [titulo, descricao, imagem, criado_por]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar projeto' });
  }
};
