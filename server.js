import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import pg from 'pg';

import registerRouter from './routes/auth/register.js';
import verifyRouter from './routes/auth/verify.js';
import loginRouter from './routes/auth/login.js';
import confirmRouter from './routes/auth/confirm.js';
import projectsRouter from './routes/auth/projects.js';
import userRouter from './routes/auth/user.js';

dotenv.config();

const app = express();
const PGStore = pgSession(session);

// Cria o pool do PostgreSQL
const pgPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Supabase / Railway
});

// CORS configurado para permitir credenciais
app.use(cors({
  origin: process.env.FRONTEND_URL, // ex: 'https://folium.netlify.app'
  credentials: true,
}));

// Body parser e cookie parser
app.use(express.json());
app.use(cookieParser());

// Sessão com PostgreSQL usando o pool
app.use(session({
  store: new PGStore({
    pool: pgPool,              // ✅ usar pool
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'segredo-super-seguro',
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: 'none',           // necessário para cross-domain
    secure: true, // true apenas em produção HTTPS
    httpOnly: true
  }
}));

// Rotas da API
app.use('/api/auth/register', registerRouter);
app.use('/api/auth/verify', verifyRouter);
app.use('/api/auth/login', loginRouter);
app.use('/api/auth/confirm', confirmRouter);
app.use('/api/auth/projects', projectsRouter);
app.use('/api/auth/user', userRouter);

// Rota de teste
app.get('/ping', (req, res) => res.send('pong'));

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
