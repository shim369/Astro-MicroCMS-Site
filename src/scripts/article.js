/* Article page: reading progress bar + highlight the current TOC entry. */
import { onPage, $, $$ } from './lifecycle.js';

onPage(({ signal }) => {
  const progress = $('.read-progress span');
  const body = $('.post-body');
  if (!progress || !body) return;

  const update = () => {
    const r = body.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight * .6)));
    progress.style.transform = `scaleX(${p})`;
  };
  addEventListener('scroll', update, { passive: true, signal });
  addEventListener('resize', update, { signal });
  update();

  const tocLinks = $$('.post-toc a');
  if (!tocLinks.length) return;
  const byId = new Map(tocLinks.map(a => [decodeURIComponent(a.hash.slice(1)), a]));
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      tocLinks.forEach(a => a.classList.remove('is-active'));
      byId.get(e.target.id)?.classList.add('is-active');
    });
  }, { rootMargin: '-20% 0px -70% 0px' });
  byId.forEach((_, id) => { const h = document.getElementById(id); if (h) io.observe(h); });
  return () => io.disconnect();
});
