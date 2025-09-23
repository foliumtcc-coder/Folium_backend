import express from 'express';
import { getPublicProjects, getPrivateProjects, getAllProjects, getUserProjects } from '../../controllers/projectViewController.js';
import { authenticate } from '../../utils/authenticate.js';

const router = express.Router();

router.get('/public', getPublicProjects);
router.get('/private', authenticate, getPrivateProjects);
router.get('/all', authenticate, getAllProjects);

// NOVA ROTA para projetos de um usuário específico
router.get('/user/:id', authenticate, getUserProjects);

export default router;
