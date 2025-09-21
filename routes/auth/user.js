// routes/auth/user.js
import express from 'express';
const router = express.Router();

/**
 * GET /api/auth/user/me
 * Retorna os dados do usuário logado na sessão.
 */
router.get('/me', (req, res) => {
  if (req.session?.user) {
    return res.json({
      user: {
        id: req.session.user.id,
        name: req.session.user.name1,
        email: req.session.user.email
      }
    });
  }

  return res.json({ user: null });
});

export default router;



