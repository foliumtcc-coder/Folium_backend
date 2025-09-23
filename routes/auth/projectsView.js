import express from 'express';
import { getPublicProjects, getPrivateProjects, getAllProjects } from '../../controllers/projectViewController.js';
import { authenticate } from '../../utils/authenticate.js';

const router = express.Router();

router.get('/public', getPublicProjects);
router.get('/private', authenticate, getPrivateProjects);
router.get('/all', authenticate, getAllProjects);

export default router;
