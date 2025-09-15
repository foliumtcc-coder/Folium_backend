export const logoutUser = (req, res) => {
  if (!req.session) {
    return res.status(400).json({ error: 'Nenhuma sessão ativa.' });
  }

  req.session.destroy(err => {
    if (err) {
      console.error('Erro ao destruir sessão:', err);
      return res.status(500).json({ error: 'Erro ao fazer logout.' });
    }
    res.clearCookie('connect.sid'); // ajuste o nome se customizou
    return res.json({ message: 'Logout realizado com sucesso.' });
  });
};
