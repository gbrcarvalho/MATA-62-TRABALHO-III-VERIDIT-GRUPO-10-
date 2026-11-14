import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { NextFunction, Request, Response } from "express"

const ACCOUNTS = 'http://localhost:3001';
const RECORDS = 'http://localhost:3002';
const FRONT = 'http://localhost:3000';

type Route = {
  prefix: string;
  target: string;
  auth: boolean;
  publicIf?: (req: any) => boolean;
};

const routes: Route[] = [
  { prefix: '/auth', target: ACCOUNTS, auth: false },
  { prefix: '/accounts', target: ACCOUNTS, auth: true, publicIf: (req) => req.method === 'POST' },
  { prefix: '/records', target: RECORDS, auth: true },
  { prefix: '/', target: FRONT, auth: false }, // sempre por último
];

async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const r = await fetch(`${ACCOUNTS}/auth/verify`, {
      method: 'POST',
      headers: { authorization: req.headers.authorization ?? '' },
    });
    if (!r.ok) throw new Error();
    const payload = await r.json();
    req.headers['x-user-id'] = String(payload.sub);
    next();
  } catch {
    res.status(401).set('WWW-Authenticate', 'Bearer').json({ message: 'Unauthorized' });
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.use('/auth/verify', (_: Request, res: Response) => res.sendStatus(404));

  for (const r of routes) {
    if (r.auth) {
      app.use(r.prefix, (req: Request, res: Response, next: NextFunction) =>
        r.publicIf?.(req) ? next() : authenticate(req, res, next),
      );
    }
    app.use(createProxyMiddleware({ target: r.target, pathFilter: r.prefix, changeOrigin: true }));
  }

  await app.listen(3009);
}
bootstrap();
