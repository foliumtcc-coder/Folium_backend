import express from 'express';
import { uploadProject, createProject } from '../../controllers/projectsController.js';

const router = express.Router();

// POST /api/projects
router.post('/', uploadProject, createProject);

export default router;
