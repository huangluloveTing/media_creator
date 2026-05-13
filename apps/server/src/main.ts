import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  // Validate critical env vars
  const seedanceKey = config.get<string>('SEEDANCE_API_KEY');
  if (!seedanceKey || seedanceKey === 'your-api-key-here') {
    Logger.warn('SEEDANCE_API_KEY not configured — video generation will fail', 'Bootstrap');
  }

  app.set('etag', false);
  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(3001);
  Logger.log('Server running on http://localhost:3001', 'Bootstrap');
}
bootstrap();
