/* Top page: GSAP animations, build-log terminal and the contact form. */
import { navigate } from 'astro:transitions/client';
import { PUBLIC_RECAPTCHA_SITE_KEY as RECAPTCHA_SITE_KEY } from 'astro:env/client';
import { onPage, $, $$, prefersReducedMotion } from './lifecycle.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

onPage(async ({ signal, initial }) => {
  if (!$('.hero')) return;

  const reduce = prefersReducedMotion();
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- clock ---------- */
  const clock = $('#clock');
  const tick = () => { clock.textContent = new Date().toLocaleTimeString('en-GB'); };
  tick();
  const timer = setInterval(tick, 1000);
  signal.addEventListener('abort', () => clearInterval(timer));

  /* ---------- skill card spotlight ---------- */
  $$('.skill').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { signal });
    card.addEventListener('click', () => card.classList.toggle('is-active'), { signal });
  });

  setupContactForm(signal);

  /* ---------- no-animation fallback ---------- */
  if (reduce) {
    $('.loader')?.remove();
    $$('.catch-svg path').forEach(p => { p.style.fill = '#ffe300'; });
    $$('.hero-eyebrow, .hero-sub, .scroll-ind, .hero-meta, .skills-logo li').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
    $$('.prof-img').forEach(el => { el.style.clipPath = 'none'; });
    $$('[data-r]').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
    runTerminal(null, signal);
    if (!initial) scrollToHash();
    return;
  }

  // GSAP is only downloaded on the top page
  const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
  if (signal.aborted) return;
  gsap.registerPlugin(ScrollTrigger);

  // everything created inside the context (tweens, ScrollTriggers) is reverted on navigation
  const ctx = gsap.context(() => animate(gsap, ScrollTrigger, { signal, initial, fine }));
  if (!initial) {
    ScrollTrigger.refresh();
    scrollToHash();
  }
  // re-measure once fonts / images have loaded
  const refresh = () => { if (!signal.aborted) ScrollTrigger.refresh(); };
  document.fonts.ready.then(refresh);
  if (document.readyState !== 'complete') addEventListener('load', refresh, { once: true, signal });
  return () => ctx.revert();
});

/* Coming from another page with a hash (e.g. "Contact" → /#a04): the router leaves the
   jump to the browser's smooth fragment scroll, which the setup above cuts short.
   Land on the section directly once the page is ready. */
function scrollToHash() {
  const id = decodeURIComponent(location.hash.slice(1));
  const target = id && document.getElementById(id);
  if (target) scrollTo({ top: target.getBoundingClientRect().top + scrollY, behavior: 'instant' });
}

