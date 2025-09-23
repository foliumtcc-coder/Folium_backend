import express from 'express';
import { getUserProfile, updateProfile, uploadProfileImages } from '../../controllers/profileController.js';
import { authenticate } from '../../utils/authenticate.js'; // middleware correto

const router = express.Router();

// Buscar perfil de um usuário
router.get('/:id', authenticate, getUserProfile);

// Atualizar perfil do usuário logado
router.put('/me', authenticate, uploadProfileImages, updateProfile);

export default router;
