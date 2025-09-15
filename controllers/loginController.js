import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import sendLoginCode from '../utils/sendLoginCode.js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export const loginUser = async (req, res) => {
  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  try {
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('id, name1, password, verificado')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Erro Supabase:', error);
      return res.status(500).json({ error: 'Erro no banco de dados.' });
    }
    if (!user) {
      return res.status(401).json({ error: 'Email ou senha incorretos.' });
    }

    if (!user.verificado) {
      return res.status(403).json({ error: 'Conta não verificada.' });
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Email ou senha incorretos.' });
    }

    // Gera código de 6 dígitos
    const loginCode = crypto.randomInt(100000, 999999).toString();

    // Armazena na sessão temporária
    req.session.tempUser = {
      id: user.id,
      name1: user.name1,
      email,
      code: loginCode,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutos
      rememberMe,
    };

    await sendLoginCode(email, loginCode);

    return res.json({ error: 'Código de confirmação enviado para seu e-mail.' });
  } catch (err) {
    console.error('Erro interno:', err);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
};
