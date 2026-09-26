// Background: the Windows 95 "3D Pipes" screensaver, more or less.
// Pipes grow through a 3D grid and are ray-traced (cylinders + ball joints)
// into a low-res z-buffered image, dithered, then scaled up with chunky pixels.
// Behind them: a demoscene-style sky that cycles through retro palettes, with
// wavy posterised "copper" bands and a striped synthwave sun crossing the sky.
(function () {
  const canvas = document.getElementById('pipes');
  if (!canvas) return;
  const g = canvas.getContext('2d');
  const SCALE = 3, R = 0.24, JOINT = 0.34, NY = 10, NZ = 8;
  const COLORS = [[230, 40, 40], [40, 200, 60], [40, 90, 230], [240, 200, 20], [220, 60, 220], [30, 210, 220], [235, 235, 235], [250, 130, 20]];
  const DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(b => (b + .5) / 16);
  const unit = v => { const l = Math.hypot(...v); return v.map(c => c / l); };
  const L = unit([-0.45, 0.6, -0.66]), HV = unit([L[0], L[1], L[2] - 1]); // light, and its half-vector

  // Sky palettes: top, middle, bottom. Cycled through, one every ~9 seconds.
  const SKIES = [
    ['#12002b', '#7a1a8c', '#ff5e7e'], // synthwave sunset
    ['#001414', '#006060', '#3fb8a8'], // Windows 95 teal
    ['#050018', '#2a0a8a', '#e0208a'], // arcade cabinet
    ['#001000', '#003c14', '#2a9a3a'], // green phosphor CRT
    ['#0a1850', '#6a3ac0', '#ff6ec7'], // Miami night
    ['#200000', '#8a1a00', '#ffa000'], // lava lamp
    ['#000030', '#1030a0', '#50a0ff'], // Amiga Workbench
  ].map(sky => sky.map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))));
  const LEVELS = 10, HOLD = 6000, FADE = 3000;
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const rgba = c => (0xff000000 | (c[2] | 0) << 16 | (c[1] | 0) << 8 | (c[0] | 0)) >>> 0;

  let W, Hh, img, out, px, zb, F, NX, grid, pipes, segs, limit, dissolve;

  function reset() {
    W = Math.ceil(innerWidth / SCALE); Hh = Math.ceil(innerHeight / SCALE);
    canvas.width = W; canvas.height = Hh;
    img = g.createImageData(W, Hh); out = new Uint32Array(img.data.buffer);
    px = new Uint32Array(W * Hh); zb = new Float32Array(W * Hh); // pipe layer: 0 = see-through
    NX = Math.max(8, Math.round(NY * W / Hh));
    F = Hh / NY * 16.5;
    restart();
  }
  function restart() {
    px.fill(0); zb.fill(Infinity);
    grid = new Uint8Array(NX * NY * NZ);
    pipes = [newPipe(), newPipe()].filter(Boolean);
    segs = 0; limit = NX * NY * NZ * 0.3 | 0; dissolve = -1;
  }
  const idx = ([x, y, z]) => (z * NY + y) * NX + x;
  const inside = ([x, y, z]) => x >= 0 && y >= 0 && z >= 0 && x < NX && y < NY && z < NZ;
  const add = (a, d) => [a[0] + d[0], a[1] + d[1], a[2] + d[2]];

  function newPipe() {
    for (let tries = 0; tries < 50; tries++) {
      const c = [Math.random() * NX | 0, Math.random() * NY | 0, Math.random() * NZ | 0];
      if (grid[idx(c)]) continue;
      grid[idx(c)] = 1;
      const p = { cell: c, dir: null, color: COLORS[Math.random() * COLORS.length | 0], life: 25 + Math.random() * 45 | 0, from: null, to: null, k: 0 };
      sphere(c, JOINT * 0.9, p.color);
      return p;
    }
    return null;
  }

  // grid cell -> camera space (x right, y up, z into the screen)
  const cam = ([x, y, z]) => [x - (NX - 1) / 2, (NY - 1) / 2 - y, z - (NZ - 1) / 2 + 17];

  // Ray-trace one primitive into the z-buffer: every pixel in its screen
  // bounds shoots a ray from the eye, and hit(d) returns [depth, normal].
  function trace(lo, hi, rgb, hit) {
    let x0 = W, x1 = 0, y0 = Hh, y1 = 0;
    for (const x of [lo[0], hi[0]]) for (const y of [lo[1], hi[1]]) for (const z of [lo[2], hi[2]]) {
      const sx = W / 2 + F * x / z, sy = Hh / 2 - F * y / z;
      x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
    }
    x0 = Math.max(0, x0 | 0); y0 = Math.max(0, y0 | 0);
    x1 = Math.min(W - 1, Math.ceil(x1)); y1 = Math.min(Hh - 1, Math.ceil(y1));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const h = hit([(x + .5 - W / 2) / F, -(y + .5 - Hh / 2) / F, 1]);
      const i = y * W + x;
      if (!h || h[0] >= zb[i]) continue;
      zb[i] = h[0];
      const n = h[1], th = BAYER[(y & 3) * 4 + (x & 3)];
      const diff = Math.max(0, n[0] * L[0] + n[1] * L[1] + n[2] * L[2]);
      const s = (0.18 + 0.82 * diff) * 5, lv = Math.min(5, Math.floor(s) + (s % 1 > th ? 1 : 0)) / 5;
      const spec = Math.pow(Math.max(0, n[0] * HV[0] + n[1] * HV[1] + n[2] * HV[2]), 24);
      px[i] = spec > th * 0.9 + 0.05 ? 0xffffffff
        : (0xff000000 | (rgb[2] * lv) << 16 | (rgb[1] * lv) << 8 | (rgb[0] * lv)) >>> 0;
    }
  }

  // Axis-aligned open cylinder between grid points a and b
  function cylinder(a, b, r, rgb) {
    const A = cam(a), B = cam(b), k = A.findIndex((v, n) => v !== B[n]);
    if (k < 0) return;
    const [i, j] = [0, 1, 2].filter(n => n !== k), klo = Math.min(A[k], B[k]), khi = Math.max(A[k], B[k]);
    const lo = A.map((v, n) => Math.min(v, B[n]) - r), hi = A.map((v, n) => Math.max(v, B[n]) + r);
    trace(lo, hi, rgb, d => {
      const qa = d[i] * d[i] + d[j] * d[j], qb = -2 * (d[i] * A[i] + d[j] * A[j]);
      const qc = A[i] * A[i] + A[j] * A[j] - r * r, disc = qb * qb - 4 * qa * qc;
      if (disc < 0 || !qa) return null;
      const t = (-qb - Math.sqrt(disc)) / (2 * qa), pk = t * d[k];
      if (pk < klo || pk > khi) return null;
      const n = [0, 0, 0]; n[i] = (t * d[i] - A[i]) / r; n[j] = (t * d[j] - A[j]) / r;
      return [t, n];
    });
  }
  function sphere(c, r, rgb) {
    const C = cam(c);
    trace(C.map(v => v - r), C.map(v => v + r), rgb, d => {
      const qa = d[0] * d[0] + d[1] * d[1] + 1, qb = -2 * (d[0] * C[0] + d[1] * C[1] + C[2]);
      const qc = C[0] * C[0] + C[1] * C[1] + C[2] * C[2] - r * r, disc = qb * qb - 4 * qa * qc;
      if (disc < 0) return null;
      const t = (-qb - Math.sqrt(disc)) / (2 * qa);
      return [t, [(t * d[0] - C[0]) / r, (t * d[1] - C[1]) / r, (t - C[2]) / r]];
    });
  }

  // Advance a pipe by a third of a cell; pick a new direction at each cell
  function grow(p) {
    if (!p.to) {
      const options = DIRS.filter(d => { const n = add(p.cell, d); return inside(n) && !grid[idx(n)]; });
      if (!options.length || --p.life < 0) { sphere(p.cell, JOINT * 0.9, p.color); return false; } // end cap
      const straight = p.dir && options.includes(p.dir) && Math.random() < 0.7;
      const d = straight ? p.dir : options[Math.random() * options.length | 0];
      if (p.dir && d !== p.dir) sphere(p.cell, JOINT, p.color); // elbow joint
      p.dir = d; p.from = p.cell; p.to = add(p.cell, d); p.k = 0;
      grid[idx(p.to)] = 1;
    }
    p.k = Math.min(3, p.k + 1);
    const f = p.k / 3, a = p.from, b = p.to;
    cylinder(a, [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f], R, p.color);
    if (p.k === 3) { p.cell = p.to; p.to = null; segs++; }
    return true;
  }

  function step() {
    if (dissolve >= 0) { // the classic random-pixel wipe
      for (let i = 0; i < px.length; i++) if (((i * 2654435761) >>> 0) % 32 === dissolve) px[i] = 0;
      if (++dissolve === 32) restart();
      return;
    }
    pipes = pipes.map(p => grow(p) ? p : newPipe()).filter(Boolean);
    if (segs > limit || !pipes.length) dissolve = 0;
  }

  // Paint the sky for time t (ms), then the pipes on top, into the canvas
  function draw(t) {
    const cycle = HOLD + FADE, n = Math.floor(t / cycle), f = Math.max(0, (t % cycle - HOLD) / FADE);
    const ease = f * f * (3 - 2 * f), a = SKIES[n % SKIES.length], b = SKIES[(n + 1) % SKIES.length];
    const stops = [0, 1, 2].map(k => mix(a[k], b[k], ease));
    const lut = [];
    for (let l = 0; l <= LEVELS; l++) {
      const v = l / LEVELS;
      lut.push(rgba(v < .6 ? mix(stops[0], stops[1], v / .6) : mix(stops[1], stops[2], (v - .6) / .4)));
    }
    const sunTop = mix(stops[2], [255, 240, 150], .6), sunBot = mix(stops[2], [255, 40, 150], .5);
    const sunLut = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(l => rgba(mix(sunTop, sunBot, l / 8)));
    // the sun arcs across the sky every 40s: rises on the left, sets on the right
    const sec = t / 1000, arc = (sec / 40) % 1, sr = Hh * .22;
    const scx = -sr + arc * (W + 2 * sr), scy = Hh * (.95 - .6 * Math.sin(Math.PI * arc));
    const wave = new Float32Array(W);
    for (let x = 0; x < W; x++) wave[x] = .035 * Math.sin(x * .04 + sec * 1.1) + .02 * Math.sin(x * .013 - sec * .7);

    for (let y = 0, i = 0; y < Hh; y++) {
      const base = y / Hh, sy = (y - (scy - sr)) / (2 * sr), stripe = (y + sec * 6) % 9 < (sy - .45) * 9;
      for (let x = 0; x < W; x++, i++) {
        if (px[i]) { out[i] = px[i]; continue; }
        const th = BAYER[(y & 3) * 4 + (x & 3)], dx = x - scx, dy = y - scy;
        if (dx * dx + dy * dy < sr * sr && !(sy > .45 && stripe)) { // the sun, with its gaps
          const s = sy * 8; out[i] = sunLut[Math.min(8, Math.floor(s) + (s % 1 > th ? 1 : 0))]; continue;
        }
        const v = Math.min(1, Math.max(0, base + wave[x] + .015 * Math.sin(y * .09 - sec * 2))) * LEVELS;
        out[i] = lut[Math.min(LEVELS, Math.floor(v) + (v % 1 > th ? 1 : 0))];
      }
    }
    g.putImageData(img, 0, 0);
  }

  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function start() {
    reset();
    if (!still) return;
    for (let i = 0; i < 600 && dissolve < 0; i++) step(); // one finished still frame
    draw(0);
  }
  start();
  let resizeTimer;
  addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(start, 200); });
  if (still) return;
  let last = 0;
  (function frame(now) {
    if (now - last > 30) { last = now; step(); draw(now); }
    requestAnimationFrame(frame);
  })(0);
})();
