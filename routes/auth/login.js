// routes/auth/login.js
import express from 'express';
import { supabase } from '../../supabaseClient.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return res.status(401).json({ error: error.message });

  // Retorna usuário + access token
  return res.json({
    user: data.user,
    accessToken: data.session.access_token
  });
});

export default router;
