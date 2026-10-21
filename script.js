// ---------- Nav scroll state ----------
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// ---------- Mobile menu ----------
const navToggle = document.getElementById('navToggle');
navToggle.addEventListener('click', () => nav.classList.toggle('open'));
document.querySelectorAll('.nav-links a').forEach((a) =>
  a.addEventListener('click', () => nav.classList.remove('open'))
);

// ---------- Cursor glow ----------
const glow = document.getElementById('cursorGlow');
if (window.matchMedia('(hover: hover)').matches) {
  let gx = window.innerWidth / 2, gy = window.innerHeight / 2;
  let cx = gx, cy = gy;
  window.addEventListener('mousemove', (e) => { gx = e.clientX; gy = e.clientY; glow.style.opacity = '1'; });
  (function loop() {
    cx += (gx - cx) * 0.12;
    cy += (gy - cy) * 0.12;
    glow.style.left = cx + 'px';
    glow.style.top = cy + 'px';
    requestAnimationFrame(loop);
  })();
}

// ---------- Card spotlight ----------
document.querySelectorAll('.card, .skill-card, .edu-card').forEach((el) => {
  el.addEventListener('mousemove', (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
    el.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
  });
});

// ---------- Reveal on scroll ----------
const revealer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('in'), i * 70);
        revealer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
);
document.querySelectorAll('.reveal').forEach((el) => revealer.observe(el));

// ---------- Animated counters ----------
const counters = document.querySelectorAll('.stat-num');
const countObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = +el.dataset.count;
      const dur = 1400;
      const start = performance.now();
      (function tick(now) {
        const p = Math.min((now - start) / dur, 1);
        el.textContent = Math.floor((1 - Math.pow(1 - p, 3)) * target);
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = target;
      })(start);
      countObserver.unobserve(el);
    });
  },
  { threshold: 0.5 }
);
counters.forEach((c) => countObserver.observe(c));

// ---------- Role rotator ----------
const roles = ['React', 'Node.js', 'Python', 'Next.js', 'NestJS'];
const rotator = document.getElementById('rotator');
let ri = 0, ci = 0, deleting = false;
(function type() {
  const word = roles[ri];
  rotator.textContent = word.slice(0, ci);
  if (!deleting && ci < word.length) { ci++; setTimeout(type, 90); }
  else if (!deleting && ci === word.length) { deleting = true; setTimeout(type, 1400); }
  else if (deleting && ci > 0) { ci--; setTimeout(type, 45); }
  else { deleting = false; ri = (ri + 1) % roles.length; setTimeout(type, 300); }
})();

// ---------- Work: tabs + galleries + lightbox ----------
const galleryCtl = new Map();
const AUTOPLAY_MS = 4200;

