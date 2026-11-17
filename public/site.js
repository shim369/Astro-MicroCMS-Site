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
})();
