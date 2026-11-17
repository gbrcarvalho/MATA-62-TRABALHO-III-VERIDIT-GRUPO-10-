import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import http from 'node:http';
import { AddressInfo } from 'node:net';
import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { Gateway } from './gateway.js';
import { Route, Routes } from './routes.js';

// servidores falsos que registram o que receberam

type Received = {
  method?: string;
  url?: string;
  headers: http.IncomingHttpHeaders;
  body: string;
};

type Fake = {
  server: http.Server;
  url: string;
  last?: Received;
  calls: number;
};

const VALID_TOKEN = 'Bearer valid-token';
const USER_ID = 42;
const FRONTEND_ORIGIN = 'http://localhost:3000';
const CORS_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

function startFake(name: string, extra?: (req: http.IncomingMessage, res: http.ServerResponse) => boolean): Promise<Fake> {
  return new Promise((resolve) => {
    const fake: Fake = { server: undefined as any, url: '', calls: 0 };

    fake.server = http.createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => {
        // /auth/verify chamado pelo gateway não conta como chamada "de negócio"
        if (extra && extra(req, res)) return;

        fake.calls++;
        fake.last = {
          method: req.method,
          url: req.url,
          headers: req.headers,
          body: Buffer.concat(chunks).toString(),
        };
        res.setHeader('content-type', 'text/plain');
        res.end(`${name}:${req.method}:${req.url}`);
      });
    });

    fake.server.listen(0, '127.0.0.1', () => {
      const { port } = fake.server.address() as AddressInfo;
      fake.url = `http://127.0.0.1:${port}`;
      resolve(fake);
    });
  });
}

function stop(fake: Fake): Promise<void> {
  return new Promise((resolve) => {
    if (!fake.server.listening) return resolve();
    fake.server.closeAllConnections(); // fetch/proxy mantêm keep-alive
    fake.server.close(() => resolve());
  });
}

// accounts falso: responde /auth/verify de acordo com o token recebido
function verifyHandler(req: http.IncomingMessage, res: http.ServerResponse): boolean {
  if (req.url !== '/auth/verify') return false;
  if (req.headers.authorization === VALID_TOKEN) {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ sub: USER_ID }));
  } else {
    res.statusCode = 401;
    res.end();
  }
  return true;
}

async function buildApp(accounts: Fake, records: Fake, front: Fake, verifyHost = accounts.url) {
  const allRoutes: Route[] = [
    { prefix: '/auth', target: accounts.url, auth: false },
    { prefix: '/accounts', target: accounts.url, auth: true, publicIf: (req) => req.method === 'POST' },
    { prefix: '/records', target: records.url, auth: true },
  ];

  const app = await NestFactory.create<INestApplication>(AppModule, { bodyParser: false, logger: false });
  Gateway.setup(app, new Routes(allRoutes, front.url), CORS_METHODS, FRONTEND_ORIGIN, verifyHost, '/auth/verify');
  await app.init();
  return app;
}

// Testes principais

