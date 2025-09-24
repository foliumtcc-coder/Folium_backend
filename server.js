import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import registerRouter from './routes/auth/register.js';
import verifyRouter from './routes/auth/verify.js';
import loginRouter from './routes/auth/login.js';
import confirmRouter from './routes/auth/confirm.js';
import projectsRouter from './routes/auth/projects.js';
import userRouter from './routes/auth/user.js';
import notifications from './routes/auth/notifications.js';
import projectsViewRouter from './routes/auth/projectsView.js';
import profileRouter from './routes/auth/profile.js';
import etapasRouter from './routes/auth/etapas.js';

dotenv.config();

const app = express();

// CORS configurado para aceitar credenciais (cookies não mais usados, mas pode deixar True se quiser)
app.use(cors({
  origin: process.env.FRONTEND_URL, // ex: 'https://folium.netlify.app'
  credentials: true,
}));

// Body parser
app.use(express.json());

// Rotas da API
app.use('/api/auth/register', registerRouter);
app.use('/api/auth/verify', verifyRouter);
app.use('/api/auth/login', loginRouter);
app.use('/api/auth/confirm', confirmRouter);
app.use('/api/auth/projects', projectsRouter);
app.use('/api/auth/user', userRouter);
app.use('/api/auth/notifications', notifications);
app.use('/api/auth/projectsView', projectsViewRouter);
app.use('/api/auth/profile', profileRouter);
app.use('/api/auth/etapas', etapasRouter);

// Rota de teste
app.get('/ping', (req, res) => res.send('pong'));

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
