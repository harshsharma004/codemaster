import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { connectDB, prisma } from './db';

const app = express();

app.use(express.json());

// CORS configuration (matching Go backend)
const origins = env.CodeMaster_CORS_ORIGINS.split(',').map(o => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type']
}));

import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';
import friendsRoutes from './routes/friends.routes';
import autocompleteRoutes from './routes/autocomplete.routes';
import groupsRoutes from './routes/groups.routes';
import challengesRoutes from './routes/challenges.routes';
import feedRoutes from './routes/feed.routes';
import analyticsRoutes from './routes/analytics.routes';
import adminRoutes from './routes/admin.routes';

// Basic Health Endpoint matching Go backend `api.health`
app.get('/api/health', async (req, res) => {
  try {
    // Ping DB by executing a simple query
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok', database: 'ok' });
  } catch (err) {
    res.status(503).json({
      detail: 'Database unavailable.'
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/autocomplete', autocompleteRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/challenges', challengesRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api', analyticsRoutes);

if (env.CodeMaster_ENABLE_ADMIN) {
  app.use('/admin', adminRoutes);
}

const startServer = async () => {
  await connectDB();
  const port = parseInt(env.PORT, 10) || 4000;
  
  app.listen(port, () => {
    console.log(`Node.js API listening on port ${port}`);
  });
};

if (require.main === module) {
  startServer();
}

export default app;