function animate(gsap, ScrollTrigger, { signal, initial, fine }) {
  /* ---------- cursor ---------- */
  if (fine) {
    const c = $('.cursor');
    const xTo = gsap.quickTo(c, 'x', { duration: .35, ease: 'power3' });
    const yTo = gsap.quickTo(c, 'y', { duration: .35, ease: 'power3' });
    addEventListener('mousemove', e => {
      c.classList.add('on'); xTo(e.clientX); yTo(e.clientY);
      c.classList.toggle('big', !!e.target.closest('a, button, .skill, input, textarea'));
    }, { signal });
    document.addEventListener('mouseleave', () => c.classList.remove('on'), { signal });
  }

  /* ---------- split text ---------- */
  $$('.split').forEach(el => {
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    const walk = node => Array.from(node.childNodes).forEach(ch => {
      if (ch.nodeType === 3) {
        const f = document.createDocumentFragment();
        ch.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { f.appendChild(document.createTextNode(' ')); return; }
          const wd = document.createElement('span'); wd.className = 'wd'; wd.setAttribute('aria-hidden', 'true');
          [...part].forEach(c => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = c; wd.appendChild(s); });
          f.appendChild(wd);
        });
        ch.replaceWith(f);
      } else if (ch.nodeType === 1) walk(ch);
    });
    walk(el);
  });

  /* ---------- loader → hero intro ---------- */
  const loader = $('.loader');
  const intro = gsap.timeline({ paused: true });
  const paths = $$('.catch-svg path');
  const heroR = matchMedia('(max-width: 800px)').matches ? '6%' : '22%';
  /* a CSS transition on the icons fights the GSAP tween, so disable it during the intro */
  $$('.skills-logo li').forEach(li => { li.style.transition = 'box-shadow .3s'; });
  paths.forEach(p => { const l = p.getTotalLength(); p.style.strokeDasharray = l; p.style.strokeDashoffset = l; });
  intro
    .fromTo('.hero-bg', { scale: 1.35 }, { scale: 1.15, duration: 2.2, ease: 'expo.out' }, 0)
    .fromTo('.hero', { '--hero-r': '0%' }, { '--hero-r': heroR, duration: 1.6, ease: 'expo.out' }, .1)
    .to('.hero-eyebrow', { opacity: 1, duration: .6 }, .3)
    .to(paths, { strokeDashoffset: 0, duration: 1.3, ease: 'power2.inOut', stagger: { each: .05, from: 'random' } }, .3)
    .to(paths, { fill: 'rgba(255,227,0,1)', strokeWidth: 0, duration: .7, ease: 'power2.out', stagger: .03 }, 1.4)
    .fromTo('.hero-sub', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .9, ease: 'expo.out' }, 1.7)
    .to('.skills-logo li', { opacity: 1, y: 0, duration: .9, ease: 'back.out(2)', stagger: .07 }, 1.8)
    .to('.scroll-ind, .hero-meta', { opacity: 1, duration: .8 }, 2.2)
    .add(() => $$('.skills-logo li').forEach(li => { li.style.transition = ''; }), '>');

  if (initial) {
    // counting loader only on the first visit, not when coming back from another page
    const count = $('.ld-count');
    const counter = { v: 0 };
    gsap.to(counter, {
      v: 100, duration: 1.1, ease: 'power2.inOut',
      onUpdate: () => { count.textContent = Math.round(counter.v); },
      onComplete: () => { loader.classList.add('done'); intro.play(); setTimeout(() => loader.remove(), 1300); }
    });
  } else {
    loader.remove();
    intro.play();
  }

  /* ---------- hero scroll ---------- */
  gsap.fromTo('.hero-bg', { yPercent: 0 }, { yPercent: 18, ease: 'none', immediateRender: false, scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  /* hero curve flattens as you scroll */
  /* --hero-k is a separate scroll factor so it never fights the intro's --hero-r tween;
     fromTo with explicit start values makes scrolling back up always return to the original state */
  const heroST = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
  gsap.fromTo('.hero', { '--hero-k': 1 }, { '--hero-k': 0, ease: 'none', immediateRender: false, scrollTrigger: heroST });
  gsap.fromTo('.hero-inner', { yPercent: 0, opacity: 1 }, { yPercent: 35, opacity: 0, ease: 'none', immediateRender: false, scrollTrigger: heroST });
  if (fine) {
    const bgX = gsap.quickTo('.hero-grid', 'x', { duration: 1.2, ease: 'power3' });
    const bgY = gsap.quickTo('.hero-grid', 'y', { duration: 1.2, ease: 'power3' });
    $('.hero').addEventListener('mousemove', e => {
      bgX((e.clientX / innerWidth - .5) * -30);
      bgY((e.clientY / innerHeight - .5) * -30);
    }, { signal });
  }

  /* ---------- build log typing ---------- */
  runTerminal(ScrollTrigger, signal);
  if (fine) {
    const term = $('.term');
    const rx = gsap.quickTo(term, 'rotationX', { duration: .8, ease: 'power3' });
    const ry = gsap.quickTo(term, 'rotationY', { duration: .8, ease: 'power3' });
    gsap.set(term, { transformPerspective: 1200 });
    term.addEventListener('mousemove', e => {
      const r = term.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - .5) * 8);
      rx(-((e.clientY - r.top) / r.height - .5) * 8);
    }, { signal });
    term.addEventListener('mouseleave', () => { rx(0); ry(0); }, { signal });
  }

  /* ---------- reveal ---------- */
  ScrollTrigger.batch('[data-r]', {
    start: 'top 88%', once: true,
    onEnter: b => gsap.to(b, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: .08, overwrite: true })
  });
  $$('.split').forEach(el => gsap.from($$('.ch', el), {
    yPercent: 110, opacity: 0, duration: 1, ease: 'expo.out', stagger: .02,
    scrollTrigger: { trigger: el, start: 'top 88%', once: true }
  }));

  /* about: 円形に開く写真 */
  gsap.to('.prof-img', { clipPath: 'circle(50% at 50% 50%)', duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: '.prof', start: 'top 80%', once: true } });
  gsap.to('.prof-img img', { scale: 1, ease: 'none', scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* blog: 縦方向にずれるパララックス */
  if (matchMedia('(min-width: 901px)').matches) {
    $$('.blog-card a').forEach((card, i) => gsap.to(card, { y: -(i * 40), ease: 'none', scrollTrigger: { trigger: '.blog', start: 'top bottom', end: 'bottom top', scrub: true } }));
  }

  /* contact: 上辺のカーブが平らになる + 巨大ロゴ */
  gsap.fromTo('.contact', { '--contact-r': '12%' }, { '--contact-r': '0%', ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'top 30%', scrub: true } });
  gsap.from('.contact-logo span', { yPercent: 100, opacity: 0, duration: 1.3, ease: 'expo.out', stagger: .12, scrollTrigger: { trigger: '.contact-logo', start: 'top 92%', once: true } });

  /* nav current */
  ['a01', 'a02', 'a03', 'a04'].forEach(id => {
    const link = $(`.pc-nav a[href="#${id}"]`);
    ScrollTrigger.create({ trigger: '#' + id, start: 'top center', end: 'bottom center', onToggle: s => link && link.classList.toggle('current', s.isActive) });
  });
}

