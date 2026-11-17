export type Route = {
  prefix: string;
  target: string;
  auth: boolean;
  publicIf?: (req: any) => boolean;
};

export class Routes {
  constructor(readonly routes: Route[], frontendUrl: string) {
    this.routes = [
      ...routes,
      { prefix: '/', target: frontendUrl, auth: false }
    ]
  }
}
