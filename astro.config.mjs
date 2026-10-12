import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

import react from "@astrojs/react";

// Serve Vercel Functions in /api during `astro dev` (production uses Vercel directly)
const vercelApiDev = () => ({
  name: 'vercel-api-dev',
  hooks: {
    'astro:server:setup': ({ server }) => {
      Object.assign(process.env, loadEnv('development', process.cwd(), ''));
      server.middlewares.use(async (req, res, next) => {
        const match = req.url?.match(/^\/api\/([\w-]+)\/?(?:\?.*)?$/);
        if (!match) return next();
        try {
          const mod = await server.ssrLoadModule(`/api/${match[1]}.ts`);
          const handler = mod[req.method ?? 'GET'];
          if (!handler) {
            res.statusCode = 405;
            return res.end();
          }
          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          const request = new Request(new URL(req.url, `http://${req.headers.host}`), {
            method: req.method,
            headers: req.headers,
            body: chunks.length ? Buffer.concat(chunks) : undefined,
          });
          const response = await handler(request);
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (err) {
          next(err);
        }
      });
    },
  },
});

// https://astro.build/config
export default defineConfig({
  integrations: [react(), vercelApiDev()]
});
