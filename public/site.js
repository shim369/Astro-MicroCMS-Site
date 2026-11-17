/* Shared behaviour for sub pages (blog list, article): header state, mobile menu, back to top. */
(function () {
  const header = document.getElementById('siteHeader');
  const onScroll = () => header.classList.toggle('scrolled', scrollY > 150);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const spBtn = document.querySelector('.sp-btn'), spNav = document.getElementById('spNav');
  const setMenu = open => {
    spBtn.setAttribute('aria-expanded', String(open));
    spBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    spNav.classList.toggle('open', open);
    spNav.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('menu-open', open);
  };
  spBtn.addEventListener('click', () => setMenu(spBtn.getAttribute('aria-expanded') !== 'true'));
  spNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById('toTop').addEventListener('click', () => scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));

  /* article: reading progress bar + highlight the current TOC entry */
  const progress = document.querySelector('.read-progress span');
  const body = document.querySelector('.post-body');
  if (progress && body) {
    const update = () => {
      const r = body.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight * .6)));
      progress.style.transform = `scaleX(${p})`;
    };
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    update();
  }
  const tocLinks = Array.from(document.querySelectorAll('.post-toc a'));
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const byId = new Map(tocLinks.map(a => [decodeURIComponent(a.hash.slice(1)), a]));
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        tocLinks.forEach(a => a.classList.remove('is-active'));
        byId.get(e.target.id)?.classList.add('is-active');
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    byId.forEach((_, id) => { const h = document.getElementById(id); if (h) io.observe(h); });
  }
})();