document.querySelectorAll('.gallery').forEach((gallery) => {
  const track = gallery.querySelector('.gallery-track');
  const imgs = Array.from(track.children);
  const dotsWrap = gallery.querySelector('.gallery-dots');
  const prevBtn = gallery.querySelector('.gallery-nav.prev');
  const nextBtn = gallery.querySelector('.gallery-nav.next');
  const expandBtn = gallery.querySelector('.gallery-expand');
  const card = gallery.closest('[data-work]');
  const title = card ? card.querySelector('.work-top h3').textContent.trim() : 'Screenshot';

  const state = { index: 0, enabled: false, timer: null, startX: null, dragged: false };
  const dots = [];

  imgs.forEach((img, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'gdot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Go to screenshot ${i + 1}`);
    dot.addEventListener('click', (e) => { e.stopPropagation(); go(i); restart(); });
    if (dotsWrap) dotsWrap.appendChild(dot);
    dots.push(dot);
  });

  if (imgs.length < 2) {
    if (prevBtn) prevBtn.hidden = true;
    if (nextBtn) nextBtn.hidden = true;
    if (dotsWrap) dotsWrap.hidden = true;
  }

  function paint() {
    track.style.transform = `translateX(-${state.index * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === state.index));
    if (imgs[state.index]) gallery.style.setProperty('--bg', `url("${imgs[state.index].src}")`);
  }
  function go(i) {
    state.index = (i + imgs.length) % imgs.length;
    paint();
  }
  function next() { go(state.index + 1); paintDots(); }
  function prev() { go(state.index - 1); paintDots(); }
  function paintDots() { dots.forEach((d, i) => d.classList.toggle('active', i === state.index)); }
  function start() {
    stop();
    if (state.enabled && imgs.length > 1) state.timer = setInterval(next, AUTOPLAY_MS);
  }
  function stop() { if (state.timer) clearInterval(state.timer); state.timer = null; }
  function restart() { start(); }
  function setEnabled(v) { state.enabled = v; v ? start() : stop(); }
  function openAt(i) {
    openLightbox(imgs.map((im) => ({ src: im.src, alt: im.alt })), i, title);
  }

  if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); prev(); restart(); });
  if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); next(); restart(); });
  if (expandBtn) expandBtn.addEventListener('click', (e) => { e.stopPropagation(); openAt(state.index); });

  imgs.forEach((img, i) => {
    img.addEventListener('click', () => { if (state.dragged) { state.dragged = false; return; } openAt(i); });
  });

  gallery.addEventListener('mouseenter', stop);
  gallery.addEventListener('mouseleave', start);

  // swipe / drag
  gallery.addEventListener('pointerdown', (e) => { state.startX = e.clientX; state.dragged = false; });
  gallery.addEventListener('pointermove', (e) => {
    if (state.startX !== null && Math.abs(e.clientX - state.startX) > 12) state.dragged = true;
  });
  gallery.addEventListener('pointerup', (e) => {
    if (state.startX === null) return;
    const dx = e.clientX - state.startX;
    state.startX = null;
    if (Math.abs(dx) > 42) {
      if (dx < 0) next(); else prev();
      restart();
    }
  });
  gallery.addEventListener('pointercancel', () => { state.startX = null; });

  // keyboard support when gallery focused
  gallery.setAttribute('tabindex', '0');
  gallery.addEventListener('keydown', (e) => {
    if (lb.classList.contains('open')) return;
    if (e.key === 'ArrowRight') { next(); restart(); }
    if (e.key === 'ArrowLeft') { prev(); restart(); }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openAt(state.index); }
  });

  paint();
  galleryCtl.set(gallery, { setEnabled });
});

// tab switching + active-gallery autoplay
document.querySelectorAll('[data-work]').forEach((card) => {
  const tabs = card.querySelectorAll('.work-tab');
  const views = card.querySelectorAll('.work-view');
  const label = card.querySelector('.work-url');

  const sync = () => {
    card.querySelectorAll('.gallery').forEach((g) => {
      const ctl = galleryCtl.get(g);
      const inActive = g.closest('.work-view').classList.contains('active');
      if (ctl) ctl.setEnabled(inActive);
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const view = tab.dataset.view;
      tabs.forEach((t) => t.classList.toggle('active', t === tab));
      views.forEach((v) => v.classList.toggle('active', v.dataset.view === view));
      if (label && label.dataset[view]) label.textContent = label.dataset[view];
      sync();
    });
  });

  sync();
});

// ---------- Lightbox ----------
const lb = document.getElementById('lightbox');
const lbImg = document.getElementById('lbImg');
const lbCaption = document.getElementById('lbCaption');
const lbDots = document.getElementById('lbDots');
const lbPrev = document.getElementById('lbPrev');
const lbNext = document.getElementById('lbNext');
const lbClose = document.getElementById('lbClose');
let lbItems = [], lbIndex = 0, lbTitle = '';

function renderLightbox() {
  const item = lbItems[lbIndex];
  if (!item) return;
  lbImg.src = item.src;
  lbImg.alt = item.alt || 'Expanded screenshot';
  lbCaption.textContent = lbItems.length > 1
    ? `${lbTitle} — ${lbIndex + 1} / ${lbItems.length}`
    : lbTitle;

  lbDots.innerHTML = '';
  if (lbItems.length > 1) {
    lbItems.forEach((_, i) => {
      const d = document.createElement('button');
      d.type = 'button';
      d.className = 'gdot' + (i === lbIndex ? ' active' : '');
      d.setAttribute('aria-label', `Screenshot ${i + 1}`);
      d.addEventListener('click', (e) => { e.stopPropagation(); lbIndex = i; renderLightbox(); });
      lbDots.appendChild(d);
    });
    lbPrev.hidden = false;
    lbNext.hidden = false;
  } else {
    lbPrev.hidden = true;
    lbNext.hidden = true;
  }
}

function openLightbox(items, index, title) {
  lbItems = items;
  lbIndex = index;
  lbTitle = title;
  renderLightbox();
  lb.classList.add('open');
  lb.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lb.classList.remove('open');
  lb.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function lbStep(dir) {
  if (lbItems.length < 2) return;
  lbIndex = (lbIndex + dir + lbItems.length) % lbItems.length;
  renderLightbox();
}

lbClose.addEventListener('click', closeLightbox);
lbPrev.addEventListener('click', (e) => { e.stopPropagation(); lbStep(-1); });
lbNext.addEventListener('click', (e) => { e.stopPropagation(); lbStep(1); });
lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
document.addEventListener('keydown', (e) => {
  if (!lb.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') lbStep(1);
  if (e.key === 'ArrowLeft') lbStep(-1);
});
