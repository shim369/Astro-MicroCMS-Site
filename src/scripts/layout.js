/* Header state, mobile menu and "back to top" — shared by every page. */
import { onPage, $, $$, prefersReducedMotion } from './lifecycle.js';

onPage(({ signal }) => {
  const header = $('#siteHeader');
  if (!header) return;

  // the top page also hides the header while scrolling down
  const autoHide = !!$('.hero');
  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle('scrolled', y > 150);
    if (autoHide) {
      if (y > innerHeight && y > lastY + 5 && !document.body.classList.contains('menu-open')) header.classList.add('hide');
      else if (y < lastY - 5 || y < innerHeight) header.classList.remove('hide');
    }
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true, signal });
  onScroll();

  const spBtn = $('.sp-btn'), spNav = $('#spNav');
  const setMenu = open => {
    spBtn.setAttribute('aria-expanded', String(open));
    spBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    spNav.classList.toggle('open', open);
    spNav.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('menu-open', open);
  };
  spBtn.addEventListener('click', () => setMenu(spBtn.getAttribute('aria-expanded') !== 'true'), { signal });
  $$('a', spNav).forEach(a => a.addEventListener('click', () => setMenu(false), { signal }));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); }, { signal });

  $('#toTop').addEventListener('click', () => scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' }), { signal });

  return () => document.body.classList.remove('menu-open');
});
