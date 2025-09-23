import express from 'express';
import { getUserProfile, updateProfile, uploadProfileImages } from '../../controllers/profileController.js';
import { authenticateToken } from '../../middlewares/auth.js';

const router = express.Router();

// Buscar perfil de um usuário
router.get('/:id', authenticateToken, getUserProfile);

// Atualizar perfil do usuário logado
router.put('/me', authenticateToken, uploadProfileImages, updateProfile);

export default router;
