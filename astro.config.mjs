import { defineConfig, envField, fontProviders } from 'astro/config';
import { loadEnv } from 'vite';

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
  integrations: [vercelApiDev()],

  // Type-safe env vars, validated at build time (import from astro:env/*)
  env: {
    schema: {
      MICROCMS_SERVICE_DOMAIN: envField.string({ context: 'server', access: 'secret' }),
      MICROCMS_API_KEY: envField.string({ context: 'server', access: 'secret' }),
      PUBLIC_RECAPTCHA_SITE_KEY: envField.string({ context: 'client', access: 'public', optional: true, default: '' }),
    },
    validateSecrets: true,
  },

  // Self-host Google Fonts at build time (rendered with <Font /> in LayoutHome)
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Montserrat',
      cssVariable: '--font-montserrat',
      weights: [200, 300, 400, 500, 700, 800, 900],
      styles: ['normal', 'italic'],
      fallbacks: ['sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'JetBrains Mono',
      cssVariable: '--font-jetbrains-mono',
      weights: [400, 500],
      styles: ['normal'],
      fallbacks: ['ui-monospace', 'monospace'],
    },
  ],

  // Optimize microCMS eyecatch images at build time with <Image />
  image: { domains: ['images.microcms-assets.io'] },

  // Start loading the next page when a link is hovered
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
});
