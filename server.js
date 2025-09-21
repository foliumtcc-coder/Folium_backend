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
import projectsRouter from './routes/projects.js';

dotenv.config();

const PGStore = pgSession(session);
const app = express();

const pgPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // necessário se for Railway com SSL
  },
});

// CORS com credenciais e origem liberada para o frontend hospedado
app.use(cors({
  origin: process.env.FRONTEND_URL, // ex: 'https://folium.netlify.app'
  credentials: true,
}));

// Body parser e cookie parser
app.use(express.json());
app.use(cookieParser());

// Sessão configurada para ambientes cross-domain (Netlify + Railway)
app.use(session({
  store: new PGStore({
    conString: process.env.DATABASE_URL, // deve estar correta
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'segredo-super-seguro',
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: 'none', // necessário para cross-domain
    secure: true,     // necessário com HTTPS (Netlify usa)
    httpOnly: true
  }
}));

// Rotas da API
app.use('/api/auth/register', registerRouter);
app.use('/api/auth/verify', verifyRouter);
app.use('/api/auth/login', loginRouter);
app.use('/api/auth/confirm', confirmRouter);
app.use('/api/auth/projects', projectsRouter);

// Teste rápido
app.get('/ping', (req, res) => res.send('pong'));

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
