import { Pool } from 'pg';
import cloudinary from '../utils/cloudinary.js';
import multer from 'multer';

// Conexão com o banco
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Multer: armazenar arquivos na memória temporariamente
const upload = multer({ storage: multer.memoryStorage() });

// Middleware para upload de projeto
export const uploadProject = (req, res, next) => {
  const singleUpload = upload.single('proj-pic');

  singleUpload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: 'Erro no upload do arquivo.' });
    }

    // Se não houver arquivo, apenas segue
    if (!req.file) return next();

    // Upload para Cloudinary
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'projetos', allowed_formats: ['jpg', 'png', 'jpeg', 'webp'] },
      (error, result) => {
        if (error) return res.status(500).json({ error: 'Erro no Cloudinary' });

        // Adiciona a URL da imagem ao req.file.path
        req.file.path = result.secure_url;
        next();
      }
    );

    stream.end(req.file.buffer);
  });
};

// Controller para criar projeto
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

