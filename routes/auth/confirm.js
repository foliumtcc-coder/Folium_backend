import express from 'express';
import { confirmLogin } from '../../controllers/confirmController.js';

const router = express.Router();

router.post('/', confirmLogin);

export default router;



