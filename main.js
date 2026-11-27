/* Zouk Family 2027 · the bits that move */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const root = document.documentElement;

  /* ---------- 1. grow a palm frond (shared SVG symbol) ---------- */
  (function palm() {
    const NS = 'http://www.w3.org/2000/svg';
    const sym = document.createElementNS(NS, 'symbol');
    sym.id = 'leaf-palm';
    sym.setAttribute('viewBox', '0 0 420 300');
    // rachis: a gentle arc from the stem (left) to the tip (right)
    const P0 = [6, 190], P1 = [170, 60], P2 = [412, 96];
    const pt = t => [
      (1 - t) ** 2 * P0[0] + 2 * (1 - t) * t * P1[0] + t ** 2 * P2[0],
      (1 - t) ** 2 * P0[1] + 2 * (1 - t) * t * P1[1] + t ** 2 * P2[1],
    ];
    const tan = t => [
      2 * (1 - t) * (P1[0] - P0[0]) + 2 * t * (P2[0] - P1[0]),
      2 * (1 - t) * (P1[1] - P0[1]) + 2 * t * (P2[1] - P1[1]),
    ];
    let d1 = '', d2 = '';
    const N = 19;
    for (let i = 1; i <= N; i++) {
      const t = 0.08 + (i / N) * 0.9;
      const [x, y] = pt(t);
      const [tx, ty] = tan(t);
      const base = Math.atan2(ty, tx);
      const len = 34 + 96 * Math.sin(Math.PI * Math.pow(t, 0.75));
      const w = 5 + len * 0.085;
      for (const side of [-1, 1]) {
        const spread = (1.12 - t * 0.62) * side;
        const a = base + spread;
        const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len + len * 0.1; // tips droop a little
        const mx = (x + ex) / 2, my = (y + ey) / 2;
        const nx = -Math.sin(a) * w, ny = Math.cos(a) * w;
        const seg = `M${x.toFixed(1)} ${y.toFixed(1)}Q${(mx + nx).toFixed(1)} ${(my + ny).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}Q${(mx - nx).toFixed(1)} ${(my - ny).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}Z`;
        if (side < 0) d1 += seg; else d2 += seg;
      }
    }
    sym.innerHTML =
      `<path fill="var(--l2,#0f8a4a)" d="${d2}"/><path fill="var(--l1,#19a35a)" d="${d1}"/>` +
      `<path fill="none" stroke="var(--l3,#c4ec56)" stroke-width="4" stroke-linecap="round" opacity=".7" d="M${P0[0]} ${P0[1]}Q${P1[0]} ${P1[1]} ${P2[0]} ${P2[1]}"/>`;
    $('.sprite defs').appendChild(sym);
  })();

  /* ---------- 2. the jungle parts (intro) ---------- */
  const start = () => {
    document.body.classList.add('loaded');
    setTimeout(() => document.body.classList.add('revealed'), reduced ? 0 : 650);
    setTimeout(() => document.body.classList.add('curtain-gone'), 1900);
  };
  if (reduced) start();
  else {
    const minWait = new Promise(r => setTimeout(r, 900));
    const fonts = document.fonts ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1800))]) : Promise.resolve();
    Promise.all([minWait, fonts]).then(start);
  }

  /* ---------- 3. scroll engine: hero portal, progress vine, parallax, mission ---------- */
  const hero = $('#hero');
  const nav = $('#nav');
  const waFloat = $('.wa-float');
  const mbar = $('.mbar');
  const parallax = $$('[data-parallax]');
  const mission = $('#missionQuote');
  const steps = $('#steps');

  // split the mission into words that light up as you read
  if (mission) {
    const glow = ['magical', 'grow', 'expand', 'beautiful', 'deep', 'connections', 'amazing'];
    mission.innerHTML = mission.textContent.trim().split(/\s+/).map(w => {
      const bare = w.toLowerCase().replace(/[^a-z]/g, '');
      return `<span class="w${glow.includes(bare) ? ' hl' : ''}">${w}</span>`;
    }).join(' ');
  }
  const words = mission ? $$('.w', mission) : [];

  // the apply vine: drawn to the real height of the steps list
  let vineLen = 0;
  const vinePath = $('#vinePath');
  const buildVine = () => {
    if (!steps || !vinePath) return;
    const h = steps.offsetHeight - 60;
    const svg = vinePath.ownerSVGElement;
    svg.setAttribute('viewBox', `0 0 40 ${h}`);
    svg.removeAttribute('preserveAspectRatio');
    svg.style.height = h + 'px';
    let d = 'M20 0';
    const n = Math.max(3, Math.round(h / 110));
    for (let i = 0; i < n; i++) {
      const y0 = (h / n) * i, y1 = (h / n) * (i + 1), dir = i % 2 ? -1 : 1;
      d += `C${20 + 16 * dir} ${y0 + (y1 - y0) * 0.33} ${20 + 16 * dir} ${y0 + (y1 - y0) * 0.66} 20 ${y1}`;
    }
    vinePath.setAttribute('d', d);
    vineLen = vinePath.getTotalLength();
    vinePath.style.strokeDasharray = vineLen;
  };

  let lastY = scrollY, ticking = false, vh = innerHeight;
  const onScroll = () => {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - vh;
    root.style.setProperty('--sp', clamp(y / max).toFixed(4));

    // hero portal
    if (hero) {
      const span = hero.offsetHeight - vh;
      const raw = clamp(y / span);
      const eased = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2;
      const p = reduced ? 0 : clamp(eased * 1.12);
      hero.style.setProperty('--p', p.toFixed(4));
      hero.classList.toggle('is-inside', p > 0.3);
    }

    // nav hides on the way down, returns on the way up
    const heroEnd = hero ? hero.offsetHeight - vh * 0.5 : 400;
    if (!document.body.classList.contains('menu-open')) {
      nav.classList.toggle('is-hidden', y > 300 && y > lastY + 2 && y < max - 10);
      if (y < lastY - 2 || y < 300) nav.classList.remove('is-hidden');
    }
    waFloat.classList.toggle('show', y > heroEnd);
    mbar.classList.toggle('show', y > heroEnd && y < max - 500);
    lastY = y;

    if (!reduced) {
      for (const el of parallax) {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;
        el.style.setProperty('--py', ((r.top - vh / 2) * -parseFloat(el.dataset.parallax)).toFixed(1) + 'px');
      }
      if (mission) {
        const r = mission.getBoundingClientRect();
        const prog = clamp((vh * 0.86 - r.top) / (r.height + vh * 0.36));
        const upto = Math.round(prog * words.length * 1.05);
        words.forEach((w, i) => w.classList.toggle('on', i < upto));
      }
      if (steps && vineLen) {
        const r = steps.getBoundingClientRect();
        const prog = clamp((vh * 0.7 - r.top) / r.height);
        vinePath.style.strokeDashoffset = (vineLen * (1 - prog)).toFixed(1);
      }
    }
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', () => { vh = innerHeight; buildVine(); onScroll(); });
  addEventListener('load', () => { buildVine(); onScroll(); });
  buildVine(); onScroll();

  /* ---------- 4. hero: glow follows the pointer, leaves lean away ---------- */
  const stage = $('.hero__stage');
  if (stage && !reduced && matchMedia('(pointer: fine)').matches) {
    const leaves = $$('.hl', stage);
    stage.addEventListener('pointermove', e => {
      const x = e.clientX / innerWidth, y = e.clientY / innerHeight;
      stage.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
      stage.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      leaves.forEach((l, i) => {
        const depth = (i % 3 + 1) * 7;
        l.style.setProperty('--px', ((x - 0.5) * -depth).toFixed(1) + 'px');
        l.style.setProperty('--py2', ((y - 0.5) * -depth).toFixed(1) + 'px');
      });
    });
  }

  /* ---------- 5. reveal on scroll (with a gentle stagger between siblings) ---------- */
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver(entries => {
      const batch = entries.filter(e => e.isIntersecting).map(e => e.target);
      batch.forEach((el, i) => {
        el.style.setProperty('--rd', Math.min(i * 0.08, 0.5) + 's');
        el.classList.add('in');
        io.unobserve(el);
        setTimeout(() => el.style.removeProperty('--rd'), 1600);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(el => io.observe(el));
  } else revealEls.forEach(el => el.classList.add('in'));

  /* ---------- 6. living video loops: load & play only while on screen ---------- */
  const loops = $$('video.loop');
  if ('IntersectionObserver' in window) {
    const vio = new IntersectionObserver(entries => {
      entries.forEach(e => {
        const v = e.target;
        if (e.isIntersecting) {
          if (!v.src && !reduced) v.src = v.dataset.src;
          if (!reduced) v.play().catch(() => {});
        } else if (!v.paused) v.pause();
      });
    }, { rootMargin: '200px 0px', threshold: 0.01 });
    loops.forEach(v => vio.observe(v));
    const hv = $('#heroVideo');
    if (hv) {
      if (reduced) { hv.removeAttribute('autoplay'); hv.pause(); }
      else new IntersectionObserver(([e]) => { e.isIntersecting ? hv.play().catch(() => {}) : hv.pause(); }, { threshold: 0.01 }).observe(hv);
    }
  }

  /* ---------- 7. video player ---------- */
  const vmodal = $('#vmodal');
  const vplayer = $('video', vmodal);
  const vtitle = $('.vmodal__title', vmodal);
  const openVideo = btn => {
    vplayer.poster = btn.dataset.poster || '';
    vplayer.src = btn.dataset.video;
    vtitle.textContent = btn.dataset.title || '';
    vmodal.showModal();
    vplayer.play().catch(() => {});
  };
  const closeVideo = () => { vplayer.pause(); vplayer.removeAttribute('src'); vplayer.load(); };
  $$('[data-video]').forEach(b => b.addEventListener('click', () => openVideo(b)));
  vmodal.addEventListener('close', closeVideo);
  $$('dialog').forEach(d => {
    d.addEventListener('click', e => { if (e.target === d) d.close(); });
    $('.modal__close', d).addEventListener('click', () => d.close());
  });

  /* ---------- 8. gallery: drag, drift, lightbox ---------- */
  const track = $('.gallery__track');
  if (track) {
    let down = false, sx = 0, sl = 0, moved = 0, touched = false;
    track.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse') { touched = true; return; }
      down = true; moved = 0; sx = e.clientX; sl = track.scrollLeft; touched = true;
    });
    addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx));
      if (moved > 4) track.classList.add('dragging');
      track.scrollLeft = sl - dx;
    });
    addEventListener('pointerup', () => { down = false; setTimeout(() => track.classList.remove('dragging'), 0); });
    track.addEventListener('wheel', () => { touched = true; }, { passive: true });
    track.addEventListener('touchstart', () => { touched = true; }, { passive: true });

    // a slow drift until someone takes over
    if (!reduced) {
      let visible = false;
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.2 }).observe(track);
      const drift = () => {
        if (visible && !touched && !track.matches(':hover')) track.scrollLeft += 0.5;
        if (!touched) requestAnimationFrame(drift);
      };
      requestAnimationFrame(drift);
    }

    const shots = $$('.shot', track);
    const lb = $('#lightbox'), lbImg = $('img', lb), lbCap = $('figcaption', lb);
    let idx = 0;
    const show = i => {
      idx = (i + shots.length) % shots.length;
      const s = shots[idx];
      lbImg.src = s.dataset.full; lbImg.alt = $('img', s).alt; lbCap.textContent = $('span', s).textContent;
    };
    shots.forEach((s, i) => s.addEventListener('click', () => { if (moved > 6) return; show(i); lb.showModal(); }));
    $('.lightbox__nav--prev', lb).addEventListener('click', () => show(idx - 1));
    $('.lightbox__nav--next', lb).addEventListener('click', () => show(idx + 1));
    lb.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') show(idx - 1); if (e.key === 'ArrowRight') show(idx + 1); });
  }

  /* ---------- 9. little joys ---------- */
  // cards lean toward the pointer
  if (!reduced && matchMedia('(pointer: fine)').matches) {
    $$('.act').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--ry', (((e.clientX - r.left) / r.width - 0.5) * 12).toFixed(1) + 'deg');
        card.style.setProperty('--rx', (((e.clientY - r.top) / r.height - 0.5) * -12).toFixed(1) + 'deg');
      });
      card.addEventListener('pointerleave', () => { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
    });
  }
  // a puff of leaves when you say yes
  const bits = ['🌿', '🍃', '🌺', '💚', '🌴', '✨'];
  $$('[data-burst]').forEach(b => b.addEventListener('click', e => {
    if (reduced) return;
    for (let i = 0; i < 14; i++) {
      const s = document.createElement('span');
      s.className = 'burst'; s.textContent = bits[i % bits.length];
      const a = (Math.PI * 2 * i) / 14 + Math.random() * 0.5, dist = 70 + Math.random() * 90;
      s.style.left = e.clientX - 11 + 'px'; s.style.top = e.clientY - 11 + 'px';
      s.style.setProperty('--bx', Math.cos(a) * dist + 'px');
      s.style.setProperty('--by', Math.sin(a) * dist - 30 + 'px');
      s.style.setProperty('--br', (Math.random() * 360 - 180) + 'deg');
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 1000);
    }
  }));
  // numbers count up
  const counters = $$('[data-count]');
  if ('IntersectionObserver' in window && !reduced) {
    const cio = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, to = +el.dataset.count, dec = +(el.dataset.dec || 0), t0 = performance.now(), dur = 1500;
      const tick = t => {
        const k = clamp((t - t0) / dur), v = (to * (1 - Math.pow(1 - k, 3))).toFixed(dec);
        el.textContent = v;
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick); cio.unobserve(el);
    }), { threshold: 0.6 });
    counters.forEach(c => cio.observe(c));
  }
  // fireflies in the values room
  const ff = $('.fireflies');
  if (ff && !reduced) {
    let html = '';
    for (let i = 0; i < 26; i++) {
      const r = () => Math.random();
      html += `<i style="left:${(r() * 100).toFixed(1)}%;top:${(r() * 100).toFixed(1)}%;--t:${(6 + r() * 8).toFixed(1)}s;--dl:${(-r() * 10).toFixed(1)}s;--fx:${(r() * 120 - 60).toFixed(0)}px;--fy:${(r() * 120 - 60).toFixed(0)}px"></i>`;
    }
    ff.innerHTML = html;
  }
  // days to go
  const cd = $('#countdown');
  if (cd) {
    const days = Math.floor((new Date('2027-02-17T00:00:00-05:00') - new Date()) / 864e5);
    if (days > 1) cd.textContent = `only ${days} days to go!`;
    else if (days === 1) cd.textContent = 'see you tomorrow!';
  }

  /* ---------- 9b. love note wall: duplicate each row so it loops forever ---------- */
  $$('.wall__row').forEach(row => {
    if (reduced) return;
    [...row.children].forEach(n => { const c = n.cloneNode(true); c.setAttribute('aria-hidden', 'true'); row.appendChild(c); });
  });

  /* ---------- 9c. world map: where last year's family flew in from ---------- */
  const mapEl = $('#map');
  if (mapEl) {
    const NS = 'http://www.w3.org/2000/svg';
    const W = 1000, H = 371, LON0 = -170, LON1 = 180, LAT0 = 78, LAT1 = -52;
    const X = lon => ((lon - LON0) / (LON1 - LON0)) * W, Y = lat => ((LAT0 - lat) / (LAT0 - LAT1)) * H;
    const home = [20.63, -87.07]; // Playa del Carmen
    const cities = [[49.28,-123.12],[47.61,-122.33],[45.52,-122.68],[37.77,-122.42],[34.05,-118.24],[32.72,-117.16],[51.05,-114.07],[53.55,-113.49],[35.69,-105.94],[30.27,-97.74],[32.78,-96.8],[44.98,-93.27],[33.75,-84.39],[25.76,-80.19],[28.54,-81.38],[43.65,-79.38],[45.42,-75.7],[45.5,-73.57],[40.71,-74.01],[42.36,-71.06],[37.54,-77.44],[44.65,-63.57],[19.43,-99.13],[6.25,-75.56],[-23.55,-46.63],[-27.59,-48.55],[64.15,-21.94],[51.51,-0.13],[52.37,4.9],[51.05,3.72],[50.94,6.96],[50.11,8.68],[52.52,13.4],[50.08,14.44],[48.21,16.37],[46.06,14.51],[50.06,19.94],[52.23,21.01],[54.35,18.65],[32.08,34.78],[-8.41,115.19],[-36.85,174.76]];
    const el = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); parent.appendChild(n); return n; };
    const draw = () => {
      const arcs = $('.map__arcs', mapEl), dots = $('.map__dots', mapEl), homeG = $('.map__home', mapEl);
      const hx = X(home[1]), hy = Y(home[0]);
      cities.forEach(([lat, lon], i) => {
        const x = X(lon), y = Y(lat), dist = Math.hypot(x - hx, y - hy);
        const mx = (x + hx) / 2, my = (y + hy) / 2 - Math.min(120, dist * 0.32 + 8);
        const p = el('path', { class: 'map__arc', d: `M${x.toFixed(1)} ${y.toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${hx.toFixed(1)} ${hy.toFixed(1)}` }, arcs);
        const d = (0.25 + i * 0.045).toFixed(2) + 's';
        p.style.setProperty('--len', Math.ceil(p.getTotalLength()));
        p.style.setProperty('--d', d);
        el('circle', { class: 'map__dot', cx: x.toFixed(1), cy: y.toFixed(1), r: 3.6 }, dots).style.setProperty('--d', d);
      });
      el('circle', { class: 'map__pulse', cx: hx, cy: hy, r: 9 }, homeG);
      el('circle', { class: 'map__pulse', cx: hx, cy: hy, r: 9 }, homeG);
      el('text', { class: 'map__heart', x: hx, y: hy + 7, 'text-anchor': 'middle' }, homeG).textContent = '💚';
      el('text', { class: 'map__label', x: hx - 14, y: hy + 26, 'text-anchor': 'end' }, homeG).textContent = 'Ozen, Playa del Carmen';
    };
    const land = async () => {
      const topo = await (await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json')).json();
      const { scale: [sx, sy], translate: [tx, ty] } = topo.transform;
      const arcs = topo.arcs.map(a => { let x = 0, y = 0; return a.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; }); });
      const ring = idx => idx.flatMap((i, k) => { const pts = i >= 0 ? arcs[i] : arcs[~i].slice().reverse(); return k ? pts.slice(1) : pts; });
      const polys = [];
      const walk = g => {
        if (g.type === 'GeometryCollection') g.geometries.forEach(walk);
        else if (g.type === 'Polygon') polys.push(g.arcs);
        else if (g.type === 'MultiPolygon') g.arcs.forEach(p => polys.push(p));
      };
      Object.values(topo.objects).forEach(walk);
      let d = '';
      polys.forEach(poly => poly.forEach(r => {
        let pts = ring(r);
        if (Math.max(...pts.map(p => p[1])) < -58) return; // skip Antarctica
        const lons = pts.map(p => p[0]);
        if (Math.max(...lons) - Math.min(...lons) > 180) pts = pts.map(([lon, lat]) => [lon < 0 ? lon + 360 : lon, lat]); // rings that straddle the date line
        d += 'M' + pts.map(([lon, lat]) => X(lon).toFixed(1) + ' ' + Y(lat).toFixed(1)).join('L') + 'Z';
      }));
      $('.map__land', mapEl).setAttribute('d', d);
    };
    let started = false;
    const start = () => {
      if (started) return; started = true;
      draw();
      land().then(() => mapEl.classList.add('ready')).catch(() => mapEl.classList.add('failed'));
    };
    if ('IntersectionObserver' in window) new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { start(); o.disconnect(); } }, { rootMargin: '900px 0px' }).observe(mapEl);
    else start();
  }

  /* ---------- 10. mobile menu ---------- */
  const burger = $('.nav__burger'), menu = $('#mobileMenu');
  const setMenu = open => {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.classList.toggle('open', open);
    menu.setAttribute('aria-hidden', !open);
    document.body.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
})();
