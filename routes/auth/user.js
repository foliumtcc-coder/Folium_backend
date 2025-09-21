import express from 'express';
const router = express.Router();

router.get('/me', (req, res) => {
  if (req.session.user) {
    return res.json({ user: req.session.user });
  } else {
    return res.json({ user: null });
  }
});

export default router;
