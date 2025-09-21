// routes/auth/user.js
import express from 'express';
const router = express.Router();

/**
 * GET /api/auth/user/me
 * Retorna os dados do usuário logado na sessão.
 */
router.get('/me', (req, res) => {
  if (req.session.user) {
    // Retorna apenas informações seguras e necessárias para o frontend
    return res.json({
      user: {
        id: req.session.user.id,
        name: req.session.user.name1, // ou 'name' dependendo do seu banco
        email: req.session.user.email
      }
    });
  } else {
    return res.json({ user: null });
  }
});

export default router;
