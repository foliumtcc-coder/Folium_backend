import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'; // ✅ importar jsonwebtoken

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha obrigatórios.' });
  }

  try {
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('id, name1, password, verificado, email')
      .eq('email', email)
      .single();

    console.log('Email recebido:', email);
    console.log('Usuário encontrado:', user);

    if (error || !user) return res.status(401).json({ error: 'Email ou senha incorretos.' });
    if (!user.verificado) return res.status(403).json({ error: 'Conta não verificada.' });

    const senhaValida = await bcrypt.compare(password, user.password);
    if (!senhaValida) return res.status(401).json({ error: 'Email ou senha incorretos.' });

    // 🔹 Gera token JWT manualmente
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name1 },
      process.env.JWT_SECRET, // ✅ coloque uma chave secreta no .env
      { expiresIn: '7d' }     // expiração do token
    );

    // 🔹 Retorna usuário + token
    return res.json({
      user: { id: user.id, name: user.name1, email: user.email },
      accessToken: token
    });

  } catch (err) {
    console.error('Erro interno:', err);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
};
