// src/routes/projectsViewRoutes.js
import express from 'express';
import { getPublicProjects, getPrivateProjects, getAllProjects } from '../../controllers/projectViewController.js';
import { authenticate } from '../../utils/authenticate.js'; // middleware correto

const router = express.Router();

/**
 * GET /projects/public
 * Retorna todos os projetos públicos
 * Acesso: público
 */
router.get('/public', getPublicProjects);

/**
 * GET /projects/private
 * Retorna os projetos privados do usuário logado
 * Acesso: privado (necessita login)
 */
router.get('/private', authenticate, getPrivateProjects);

/**
 * GET /projects/all
 * Retorna todos os projetos visíveis para o usuário logado (públicos + privados do usuário)
 * Acesso: privado (necessita login)
 */
router.get('/all', authenticate, getAllProjects);

export default router;
