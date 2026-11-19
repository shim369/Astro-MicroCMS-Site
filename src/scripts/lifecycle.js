/**
 * Page lifecycle for the ClientRouter.
 *
 * `setup(ctx)` runs on every page load — the first visit and each client-side
 * navigation. Listeners registered with `{ signal: ctx.signal }` are removed, and
 * the function `setup` returns is called, right before the next page is swapped in.
 * `ctx.initial` is true only for the first, full page load.
 */
let initial = true;
document.addEventListener('astro:after-swap', () => {
  initial = false;
  // the swap copies <html> attributes from the new page, so restore the "js" flag
  // that the CSS reveal styles (.js [data-r]) depend on
  document.documentElement.classList.add('js');
});

export function onPage(setup) {
  let cleanup = null;

  document.addEventListener('astro:page-load', async () => {
    const ac = new AbortController();
    cleanup = () => ac.abort();
    const extra = await setup({ signal: ac.signal, initial });
    if (typeof extra !== 'function') return;
    // the user may already have navigated away while setup was awaiting
    if (ac.signal.aborted) extra();
    else cleanup = () => { ac.abort(); extra(); };
  });

  document.addEventListener('astro:before-swap', () => {
    if (cleanup) cleanup();
    cleanup = null;
  });
}

export const $ = (s, c = document) => c.querySelector(s);
export const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
export const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
