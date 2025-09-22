import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Busca o usuário no banco
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('id, name1, email')
      .eq('id', decoded.id)
      .single();

    if (error || !user) return res.status(401).json({ error: 'Usuário não encontrado' });

    req.user = user; // coloca o usuário logado em req.user
    next();
  } catch (err) {
    console.error('Token inválido:', err);
    res.status(401).json({ error: 'Token inválido' });
  }
};


