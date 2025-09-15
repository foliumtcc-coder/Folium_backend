import { error } from "console";

export const confirmLogin = (req, res) => {
  try {
    console.log('ConfirmLogin req.body:', req.body);

    const { code } = req.body;

    if (!req.session.tempUser) {
      return res.status(400).json({ error: 'Nenhuma tentativa de login pendente.' });
    }


    const { tempUser } = req.session;

    if (Date.now() > tempUser.expiresAt) {
      delete req.session.tempUser;
      return res.status(400).json({ error: 'Código expirado. Faça login novamente.' });
    }

    if (String(code) !== String(tempUser.code)) {
      return res.status(401).json({ error: 'Código incorreto.' });
    }

    req.session.user_id = tempUser.id;
    req.session.user_nome = tempUser.name1;

    if (tempUser.rememberMe) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 dias
    } else {
      delete req.session.cookie.maxAge;
    }

    delete req.session.tempUser;

    return res.json({ error: `Login confirmado! Bem-vindo, ${req.session.user_nome}.` });
  } catch (error) {
    console.error('Erro em confirmLogin:', error);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
};




