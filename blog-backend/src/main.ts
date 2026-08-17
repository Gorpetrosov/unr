import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { existsSync } from 'fs';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { corsOrigins } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  const origins = corsOrigins(config.getOrThrow<string>('CORS_ORIGIN'));
  const nodeEnv = config.get<string>('NODE_ENV', 'development');

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || origins.includes(origin) || nodeEnv === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
  });

  const adminIndex = join(__dirname, '..', 'admin', 'dist', 'index.html');
  app.use((req: Request, res: Response, next: () => void) => {
    if (!req.path.startsWith('/admin') || req.path.startsWith('/api')) {
      return next();
    }
    // Let static assets (files with extensions) fall through to ServeStaticModule
    if (/\.[a-zA-Z0-9]+$/.test(req.path)) {
      return next();
    }
    if (existsSync(adminIndex)) {
      return res.sendFile(adminIndex);
    }
    return res.status(404).send('Admin panel not built. Run npm run admin:build');
  });

  const port = config.get<number>('PORT', 4000);
  await app.listen(port);
  console.log(`Blog API listening on http://localhost:${port}`);
  console.log(`Admin panel at http://localhost:${port}/admin`);
}

bootstrap();
