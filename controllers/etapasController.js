import { createClient } from '@supabase/supabase-js';
import cloudinary from '../utils/cloudinary.js';
import multer from 'multer';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const upload = multer({ storage: multer.memoryStorage() });

// --- Função auxiliar para upload no Cloudinary com promise ---
const uploadToCloudinary = (file, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'auto', folder },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(file.buffer);
  });
};

// --- Criar etapa ---
export const createEtapa = async (req, res) => {
  try {
    const { projeto_id, nome, descricao } = req.body;
    if (!projeto_id || !nome) return res.status(400).json({ error: 'Projeto e nome da etapa são obrigatórios' });

    // Próximo numero_etapa
    const { data: etapasExistentes, error: errCount } = await supabase
      .from('etapas')
      .select('id')
      .eq('projeto_id', projeto_id);

    if (errCount) throw errCount;
    const numero_etapa = (etapasExistentes?.length || 0) + 1;

    // Inserir etapa
    const { data: etapa, error: errEtapa } = await supabase
      .from('etapas')
      .insert([{ projeto_id, numero_etapa, nome_etapa: nome, descricao_etapa: descricao }])
      .select()
      .single();

    if (errEtapa) throw errEtapa;

    const arquivos = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploaded = await uploadToCloudinary(file, `projetos/${projeto_id}/etapas/${numero_etapa}`);
        const { data: arquivoDB, error: errArq } = await supabase
          .from('etapa_arquivos')
          .insert([{
            etapa_id: etapa.id,
            nome_arquivo: file.originalname,
            caminho_arquivo: uploaded.secure_url,
            tipo_arquivo: file.mimetype,
            tamanho: file.size
          }])
          .select()
          .single();
        if (errArq) throw errArq;
        arquivos.push(arquivoDB);
      }
    }

    res.status(201).json({ etapa, arquivos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar etapa' });
  }
};

// --- Editar etapa ---
export const updateEtapaController = async (req, res) => {
  try {
    const { etapa_id, nome, descricao } = req.body;
    if (!etapa_id || !nome) return res.status(400).json({ error: 'Etapa e nome são obrigatórios' });

    const { data: etapaAtualizada, error } = await supabase
      .from('etapas')
      .update({ nome_etapa: nome, descricao_etapa: descricao })
      .eq('id', etapa_id)
      .select()
      .single();

    if (error) throw error;
    res.json({ etapa: etapaAtualizada });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar etapa' });
  }
};

// --- Deletar etapa ---
export const deleteEtapaController = async (req, res) => {
  try {
    const { etapa_id } = req.params;
    if (!etapa_id) return res.status(400).json({ error: 'ID da etapa é obrigatório' });

    const { error } = await supabase
      .from('etapas')
      .delete()
      .eq('id', etapa_id);

    if (error) throw error;
    res.json({ message: 'Etapa deletada com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao deletar etapa' });
  }
};

// --- Listar etapas de um projeto ---
export const getEtapasByProjeto = async (req, res) => {
  try {
    const { projeto_id } = req.params;
    const { data: etapas, error } = await supabase
      .from('etapas')
      .select('*')
      .eq('projeto_id', projeto_id)
      .order('numero_etapa', { ascending: true });
    if (error) throw error;
    res.json({ etapas });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar etapas' });
  }
};

// --- Listar arquivos de uma etapa ---
export const getArquivosByEtapa = async (req, res) => {
  try {
    const { etapa_id } = req.params;
    const { data: arquivos, error } = await supabase
      .from('etapa_arquivos')
      .select('*')
      .eq('etapa_id', etapa_id);
    if (error) throw error;
    res.json({ arquivos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar arquivos da etapa' });
  }
};

export { upload };
