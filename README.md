# Astro Base

**English** | [日本語](./README.ja.md)

A portfolio site built with Astro 7 and microCMS. Blog posts are loaded from microCMS at build time and rendered as static HTML. The contact form sends mail through a Vercel Function with nodemailer and Gmail.

Demo: https://astrobase.vercel.app/

## Tech stack

- [Astro](https://astro.build/) 7 (static output)
  - **Content Layer**: loads microCMS posts into a `blogs` content collection at build time and validates them with a zod schema
  - **`astro:assets`**: converts microCMS eyecatch images and local images to WebP and outputs them with `srcset`
  - **ClientRouter (View Transitions)**: switches pages without a full reload and animates each blog card image into the article's eyecatch
  - **`astro:env`**: typed, validated environment variables
  - **Fonts API**: downloads Montserrat and JetBrains Mono at build time and serves them from the site itself
  - **Prefetch**: starts loading the next page when a link is hovered
- [microCMS](https://microcms.io/) (`microcms-js-sdk`)
- Sass (SCSS)
- [GSAP](https://gsap.com/) 3 + ScrollTrigger, installed from npm and loaded only on the top page
- Plain JavaScript modules in `src/scripts/`, with no UI framework
- Vercel Functions (`api/contact.ts`) + nodemailer
- Google reCAPTCHA v3 (optional)
- Node.js 24.x

## Project structure

```
/
├── api/
│   └── contact.ts             # Contact form endpoint (Vercel Function)
├── public/
│   └── img/                   # Images referenced from CSS (hero background, etc.)
├── src/
│   ├── assets/img/            # Images optimized with <Image />
│   ├── components/
│   │   ├── BlogCard.astro     # Blog card
│   │   ├── SiteHeader.astro   # Header for sub pages
│   │   └── SiteFooter.astro   # Footer for sub pages
│   ├── content.config.ts      # Content collection that loads posts from microCMS
│   ├── layouts/
│   │   └── LayoutHome.astro   # Shared layout (head, fonts, ClientRouter, scripts)
│   ├── lib/
│   │   ├── microcms.ts        # microCMS client and fetch
│   │   └── posts.ts           # Reads posts from the collection, newest first
│   ├── pages/
│   │   ├── index.astro        # Top page
│   │   ├── articles/
│   │   │   ├── index.astro    # Blog list
│   │   │   └── [slug].astro   # Article page
│   │   ├── thanks.astro       # Shown after the form is sent
│   │   └── error.astro        # Shown when sending fails
│   ├── scripts/
│   │   ├── lifecycle.js       # Per-page setup and cleanup for the ClientRouter
│   │   ├── layout.js          # Header, mobile menu, back to top (all pages)
│   │   ├── home.js            # Top page animations, terminal and contact form
│   │   └── article.js         # Reading progress bar and table of contents
│   ├── styles/scss/           # See "Styles" below
│   └── types/
│       └── article.ts         # microCMS API response types
├── astro.config.mjs
└── package.json
```

## How it works

### Blog posts

`src/content.config.ts` defines a `blogs` collection whose loader calls `getArticles()` in `src/lib/microcms.ts`. Pages read posts through `getPosts()` in `src/lib/posts.ts`, which keeps microCMS's newest-first order. Each post is generated at `/articles/{content ID}` with links to the older and newer posts.

### Images

The top page imports its images from `src/assets/img/`, and the eyecatch images come from microCMS (`images.microcms-assets.io` is allowed in `image.domains`). All of them are rendered with `<Image />`, so they are resized and converted to WebP at build time.

### Page transitions and scripts

`<ClientRouter />` in `LayoutHome.astro` swaps pages in place instead of reloading. Scripts are bundled once and do not run again on navigation, so each script registers its setup with `onPage()` from `src/scripts/lifecycle.js`:

- Setup runs on `astro:page-load`, which fires on the first visit and after every navigation.
- Event listeners registered with the given `signal`, GSAP animations (reverted with `gsap.context`), timers and observers are cleaned up on `astro:before-swap`.

The counting loader on the top page appears only on the first visit. When you come back from another page, the hero intro starts right away.

### Contact form

`src/scripts/home.js` validates the fields as you type (required fields and email format). On submit it gets a reCAPTCHA token if a site key is set, then POSTs JSON to `/api/contact`. The reCAPTCHA script is loaded only when the form is sent.

`api/contact.ts` checks the required fields and email format again on the server. If `RECAPTCHA_SECRET_KEY` is set, it also requires a reCAPTCHA score of 0.5 or higher. It then sends the message with nodemailer. Depending on the response, the page moves to `/thanks` or `/error`.

## Styles

`src/styles/scss/style.scss` is the entry point, and every page imports only this file.

| Directory | Contents |
| :--- | :--- |
| `abstracts/` | Variables (colors, fonts, breakpoints) and mixins such as `mq()` |
| `base/` | Reset, CSS custom properties on `:root`, keyframes, scroll reveal and reduced motion |
| `components/` | Shared parts (section labels, buttons), cursor, loader |
| `layout/` | Header and footer |
| `sections/` | Sections of the top page |
| `pages/` | Blog list, article page, thanks / error |

Colors are Sass variables (`$yellow`, etc.). The same values are also output as CSS custom properties (`--yellow`, etc.) so that JavaScript can read them. Write media queries as `@include mq(md)`. The font families come from the Fonts API (`--font-montserrat`, `--font-jetbrains-mono`).

## microCMS setup

Create a list-type API with the endpoint `blogs`.

| Field ID | Type | Notes |
| :--- | :--- | :--- |
| `title` | Text field | Post title |
| `content` | Rich editor | Body |
| `eyecatch` | Image | Thumbnail and article header image |
| `category` | Content reference | The referenced API needs a `name` field |

## Environment variables

Copy `.env.example` to `.env` and fill in the values.

```bash
cp .env.example .env
```

| Variable | Required | Description |
| :--- | :---: | :--- |
| `MICROCMS_SERVICE_DOMAIN` | ✓ | microCMS service domain (`xxx` in `xxx.microcms.io`) |
| `MICROCMS_API_KEY` | ✓ | microCMS API key |
| `CONTACT_TO_EMAIL` | ✓ | Address that receives contact messages |
| `SMTP_USER` | ✓ | Gmail address used to send |
| `SMTP_PASS` | ✓ | Gmail app password |
| `SMTP_HOST` | | Defaults to `smtp.gmail.com` |
| `SMTP_PORT` | | Defaults to `465` |
| `PUBLIC_RECAPTCHA_SITE_KEY` | | reCAPTCHA v3 site key. The form uses reCAPTCHA only when this is set |
| `RECAPTCHA_SECRET_KEY` | | reCAPTCHA v3 secret key. The server verifies the token only when this is set |

`MICROCMS_*` and `PUBLIC_RECAPTCHA_SITE_KEY` are defined in `env.schema` in `astro.config.mjs` and imported from `astro:env/server` / `astro:env/client`. The build fails if `MICROCMS_*` is missing. The SMTP and reCAPTCHA secret variables are read only by `api/contact.ts`, through `process.env`.

## Commands

| Command | Action |
| :--- | :--- |
| `npm install` | Install dependencies |
| `npm run dev` | Start the dev server at `localhost:4321` |
| `npm run build` | Build the site to `./dist/` |
| `npm run preview` | Preview the build locally |

`api/contact.ts` is a Vercel Function, but a small dev-only integration in `astro.config.mjs` serves it during `npm run dev` as well, using the values in `.env`.

## Deployment

The site is deployed to Vercel. `engines` in `package.json` pins Node.js 24.x. Set the same environment variables in the Vercel project. Variables used at build time (`MICROCMS_*`, `PUBLIC_RECAPTCHA_SITE_KEY`) take effect only after a redeploy.

Because the site is static, new or updated posts appear only after a rebuild. To rebuild automatically, create a Deploy Hook in the Vercel project (Settings → Git → Deploy Hooks) and register its URL as a webhook in microCMS. Keep the Deploy Hook URL private, because anyone with the URL can trigger a deploy.
