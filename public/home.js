(function () {
  /* reCAPTCHA v3 site key (PUBLIC_RECAPTCHA_SITE_KEY). Empty = send without a token */
  const RECAPTCHA_SITE_KEY = window.RECAPTCHA_SITE_KEY || '';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = typeof gsap !== 'undefined';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- clock ---------- */
  const clock = $('#clock');
  const tick = () => { clock.textContent = new Date().toLocaleTimeString('en-GB'); };
  tick(); setInterval(tick, 1000);

  /* ---------- header ---------- */
  const header = $('#siteHeader');
  let lastY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    header.classList.toggle('scrolled', y > 150);
    if (y > innerHeight && y > lastY + 5 && !document.body.classList.contains('menu-open')) header.classList.add('hide');
    else if (y < lastY - 5 || y < innerHeight) header.classList.remove('hide');
    lastY = y;
  }, { passive: true });

  const spBtn = $('.sp-btn'), spNav = $('#spNav');
  const setMenu = open => {
    spBtn.setAttribute('aria-expanded', String(open));
    spBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    spNav.classList.toggle('open', open);
    spNav.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('menu-open', open);
  };
  spBtn.addEventListener('click', () => setMenu(spBtn.getAttribute('aria-expanded') !== 'true'));
  $$('a', spNav).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  $('#toTop').addEventListener('click', () => scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));

  /* ---------- cursor ---------- */
  if (fine && !reduce && hasGsap) {
    const c = $('.cursor');
    const xTo = gsap.quickTo(c, 'x', { duration: .35, ease: 'power3' });
    const yTo = gsap.quickTo(c, 'y', { duration: .35, ease: 'power3' });
    addEventListener('mousemove', e => {
      c.classList.add('on'); xTo(e.clientX); yTo(e.clientY);
      c.classList.toggle('big', !!e.target.closest('a, button, .skill, input, textarea'));
    });
    document.addEventListener('mouseleave', () => c.classList.remove('on'));
  }

  /* ---------- skill card spotlight ---------- */
  $$('.skill').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
    card.addEventListener('click', () => card.classList.toggle('is-active'));
  });

  /* ---------- contact form (元のContactForm.tsxと同じ検証・送信) ---------- */
  const form = $('#contactForm'), status = $('#formStatus');
  const rules = {
    name: v => v ? '' : 'Name is required',
    email: v => !v ? 'Email is required' : (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Please enter a valid email'),
    message: v => v ? '' : 'Message is required'
  };
  const check = n => {
    const el = form.elements[n], msg = rules[n](el.value.trim());
    el.closest('.field').classList.toggle('invalid', !!msg);
    el.setAttribute('aria-invalid', String(!!msg));
    $('#error-' + n + '-required').textContent = msg;
    return !msg;
  };
  Object.keys(rules).forEach(n => form.elements[n].addEventListener('input', () => {
    if (form.elements[n].closest('.field').classList.contains('invalid')) check(n);
  }));
  Object.keys(rules).forEach(n => form.elements[n].addEventListener('blur', () => check(n)));
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
    const names = Object.keys(rules), ok = names.map(check);
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
      location.href = res.ok ? '/thanks' : '/error';
    } catch (err) {
      location.href = '/error';
    }
  });

  /* ---------- terminal ---------- */
  const TERM = [
    { cmd: 'npm run build' },
    { out: '<span class="dim">&gt; astro-base@1.0.0 build</span>' },
    { out: '<span class="dim">&gt; astro build</span>' },
    { out: '' },
    { out: '<span class="ok">▶</span> Fetching articles from <span class="hl">microCMS</span>' },
    { out: '<span class="ok">▶</span> Rendering src/pages/index.astro' },
    { out: '<span class="ok">▶</span> Rendering src/pages/articles/[slug].astro' },
    { out: '<span class="ok">▶</span> Hydrating island: ContactForm.tsx' },
    { out: '' },
    { out: '<span class="ok">✓</span> Static build complete. Ready to deploy on <span class="hl">Vercel</span>' }
  ];
  function runTerminal(animate) {
    const code = $('#termCode');
    const prompt = '<span class="ps">➜</span> <span class="dim">~/astro-base</span> ';
    if (!animate) {
      code.innerHTML = TERM.map(l => l.cmd ? prompt + esc(l.cmd) : l.out).join('\n') + '\n' + prompt;
      return;
    }
    let started = false;
    const start = async () => {
      if (started) return; started = true;
      const wait = ms => new Promise(r => setTimeout(r, ms));
      let html = '';
      for (const line of TERM) {
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

  /* ---------- no-animation fallback ---------- */
  const loader = $('.loader');
  if (!hasGsap || reduce) {
    loader.remove();
    $$('.catch-svg path').forEach(p => { p.style.fill = '#ffe300'; });
    $$('.hero-eyebrow, .hero-sub, .scroll-ind, .hero-meta, .skills-logo li').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
    $$('.prof-img').forEach(el => { el.style.clipPath = 'none'; });
    $$('[data-r]').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
    runTerminal(false);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

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
  const count = $('.ld-count');
  const counter = { v: 0 };
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

  gsap.to(counter, {
    v: 100, duration: 1.1, ease: 'power2.inOut',
    onUpdate: () => { count.textContent = Math.round(counter.v); },
    onComplete: () => { loader.classList.add('done'); intro.play(); setTimeout(() => loader.remove(), 1300); }
  });

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
    });
  }

  /* ---------- build log typing ---------- */
  runTerminal(true);
  if (fine) {
    const term = $('.term');
    const rx = gsap.quickTo(term, 'rotationX', { duration: .8, ease: 'power3' });
    const ry = gsap.quickTo(term, 'rotationY', { duration: .8, ease: 'power3' });
    gsap.set(term, { transformPerspective: 1200 });
    term.addEventListener('mousemove', e => {
      const r = term.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - .5) * 8);
      rx(-((e.clientY - r.top) / r.height - .5) * 8);
    });
    term.addEventListener('mouseleave', () => { rx(0); ry(0); });
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

  addEventListener('load', () => ScrollTrigger.refresh());
})();
