// 3D DINO!!! A low-poly T-rex, built from tapered boxes and drawn by a tiny
// software renderer: z-buffer, flat shading, 4x4 Bayer dithering, low res.
(function () {
  const W = 120, H = 90, F = 125, DIST = 8;

  // ---- the model ----------------------------------------------------------
  // x = forward (snout), y = up, z = sideways. Each part is a box that tapers
  // from a rectangle at a to a rectangle at b: [centre, halfWidth(z), halfHeight].
  const GREEN = [90, 200, 70], DARK = [50, 140, 50], BELLY = [200, 220, 120],
        EYE = [255, 230, 0], CLAW = [255, 255, 240], MOUTH = [200, 40, 60];
  const parts = [
    [[-2.8, 1.5, 0], .04, .04, [-1.0, 1.95, 0], .34, .38, GREEN],   // tail
    [[-1.0, 1.95, 0], .34, .38, [0.35, 2.2, 0], .44, .52, GREEN],   // body
    [[-0.6, 1.62, 0], .24, .08, [0.3, 1.72, 0], .3, .1, BELLY],     // belly
    [[0.35, 2.25, 0], .3, .36, [0.8, 2.85, 0], .22, .26, GREEN],    // neck
    [[0.72, 3.0, 0], .26, .32, [1.7, 2.9, 0], .19, .18, GREEN],     // skull + snout
    [[0.8, 2.66, 0], .2, .08, [1.6, 2.62, 0], .14, .05, DARK],      // jaw
    [[0.85, 2.75, 0], .21, .03, [1.6, 2.72, 0], .15, .02, MOUTH],   // mouth
    [[1.0, 3.1, .25], .02, .07, [1.14, 3.1, .25], .02, .07, EYE],   // eyes
    [[1.0, 3.1, -.25], .02, .07, [1.14, 3.1, -.25], .02, .07, EYE],
  ];
  for (const s of [1, -1]) {
    const z = .34 * s;
    parts.push(
      [[-0.2, 1.95, z], .15, .34, [0.1, 1.0, z], .11, .18, GREEN],      // thigh
      [[0.1, 1.0, z], .1, .14, [-0.2, 0.18, z], .07, .09, DARK],       // shin
      [[-0.3, 0.1, z], .12, .08, [0.45, 0.06, z], .14, .04, DARK],     // foot
      [[0.45, 0.06, z], .1, .03, [0.6, 0.02, z], .06, .01, CLAW],      // toe claw
      [[0.6, 1.95, z * .9], .05, .06, [0.85, 1.65, z * .9], .04, .04, GREEN], // tiny arm
      [[0.85, 1.65, z * .9], .03, .03, [0.95, 1.6, z * .9], .01, .01, CLAW]   // arm claw
    );
  }

  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const norm = a => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

  const tris = []; // [v0, v1, v2, rgb], wound so the normal points outwards
  for (const [a, wa, ha, b, wb, hb, rgb] of parts) {
    const u = [0, 0, 1], v = norm(cross(norm(sub(b, a)), u));
    const ring = (c, w, h) => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([i, j]) =>
      [c[0] + u[0] * w * i + v[0] * h * j, c[1] + u[1] * w * i + v[1] * h * j, c[2] + u[2] * w * i + v[2] * h * j]);
    const p = [...ring(a, wa, ha), ...ring(b, wb, hb)];
    const mid = p.reduce((m, q) => [m[0] + q[0] / 8, m[1] + q[1] / 8, m[2] + q[2] / 8], [0, 0, 0]);
    for (const [i, j, k, l] of [[0, 1, 2, 3], [4, 7, 6, 5], [0, 4, 5, 1], [1, 5, 6, 2], [2, 6, 7, 3], [3, 7, 4, 0]]) {
      for (const t of [[p[i], p[j], p[k]], [p[i], p[k], p[l]]]) {
        const n = cross(sub(t[1], t[0]), sub(t[2], t[0]));
        if (dot(n, sub(t[0], mid)) < 0) t.reverse();
        tris.push([...t, rgb]);
      }
    }
  }
  const CX = -0.55, CY = 1.55; // model centre, so it spins on the spot

  // ---- the renderer -------------------------------------------------------
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const LIGHT = norm([-0.5, 0.7, -0.6]);
  const pack = (r, g, b) => (0xff000000 | b << 16 | g << 8 | r) >>> 0;
  const dither = (x, y, v, levels) => {
    const s = v * (levels - 1), n = Math.floor(s);
    return Math.min(levels - 1, n + (s - n > (BAYER[(y & 3) * 4 + (x & 3)] + .5) / 16 ? 1 : 0)) / (levels - 1);
  };

  const sky = new Uint32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const t = dither(x, y, y / H, 6);
    sky[y * W + x] = pack(20 + t * 80 | 0, 0, 40 + t * 70 | 0);
  }
  for (let i = 0; i < 40; i++) sky[(Math.random() * H * .55 | 0) * W + (Math.random() * W | 0)] = pack(255, 255, 255);

  function render(px, zb, angle) {
    px.set(sky); zb.fill(0);
    const cs = Math.cos(angle), sn = Math.sin(angle), tc = Math.cos(-0.28), ts = Math.sin(-0.28);
    const view = ([x, y, z]) => {
      x -= CX; y -= CY;
      const rx = x * cs + z * sn, rz = -x * sn + z * cs;
      return [rx, y * tc - rz * ts, y * ts + rz * tc + DIST];
    };
    const proj = ([x, y, z]) => [W / 2 + F * x / z, H / 2 + 3 - F * y / z, 1 / z];

    // hot pink floor grid, spinning with the dino like a turntable
    for (let i = -4; i <= 4; i++) {
      line(proj(view([i + CX, 0, -4])), proj(view([i + CX, 0, 4])));
      line(proj(view([-4 + CX, 0, i])), proj(view([4 + CX, 0, i])));
    }
    function line(a, b) {
      const n = Math.ceil(Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])));
      for (let s = 0; s <= n; s++) {
        const t = s / (n || 1), x = a[0] + (b[0] - a[0]) * t | 0, y = a[1] + (b[1] - a[1]) * t | 0;
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        const iz = a[2] + (b[2] - a[2]) * t, i = y * W + x;
        if (iz > zb[i]) { zb[i] = iz; px[i] = pack(255, 60, 200); }
      }
    }

    for (const [a, b, c, rgb] of tris) {
      const va = view(a), vb = view(b), vc = view(c);
      const n = norm(cross(sub(vb, va), sub(vc, va)));
      if (dot(n, va) >= 0) continue; // facing away
      const light = 0.3 + 0.7 * Math.max(0, dot(n, LIGHT));
      const p0 = proj(va), p1 = proj(vb), p2 = proj(vc);
      const area = (p1[0] - p0[0]) * (p2[1] - p0[1]) - (p1[1] - p0[1]) * (p2[0] - p0[0]);
      if (!area) continue;
      const x0 = Math.max(0, Math.floor(Math.min(p0[0], p1[0], p2[0]))), x1 = Math.min(W - 1, Math.ceil(Math.max(p0[0], p1[0], p2[0])));
      const y0 = Math.max(0, Math.floor(Math.min(p0[1], p1[1], p2[1]))), y1 = Math.min(H - 1, Math.ceil(Math.max(p0[1], p1[1], p2[1])));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const qx = x + .5, qy = y + .5;
        const w0 = ((p2[0] - p1[0]) * (qy - p1[1]) - (p2[1] - p1[1]) * (qx - p1[0])) / area;
        const w1 = ((p0[0] - p2[0]) * (qy - p2[1]) - (p0[1] - p2[1]) * (qx - p2[0])) / area;
        const w2 = 1 - w0 - w1;
        if (w0 < 0 || w1 < 0 || w2 < 0) continue;
        const iz = w0 * p0[2] + w1 * p1[2] + w2 * p2[2], i = y * W + x;
        if (iz <= zb[i]) continue;
        zb[i] = iz;
        const s = dither(x, y, light, 5);
        px[i] = pack(rgb[0] * s | 0, rgb[1] * s | 0, rgb[2] * s | 0);
      }
    }
  }

  // ---- hook it up ---------------------------------------------------------
  if (typeof document === 'undefined') { module.exports = { render, W, H, tris }; return; }
  const canvas = document.getElementById('dino');
  if (!canvas) return;
  canvas.width = W; canvas.height = H;
  const g = canvas.getContext('2d'), img = g.createImageData(W, H);
  const px = new Uint32Array(img.data.buffer), zb = new Float32Array(W * H);
  const polys = document.getElementById('dino-polys');
  if (polys) polys.textContent = tris.length;

  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let angle = 0.6, lastFrame = 0, visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
  (function frame(now) {
    if (visible && now - lastFrame > 66) { // ~15fps, like a real 1997 PC
      lastFrame = now;
      render(px, zb, angle);
      g.putImageData(img, 0, 0);
      angle += 0.09;
    }
    if (!still) requestAnimationFrame(frame);
  })(1000);
})();
