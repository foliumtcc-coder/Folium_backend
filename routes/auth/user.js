// routes/auth/user.js
import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

router.get('/me', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
  if (!token) return res.status(401).json({ user: null });

  const { data: user, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ user: null });

  return res.json({ user });
});

export default router;

