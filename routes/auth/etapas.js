// src/routes/etapasRoutes.js
import express from 'express';
import { 
  createEtapa, 
  getEtapasByProjeto, 
  getArquivosByEtapa, 
  updateEtapaController, 
  deleteEtapaController, 
  upload 
} from '../controllers/etapasController.js';

const router = express.Router();

// Criar uma nova etapa com arquivos
// 'arquivos' é o nome do campo do input de arquivos no frontend
router.post('/create', upload.array('arquivos', 10), createEtapa);

// Listar todas as etapas de um projeto
router.get('/projeto/:projeto_id', getEtapasByProjeto);

// Listar todos os arquivos de uma etapa
router.get('/arquivos/:etapa_id', getArquivosByEtapa);

// Editar etapa (nome e descrição)
router.put('/update', updateEtapaController);

// Deletar etapa
router.delete('/delete/:etapa_id', deleteEtapaController);

export default router;