/* ---------- terminal ---------- */
const TERM = [
  { cmd: 'npm run build' },
  { out: '<span class="dim">&gt; astro-base@1.0.0 build</span>' },
  { out: '<span class="dim">&gt; astro build</span>' },
  { out: '' },
  { out: '<span class="ok">▶</span> Syncing content from <span class="hl">microCMS</span>' },
  { out: '<span class="ok">▶</span> Compiling styles: src/styles/scss/style.scss' },
  { out: '<span class="ok">▶</span> Optimizing images with astro:assets' },
  { out: '<span class="ok">▶</span> Rendering src/pages/articles/[slug].astro' },
  { out: '' },
  { out: '<span class="ok">✓</span> Static build complete. Ready to deploy on <span class="hl">Vercel</span>' }
];

/* types the build log when it scrolls into view; without ScrollTrigger it prints it at once */
function runTerminal(ScrollTrigger, signal) {
  const code = $('#termCode');
  const prompt = '<span class="ps">➜</span> <span class="dim">~/astro-base</span> ';
  if (!ScrollTrigger) {
    code.innerHTML = TERM.map(l => l.cmd ? prompt + esc(l.cmd) : l.out).join('\n') + '\n' + prompt;
    return;
  }
  const start = async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    let html = '';
    for (const line of TERM) {
      if (signal.aborted) return;
      if (line.cmd) {
        html += prompt; code.innerHTML = html;
        await wait(350);
        for (const ch of line.cmd) { html += esc(ch); code.innerHTML = html; await wait(55 + Math.random() * 50); }
        await wait(300);
      } else {
        html += line.out;
        code.innerHTML = html;
        await wait(line.out ? 260 + Math.random() * 200 : 80);
      }
      html += '\n';
    }
    html += prompt; code.innerHTML = html;
  };
  ScrollTrigger.create({ trigger: '.term', start: 'top 75%', once: true, onEnter: start });
}

/* ---------- contact form ---------- */
function setupContactForm(signal) {
  const form = $('#contactForm'), status = $('#formStatus');
  const rules = {
    name: v => v ? '' : 'Name is required',
    email: v => !v ? 'Email is required' : (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Please enter a valid email'),
    message: v => v ? '' : 'Message is required'
  };
  const names = Object.keys(rules);
  const check = n => {
    const el = form.elements[n], msg = rules[n](el.value.trim());
    el.closest('.field').classList.toggle('invalid', !!msg);
    el.setAttribute('aria-invalid', String(!!msg));
    $('#error-' + n + '-required').textContent = msg;
    return !msg;
  };
  names.forEach(n => {
    const el = form.elements[n];
    el.addEventListener('blur', () => check(n), { signal });
    el.addEventListener('input', () => { if (el.closest('.field').classList.contains('invalid')) check(n); }, { signal });
  });

  // reCAPTCHA is loaded only when the form is sent
  const loadRecaptcha = () => new Promise((res, rej) => {
    if (window.grecaptcha) return res();
    const s = document.createElement('script');
    s.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}&hl=en`;
    s.onload = () => res(); s.onerror = () => rej(new Error('Failed to load reCAPTCHA'));
    document.head.appendChild(s);
  });
  const getToken = async () => {
    if (!RECAPTCHA_SITE_KEY) return undefined;
    await loadRecaptcha();
    await new Promise(r => grecaptcha.ready(r));
    return grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'submit' });
  };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const ok = names.map(check);
    if (ok.includes(false)) { form.elements[names[ok.indexOf(false)]].focus(); return; }
    const btn = $('.submit', form);
    btn.disabled = true; status.textContent = 'Sending…';
    const data = Object.fromEntries(names.map(n => [n, form.elements[n].value.trim()]));
    try {
      const googleReCaptchaToken = await getToken();
      const res = await fetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify({ ...data, googleReCaptchaToken }),
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
      });
      navigate(res.ok ? '/thanks' : '/error');
    } catch {
      navigate('/error');
    }
  }, { signal });
}
