import { INestApplication } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { Routes } from "./routes.js";

export class Gateway {
  private static verifyUrl: string = ''

  static setup(app: INestApplication, routes: Routes, enabledCorsMethods: string[], frontendUrl: string, verifyHost: string, verifyRoute: string): INestApplication {
    Gateway.verifyUrl = Gateway.joinUrl(verifyHost, verifyRoute)

    app.enableCors({
        origin: frontendUrl,
        methods: enabledCorsMethods,
        allowedHeaders: ['Content-Type', 'Authorization'],
    })

    app.use(verifyRoute, (_: Request, res: Response) => res.sendStatus(404));

    for (const r of routes.routes) {
      if (r.auth) {
        app.use(r.prefix, (req: Request, res: Response, next: NextFunction) =>
          r.publicIf?.(req) ? next() : Gateway.authenticate(req, res, next),
        );
      }
      app.use(createProxyMiddleware({ target: r.target, pathFilter: r.prefix, changeOrigin: true }));
    }
    return app
  }

  private static joinUrl(host: string, ...routes: string[]): string {
    return [host, ...routes]
      .map((p, i) => (i === 0 ? p.replace(/\/+$/, '') : p.replace(/^\/+|\/+$/g, '')))
      .filter(Boolean)
      .join('/');
  }

  private static async authenticate(req: Request, res: Response, next: NextFunction) {
    try {
      const r = await fetch(Gateway.verifyUrl, {
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
}
