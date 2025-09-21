import express from 'express';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) return res.status(401).json({ user: null });

  try {
    // 🔹 Valida o JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔹 Busca o usuário na tabela custom
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('id, name1, email')
      .eq('id', decoded.id)
      .single();

    if (error || !user) return res.status(401).json({ user: null });

    return res.json({ user });

  } catch (err) {
    console.error('Erro ao validar token:', err);
    return res.status(401).json({ user: null });
  }
});

export default router;




