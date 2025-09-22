import express from 'express';
import { authenticate } from '../utils/authenticate.js';

const router = express.Router();

router.get('/me', authenticate, (req, res) => {
  // Aqui já temos o usuário logado em req.user
  res.json({ user: req.user });
});

export default router;





