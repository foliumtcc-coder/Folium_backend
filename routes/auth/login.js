// routes/auth/login.js
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

router.post('/', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  try {
    // Busca usuário no Supabase
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('id, name1, password, verificado')
      .eq('email', email)
      .single();

    if (error || !user) return res.status(401).json({ error: 'Email ou senha incorretos.' });
    if (!user.verificado) return res.status(403).json({ error: 'Conta não verificada.' });

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) return res.status(401).json({ error: 'Email ou senha incorretos.' });

    // 🔹 Cria token JWT usando Supabase Auth
    const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) return res.status(401).json({ error: signInError.message });

    // Retorna token + dados do usuário
    return res.json({
      message: 'Login realizado com sucesso!',
      user: { id: user.id, name: user.name1, email },
      accessToken: sessionData.session.access_token
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

export default router;