describe('API Gateway', () => {
  let app: INestApplication;
  let accounts: Fake, records: Fake, front: Fake;
  let http$: http.Server;

  beforeAll(async () => {
    accounts = await startFake('accounts', verifyHandler);
    records = await startFake('records');
    front = await startFake('front');
    app = await buildApp(accounts, records, front);
    http$ = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
    await Promise.all([stop(accounts), stop(records), stop(front)]);
  });

  beforeEach(() => {
    for (const f of [accounts, records, front]) {
      f.calls = 0;
      f.last = undefined;
    }
  });

  describe('roteamento', () => {
    it('/auth/* vai para accounts sem exigir token', async () => {
      const res = await request(http$).post('/auth/login');
      expect(res.status).toBe(200);
      expect(res.text).toBe('accounts:POST:/auth/login');
    });

    it('/records/* vai para records', async () => {
      const res = await request(http$).get('/records/1').set('Authorization', VALID_TOKEN);
      expect(res.text).toBe('records:GET:/records/1');
    });

    it('qualquer outra rota cai no front (catch-all "/")', async () => {
      const res = await request(http$).get('/dashboard/settings');
      expect(res.text).toBe('front:GET:/dashboard/settings');
      expect(front.calls).toBe(1);
    });

    it('rota do front não chega em accounts nem records', async () => {
      await request(http$).get('/dashboard');
      expect(accounts.calls).toBe(0);
      expect(records.calls).toBe(0);
    });

    it('repassa query string', async () => {
      const res = await request(http$).get('/records?page=2&q=abc').set('Authorization', VALID_TOKEN);
      expect(res.text).toBe('records:GET:/records?page=2&q=abc');
    });

    it('repassa o body (bodyParser desligado)', async () => {
      await request(http$)
        .post('/records')
        .set('Authorization', VALID_TOKEN)
        .set('Content-Type', 'application/json')
        .send({ title: 'olá' });

      expect(records.last?.method).toBe('POST');
      expect(JSON.parse(records.last!.body)).toEqual({ title: 'olá' });
    });

    it.each(['PUT', 'PATCH', 'DELETE'] as const)('repassa o método %s', async (method) => {
      const res = await request(http$)[method.toLowerCase() as 'put' | 'patch' | 'delete']('/records/1').set(
        'Authorization',
        VALID_TOKEN,
      );
      expect(res.text).toBe(`records:${method}:/records/1`);
    });
  });

  describe('autenticação', () => {
    it('GET /accounts sem token → 401 com WWW-Authenticate', async () => {
      const res = await request(http$).get('/accounts');
      expect(res.status).toBe(401);
      expect(res.headers['www-authenticate']).toBe('Bearer');
      expect(res.body).toEqual({ message: 'Unauthorized' });
    });

    it('GET /accounts com token inválido → 401 e não chega no serviço', async () => {
      const res = await request(http$).get('/accounts').set('Authorization', 'Bearer errado');
      expect(res.status).toBe(401);
      expect(accounts.calls).toBe(0);
    });

    it('GET /accounts com token válido → 200', async () => {
      const res = await request(http$).get('/accounts').set('Authorization', VALID_TOKEN);
      expect(res.status).toBe(200);
      expect(res.text).toBe('accounts:GET:/accounts');
    });

    it('POST /accounts é público (cadastro), mesmo sem token', async () => {
      const res = await request(http$).post('/accounts').send({ email: 'a@b.c' });
      expect(res.status).toBe(200);
      expect(res.text).toBe('accounts:POST:/accounts');
    });

    it('/records sem token → 401 e records nunca é chamado', async () => {
      const res = await request(http$).get('/records/1');
      expect(res.status).toBe(401);
      expect(records.calls).toBe(0);
    });

    it('/records com token inválido → 401', async () => {
      const res = await request(http$).get('/records/1').set('Authorization', 'Bearer errado');
      expect(res.status).toBe(401);
      expect(records.calls).toBe(0);
    });

    it('injeta x-user-id vindo do payload do token', async () => {
      await request(http$).get('/records/1').set('Authorization', VALID_TOKEN);
      expect(records.last?.headers['x-user-id']).toBe(String(USER_ID));
    });

    it('cliente não consegue forjar x-user-id em rota protegida', async () => {
      await request(http$).get('/records/1').set('Authorization', VALID_TOKEN).set('x-user-id', '999');
      expect(records.last?.headers['x-user-id']).toBe(String(USER_ID));
    });

    it('repassa o header Authorization para o serviço de destino', async () => {
      await request(http$).get('/records/1').set('Authorization', VALID_TOKEN);
      expect(records.last?.headers.authorization).toBe(VALID_TOKEN);
    });

    // em rota pública (publicIf) o x-user-id enviado pelo cliente passa direto,
    // porque o gateway não limpa o header. O gateway deveria remover x-user-id
    // de toda requisição de entrada.
    // (it.fails) trocar por it(...) quando corrigir.
    it.fails('POST /accounts (público) não deveria repassar x-user-id forjado', async () => {
      await request(http$).post('/accounts').set('x-user-id', '999').send({});
      expect(accounts.last?.headers['x-user-id']).toBeUndefined();
    });
  });

  describe('rota de verificação', () => {
    it('/auth/verify não é exposta externamente (404)', async () => {
      const res = await request(http$).post('/auth/verify').set('Authorization', VALID_TOKEN);
      expect(res.status).toBe(404);
    });

    it('/auth/verify bloqueado não chega em accounts como rota de negócio', async () => {
      await request(http$).post('/auth/verify');
      expect(accounts.calls).toBe(0);
    });

    it('outras rotas /auth/* continuam passando', async () => {
      const res = await request(http$).post('/auth/refresh');
      expect(res.text).toBe('accounts:POST:/auth/refresh');
    });
  });

  describe('CORS', () => {
    it('preflight da origem do front é aceito', async () => {
      const res = await request(http$)
        .options('/records')
        .set('Origin', FRONTEND_ORIGIN)
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Authorization, Content-Type');

      expect(res.status).toBeLessThan(300);
      expect(res.headers['access-control-allow-origin']).toBe(FRONTEND_ORIGIN);
      expect(res.headers['access-control-allow-methods']).toBe(CORS_METHODS.join(','));
      expect(res.headers['access-control-allow-headers']).toMatch(/Authorization/i);
    });

    it('preflight não exige token nem chega no records', async () => {
      await request(http$)
        .options('/records')
        .set('Origin', FRONTEND_ORIGIN)
        .set('Access-Control-Request-Method', 'GET');
      expect(records.calls).toBe(0);
    });

    it('nunca devolve outra origem em Access-Control-Allow-Origin', async () => {
      const res = await request(http$).get('/auth/login').set('Origin', 'http://evil.com');
      expect(res.headers['access-control-allow-origin']).not.toBe('http://evil.com');
    });
  });

  // Mantido por último: derruba o accounts falso.
  describe('resiliência', () => {
    it('com accounts fora do ar, rota protegida responde 401 (comportamento atual)', async () => {
      await stop(accounts);
      const res = await request(http$).get('/records/1').set('Authorization', VALID_TOKEN);
      expect(res.status).toBe(401);
      expect(records.calls).toBe(0);
    });
  });
});

// joinUrl (privado): coberto indiretamente via verifyHost com barra no final.
// Roda num describe separado porque Gateway.verifyUrl é static e o último
// Gateway.setup sobrescreve o anterior.

describe('API Gateway - normalização da URL de verificação', () => {
  let app: INestApplication;
  let accounts: Fake, records: Fake, front: Fake;

  beforeAll(async () => {
    accounts = await startFake('accounts', verifyHandler);
    records = await startFake('records');
    front = await startFake('front');
    app = await buildApp(accounts, records, front, `${accounts.url}/`); // barra no final
  });

  afterAll(async () => {
    await app.close();
    await Promise.all([stop(accounts), stop(records), stop(front)]);
  });

  it('verifyHost com barra no final ainda autentica corretamente', async () => {
    const res = await request(app.getHttpServer()).get('/records/1').set('Authorization', VALID_TOKEN);
    expect(res.status).toBe(200);
    expect(records.last?.headers['x-user-id']).toBe(String(USER_ID));
  });
});
