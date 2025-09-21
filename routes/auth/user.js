import express from 'express';
const router = express.Router();

// GET /api/user/me
router.get('/me', (req, res) => {
  if (!req.session.user_id) return res.status(401).json({ user: null });

  res.json({ user: { id: req.session.user_id, nome: req.session.user_nome } });
});

export default router;
