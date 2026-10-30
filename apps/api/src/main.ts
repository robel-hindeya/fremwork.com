import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // WEB_URL is a comma-separated list of sites allowed to call the API, e.g.
  // "https://fremwork.com,https://fremwork-web.vercel.app". Set ALLOW_VERCEL_PREVIEWS=true
  // to also allow Vercel preview deployments (*.vercel.app).
  const allowed = (process.env.WEB_URL ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  const previews = process.env.ALLOW_VERCEL_PREVIEWS === 'true';
  app.enableCors({
    origin: (origin: string | undefined, cb: (err: Error | null, ok?: boolean) => void) => {
      if (!origin) return cb(null, true); // curl, server-to-server
      const ok = allowed.includes(origin) || (previews && /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin));
      cb(null, ok);
    },
    credentials: false,
    exposedHeaders: ['Content-Disposition'],
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }));
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  console.log(`Fremwork API on port ${port}. Allowed sites: ${allowed.join(', ')}`);
}
bootstrap();
