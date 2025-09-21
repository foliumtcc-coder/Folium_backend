import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const loginUser = async (req, res) => {
  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha obrigatórios.' });
  }

  try {
    // Busca usuário no Supabase
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('id, name1, password, verificado')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Email ou senha incorretos.' });
    }

    if (!user.verificado) {
      return res.status(403).json({ error: 'Conta não verificada.' });
    }

    const senhaValida = await bcrypt.compare(password, user.password);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Email ou senha incorretos.' });
    }

    // 🔹 Configura sessão
    req.session.user = { id: user.id, name: user.name1, email };

    // Ajusta expiração do cookie se rememberMe for true
    if (rememberMe) {
      req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 dias
    } else {
      req.session.cookie.expires = false; // sessão termina ao fechar navegador
    }

    // Salva sessão antes de responder
    req.session.save(err => {
      if (err) {
        console.error('Erro ao salvar sessão:', err);
        return res.status(500).json({ error: 'Não foi possível salvar sessão.' });
      }

      console.log('Sessão criada:', req.session.user);

      return res.json({
        message: 'Login realizado com sucesso!',
        user: req.session.user
      });
    });

  } catch (err) {
    console.error('Erro interno:', err);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
};
