// routes/auth/verify.js
import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Agora a rota é só /api/auth/verify, hash vem via query string
router.get('/', async (req, res) => {
  const { hash } = req.query;
  console.log('Hash recebido via query:', hash);

  if (!hash) {
    return res.status(400).json({ success: false, message: 'Hash não fornecido.' });
  }

  const { data: user, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('hash1', hash)
    .single();

  if (error || !user) {
    return res.status(400).json({ success: false, message: 'Link inválido ou expirado.' });
  }

  if (user.verificado) {
    return res.status(200).json({ success: true, message: 'Conta já estava verificada.' });
  }

  const { error: updateError } = await supabase
    .from('usuarios')
    .update({ verificado: true, hash1: null })
    .eq('id', user.id);

  if (updateError) {
    console.error(updateError);
    return res.status(500).json({ success: false, message: 'Erro ao verificar sua conta.' });
  }

  res.status(200).json({ success: true, message: 'Conta verificada com sucesso!' });
});

export default router;



