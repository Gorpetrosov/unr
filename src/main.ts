import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
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

  const port = config.get<number>('PORT', 4000);
  await app.listen(port);
  console.log(`Blog API listening on http://localhost:${port}`);
}

bootstrap();
