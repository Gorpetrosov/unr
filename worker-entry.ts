import { DurableObject } from "cloudflare:workers";

const INACTIVITY_TIMEOUT_MS = 2 * 60 * 60 * 1000;

export class NestApp extends DurableObject {
  private starting: Promise<void> | undefined;

  async fetch(request: Request): Promise<Response> {
    this.starting ??= this.startAndWaitForPort().finally(() => {
      this.starting = undefined;
    });
    await this.starting;

    const url = new URL(request.url);
    url.protocol = "http:";
    url.host = "container";
    const forwarded = new Request(url, request);
    forwarded.headers.delete("host");
    return this.ctx.container.getTcpPort(3000).fetch(forwarded);
  }

  private async startAndWaitForPort(): Promise<void> {
    const container = this.ctx.container;
    if (!container.running) {
      container.start({
        image: container.images.base,
        enableInternet: true,
        env: {
          DATABASE_URL: this.env.DATABASE_URL,
          JWT_SECRET: this.env.JWT_SECRET,
          JWT_REFRESH_SECRET: this.env.JWT_REFRESH_SECRET,
          ADMIN_PASSWORD: this.env.ADMIN_PASSWORD,
          NODE_ENV: "production",
        },
      });
    }
    await container.setInactivityTimeout(INACTIVITY_TIMEOUT_MS);

    const port = container.getTcpPort(3000);
    let lastError: unknown;
    for (let attempt = 0; attempt < 300; attempt++) {
      try {
        const response = await port.fetch("http://container/api/health", {
          signal: AbortSignal.timeout(2000),
        });
        await response.body?.cancel();
        if (!response.ok) {
          throw new Error(`Health check returned ${response.status}`);
        }
        return;
      } catch (error) {
        lastError = error;
        await scheduler.wait(1000);
      }
    }
    throw new Error("Container did not become ready on port 3000", {
      cause: lastError,
    });
  }
}

export default {
  async fetch(
      request: Request,
      env: { NEST_APP: DurableObjectNamespace }
  ): Promise<Response> {
    const id = env.NEST_APP.idFromName("primary");
    const stub = env.NEST_APP.get(id);
    return stub.fetch(request);
  },
};
