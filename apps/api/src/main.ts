import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: (process.env.WEB_URL ?? 'http://localhost:3000').split(','),
    credentials: false,
    exposedHeaders: ['Content-Disposition'],
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }));
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  console.log(`Fremwork API on http://localhost:${port}`);
}
bootstrap();
