import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env, corsOrigins } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import articlesRouter from './routes/articles';
import bannersPublicRouter from './routes/banners';
import publicAnalyticsRouter from './routes/publicAnalytics';
import categoriesRouter from './routes/categories';
import adminRouter from './routes/admin';

const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || corsOrigins.includes(origin) || env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/articles', articlesRouter);
app.use('/api/banners', bannersPublicRouter);
app.use('/api/analytics', publicAnalyticsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/admin', adminRouter);

const adminDist = path.join(__dirname, '../admin/dist');
app.use('/admin', express.static(adminDist));
app.get('/admin/*', (_req, res) => {
  res.sendFile(path.join(adminDist, 'index.html'), (err) => {
    if (err) {
      res.status(404).send('Admin panel not built. Run npm run admin:build');
    }
  });
});

app.use(errorHandler);

export default app;
