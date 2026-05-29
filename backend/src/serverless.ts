// Serverless bootstrap for Vercel. Compiled by `nest build` (which emits the
// decorator metadata Nest's DI needs) → dist/serverless.js, then loaded by the
// thin JS shim in api/index.js. Local dev still uses main.ts unchanged.
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import express from 'express';
import { AppModule } from './app.module';

const expressApp = express();
let initialized: Promise<void> | null = null;

async function init(): Promise<void> {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
    logger: ['error', 'warn'],
  });
  app.use(helmet());
  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ extended: true, limit: '5mb' }));
  app.enableCors({ origin: process.env.FRONTEND_URL ?? '*', credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  await app.init(); // NOT listen() — serverless functions handle the socket
}

// One Nest app per warm container; reused across invocations (incl. the Mongo connection).
export default async function handler(req: express.Request, res: express.Response) {
  if (!initialized) initialized = init();
  await initialized;
  expressApp(req, res);
}
