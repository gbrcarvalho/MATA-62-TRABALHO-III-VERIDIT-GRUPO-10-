import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { Route, Routes } from './routes.js';
import { Gateway } from './gateway.js';

const ACCOUNTS_URL = `http://localhost:${process.env.ACCOUNTS_SERVICE_PORT ?? 3001}`;
const RECORDS_URL = `http://localhost:${process.env.RECORDS_SERVICE_PORT ?? 3002}`;
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000';
const PORT = process.env.API_GATEWAY_SERVICE_PORT ?? 3009;

const allRoutes: Route[] = [
  { prefix: '/auth', target: ACCOUNTS_URL, auth: false },
  { prefix: '/accounts', target: ACCOUNTS_URL, auth: true, publicIf: (req) => req.method === 'POST' },
  { prefix: '/records', target: RECORDS_URL, auth: true },
];

const routes = new Routes(allRoutes, FRONTEND_URL)
const enabledCorsMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
const verifyHost = ACCOUNTS_URL
const verifyRoute = '/auth/verify'

async function bootstrap() {
  const app = await NestFactory.create<INestApplication>(AppModule, { bodyParser: false });

  Gateway.setup(app, routes, enabledCorsMethods, FRONTEND_URL, verifyHost, verifyRoute)

  await app.listen(PORT);
}

bootstrap();
