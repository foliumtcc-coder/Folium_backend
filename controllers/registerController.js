import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';
import sendVerificationEmail from '../utils/verificationEmail.js';
import crypto from 'crypto';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const registerUser = async (req, res) => {
  const { email, password, confipassword, name } = req.body;

  if (!email || !password || !confipassword || !name) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Formato de e-mail inválido.' });
  }

  if (password !== confipassword) {
    return res.status(400).json({ error: 'As senhas não coincidem.' });
  }

  const emailNormalized = email.trim().toLowerCase();

  try {
    const { data: existingUser, error } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', emailNormalized)
      .single();

    if (!error && existingUser) {
      return res.status(400).json({ error: 'Esse e-mail já está registrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const hash = crypto.randomBytes(4).toString('hex').toUpperCase();

    try {
      await sendVerificationEmail(emailNormalized, name, hash);
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError);
      return res.status(500).json({ error: 'Erro ao enviar email de verificação.' });
    }

    const { error: insertError } = await supabase
      .from('usuarios')
      .insert([{
        name1: name,
        email: emailNormalized,
        password: hashedPassword,
        verificado: false,
        hash1: hash,
      }]);

    if (insertError) {
      console.error('Erro ao registrar usuário:', insertError);
      return res.status(500).json({ error: 'Erro ao registrar usuário.' });
    }

    return res.status(201).json({ message: 'Usuário registrado com sucesso! Verifique seu e-mail para ativar a conta.' });
  } catch (err) {
    console.error('Erro no servidor:', err);
    return res.status(500).json({ error: 'Erro no servidor.' });
  }
};
