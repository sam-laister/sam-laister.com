// 1-in-1000 chance, every second, of the PowerPoint "Origami" transition: the
// page itself folds up into a 3D paper crane and flies away, Windows XP boots
// up in its place, then the crane flies back, crashes into the screen and
// unfolds into the page again. Add #crane to the URL to see it.
//
// How: the visible page is cut into triangles along a crease pattern. Each
// triangle is a copy of the page, clipped to its piece, and every frame a
// matrix3d maps it from the flat page onto its spot on the crane. Triangles
// share vertices, so the paper stays in one piece while it folds.
(function () {
  const shell = document.querySelector('.shell');
  if (!shell) return;

  // Crease pattern: vertices on the page (u, v in 0..1) and where each one
  // ends up on the crane (x = towards the tail, y = up, z = towards you),
  // plus when it folds [start, end] as a fraction of the folding phase.
  const V = {
    C:   { uv: [.5, .5],  at: [0, .12, 0],        when: [0, .5] },    // spine
    Ln:  { uv: [.25, .5], at: [-.5, .12, 0],      when: [0, .5] },    // neck base
    Rn:  { uv: [.75, .5], at: [.5, .12, 0],       when: [0, .5] },    // tail base
    TL:  { uv: [0, 0],    at: [-.38, -.12, -.1],  when: [0, .45] },   // belly (the corners
    BL:  { uv: [0, 1],    at: [-.38, -.12, .1],   when: [0, .45] },   // tuck in underneath)
    TR:  { uv: [1, 0],    at: [.38, -.12, -.1],   when: [.05, .5] },
    BR:  { uv: [1, 1],    at: [.38, -.12, .1],    when: [.05, .5] },
    L1:  { uv: [0, .25],  at: [-.55, -.05, -.03], when: [.15, .6] },
    L2:  { uv: [0, .75],  at: [-.55, -.05, .03],  when: [.15, .6] },
    L:   { uv: [0, .5],   at: [-1.3, 1, 0],       when: [.3, .85] },  // head
    R1:  { uv: [1, .25],  at: [.55, -.05, -.03],  when: [.2, .65] },
    R2:  { uv: [1, .75],  at: [.55, -.05, .03],   when: [.2, .65] },
    R:   { uv: [1, .5],   at: [1.35, 1.05, 0],    when: [.35, .9] },  // tail tip
    T1:  { uv: [.25, 0],  at: [-.25, .7, -.42],   when: [.4, .95] },  // far wing
    T:   { uv: [.5, 0],   at: [.1, 1.35, -.8],    when: [.45, 1] },
    T2:  { uv: [.75, 0],  at: [.3, .62, -.42],    when: [.4, .95] },
    B1:  { uv: [.25, 1],  at: [-.25, .7, .42],    when: [.4, .95] },  // near wing
    B:   { uv: [.5, 1],   at: [.1, 1.35, .8],     when: [.45, 1] },
    B2:  { uv: [.75, 1],  at: [.3, .62, .42],     when: [.4, .95] },
  };
  const SPINE = .12, WING = ['T1', 'T', 'T2', 'B1', 'B', 'B2'];
  const TRIS = [
    ['C', 'Ln', 'TL'], ['C', 'TL', 'T1'], ['C', 'T1', 'T'], ['C', 'T', 'T2'], ['C', 'T2', 'TR'], ['C', 'TR', 'Rn'],
    ['C', 'BL', 'Ln'], ['C', 'B1', 'BL'], ['C', 'B', 'B1'], ['C', 'B2', 'B'], ['C', 'BR', 'B2'], ['C', 'Rn', 'BR'],
    ['Ln', 'L1', 'L'], ['Ln', 'L', 'L2'], ['Ln', 'TL', 'L1'], ['Ln', 'L2', 'BL'],   // neck
    ['Rn', 'R', 'R1'], ['Rn', 'R2', 'R'], ['Rn', 'R1', 'TR'], ['Rn', 'BR', 'R2'],   // tail
  ];
  // Timeline (ms): fold up, fly off, XP boots, crane flies back, hits the
  // screen, unfolds into the page again.
  const FOLD = 2600, SETTLE = 500, FLY = 2600, OUT = FOLD + SETTLE + FLY;
  const BOOT = OUT - 1100, RET = OUT + 2600, RETURN = 1500, HIT = RET + RETURN;
  const SQUASH = 260, UNFOLD = 1900, END = HIT + SQUASH + UNFOLD;
  const NO_SCROLL = ['wheel', 'touchmove', 'keydown'];
  const LIGHT = norm([-.4, -.7, .6]); // screen space: up-left, towards you

  let running = false;
  function fly() {
    if (running) return;
    running = true;
    const vw = innerWidth, vh = innerHeight, r = shell.getBoundingClientRect();
    // the sheet of paper is the part of the page you can currently see
    const L = Math.max(0, r.left), T = Math.max(0, r.top);
    const W = Math.min(vw, r.right) - L, H = Math.min(vh, r.bottom) - T;
    const flat = k => [L + V[k].uv[0] * W, T + V[k].uv[1] * H, 0];

    const stage = el('crane-stage'), world = el('crane-world');
    stage.appendChild(world);
    const src = shell.querySelectorAll('canvas');

    const faces = TRIS.map(keys => {
      const pts = keys.map(flat);
      const x0 = Math.min(...pts.map(p => p[0])), y0 = Math.min(...pts.map(p => p[1]));
      const w = Math.max(...pts.map(p => p[0])) - x0, h = Math.max(...pts.map(p => p[1])) - y0;
      const local = pts.map(p => [p[0] - x0, p[1] - y0]);
      const clip = `polygon(${local.map(p => `${p[0]}px ${p[1]}px`).join(',')})`;
      const clipBack = `polygon(${local.map(p => `${w - p[0]}px ${p[1]}px`).join(',')})`;

      const tri = el('crane-tri', `width:${w}px;height:${h}px`);
      const front = el('crane-face', `clip-path:${clip}`), back = el('crane-face crane-back', `clip-path:${clipBack}`);
      const copy = shell.cloneNode(true);
      copy.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'));
      copy.querySelectorAll('canvas').forEach((c, i) => {
        c.width = src[i].width; c.height = src[i].height; c.getContext('2d').drawImage(src[i], 0, 0);
      });
      copy.style.cssText = `position:absolute;margin:0;left:${r.left - x0}px;top:${r.top - y0}px;width:${r.width}px`;
      const shadeF = el('crane-shade'), shadeB = el('crane-shade');
      front.append(copy, shadeF); back.appendChild(shadeB);
      tri.append(front, back);
      world.appendChild(tri);
      return { keys, local, tri, shadeF, shadeB };
    });
    document.body.appendChild(stage);
    shell.style.visibility = 'hidden';

    const unit = Math.min(vw, vh) * .2;
    const t0 = performance.now();
    // the page underneath has to stay put for the unfold to line up with it
    const stop = e => { if (e.type !== 'keydown' || /Arrow|Page|Space|Home|End/.test(e.code)) e.preventDefault(); };
    NO_SCROLL.forEach(type => addEventListener(type, stop, { passive: false }));
    let boot = null, hit = false;

    // Where is the crane, how is it posed, and how folded is it (f)?
    function pose(t) {
      const flapAt = amp => Math.sin(t / 1000 * 11) * amp;
      if (t < FOLD) {
        const f = t / FOLD;
        return { f, yaw: -.15 + .6 * f, pitch: .2, roll: 0, cx: vw / 2, cy: vh / 2, s: unit, flap: 0 };
      }
      if (t < RET) { // settle, then fly off to the top left
        const flyT = clamp((t - FOLD - SETTLE) / FLY), fe = flyT * flyT;
        return { f: 1, yaw: .45 + .35 * fe, pitch: .2 + .1 * fe, roll: -.2 * fe,
          cx: vw / 2 - fe * vw * .75, cy: vh / 2 - fe * vh * .8, s: unit * (1 - .65 * fe),
          flap: flapAt(.35 + .35 * Math.min(1, flyT * 3)) };
      }
      if (t < HIT) { // back again, heading straight for the screen
        const r = (t - RET) / RETURN, grow = r * r * r, glide = 1 - (1 - r) * (1 - r);
        return { f: 1, yaw: .8 - .5 * r, pitch: .3 - .05 * r, roll: -.2 * (1 - r),
          cx: -.25 * vw + glide * .75 * vw, cy: -.3 * vh + r * .8 * vh, s: unit * (.35 + 1.25 * grow),
          flap: flapAt(.7 * (1 - r * r)) };
      }
      const base = { yaw: .3, pitch: .25, roll: 0, cx: vw / 2, cy: vh / 2, flap: 0 };
      if (t < HIT + SQUASH) // splat
        return { ...base, f: 1, s: unit * 1.6 * (1 - .12 * Math.sin(Math.PI * (t - HIT) / SQUASH)) };
      return { ...base, f: 1 - clamp((t - HIT - SQUASH) / UNFOLD), s: unit * 1.6 }; // open back up
    }

    (function frame(now) {
      const t = now - t0, { f, yaw, pitch, roll, cx, cy, s: scale, flap } = pose(t);

      const pos = {};
      for (const k in V) {
        let c = V[k].at;
        if (flap && WING.includes(k)) { // wings rotate about the spine
          const s = Math.sign(c[2]), a = flap * s, y = c[1] - SPINE;
          c = [c[0], SPINE + y * Math.cos(a) - c[2] * Math.sin(a), y * Math.sin(a) + c[2] * Math.cos(a)];
        }
        const w = toScreen(c, yaw, pitch, roll, scale, cx, cy);
        const [s0, s1] = V[k].when, e = ease(clamp((f - s0) / (s1 - s0)));
        const p = flat(k);
        // travel from flat to folded, lifting towards you on the way like a flap
        const lift = Math.sin(Math.PI * e) * Math.hypot(w[0] - p[0], w[1] - p[1]) * .22;
        pos[k] = [p[0] + (w[0] - p[0]) * e, p[1] + (w[1] - p[1]) * e, p[2] + (w[2] - p[2]) * e + lift];
      }

      for (const face of faces) {
        const P = face.keys.map(k => pos[k]), p = face.local;
        const d1 = [p[1][0] - p[0][0], p[1][1] - p[0][1]], d2 = [p[2][0] - p[0][0], p[2][1] - p[0][1]];
        const det = d1[0] * d2[1] - d1[1] * d2[0];
        const E1 = sub(P[1], P[0]), E2 = sub(P[2], P[0]);
        const ex = E1.map((v, i) => (v * d2[1] - E2[i] * d1[1]) / det);
        const ey = E1.map((v, i) => (-v * d2[0] + E2[i] * d1[0]) / det);
        const n = cross(ex, ey), len = Math.hypot(...n);
        if (len < 1e-6) { face.tri.style.visibility = 'hidden'; continue; }
        face.tri.style.visibility = '';
        const ez = n.map(v => v / len);
        const tr = P[0].map((v, i) => v - ex[i] * p[0][0] - ey[i] * p[0][1]);
        face.tri.style.transform = `matrix3d(${[...ex, 0, ...ey, 0, ...ez, 0, ...tr, 1].join(',')})`;
        // CSS z points at the viewer, so the lit side is whichever faces us
        const lit = Math.abs(ez[0] * LIGHT[0] + ez[1] * LIGHT[1] + ez[2] * LIGHT[2]);
        const dark = (1 - lit) * .55 * Math.min(1, f * 3);
        face.shadeF.style.opacity = face.shadeB.style.opacity = dark;
      }

      if (!boot && t > BOOT) {
        boot = bootScreen();
        requestAnimationFrame(() => boot.classList.add('on'));
      }
      if (!hit && t > HIT) { hit = true; boot.classList.add('hit'); boot.appendChild(cracks(vw, vh)); }

      if (t < END) return requestAnimationFrame(frame);
      // unfolded exactly where the real page is: swap it back in and let XP go
      shell.style.visibility = '';
      stage.remove();
      NO_SCROLL.forEach(type => removeEventListener(type, stop));
      boot.classList.remove('on');
      setTimeout(() => { boot.remove(); running = false; }, 800);
    })(t0);
  }

  // A Windows XP-ish boot screen (an homage drawn here, not Microsoft's artwork)
  function bootScreen() {
    const b = el('xp-boot');
    b.innerHTML = `<div class="xp-logo">
        <svg class="xp-flag" viewBox="0 0 100 90" aria-hidden="true">
          <path d="M8 14 Q24 4 44 12 L40 42 Q22 34 4 44 Z" fill="#f65314"/>
          <path d="M50 14 Q68 22 90 12 L86 42 Q66 50 46 42 Z" fill="#7cbb00"/>
          <path d="M3 50 Q21 40 39 48 L35 78 Q17 70 -1 80 Z" fill="#00a1f1"/>
          <path d="M45 48 Q63 56 85 48 L81 78 Q61 86 41 78 Z" fill="#ffbb00"/>
        </svg>
        <div class="xp-word"><small>Microsoft<sup>®</sup></small><b>Windows<i>xp</i></b><em>Sam Edition</em></div>
      </div>
      <div class="xp-bar"><span></span></div>
      <p class="xp-copy">Copyright © 1999–2026 Sam Laister Corporation</p>
      <p class="xp-brand">Sam Laister<sup>®</sup></p>`;
    document.body.appendChild(b);
    return b;
  }

  // Cracked glass: jagged lines out from where the crane hit, plus a few rings
  function cracks(vw, vh) {
    const cx = vw / 2, cy = vh / 2, lines = [];
    for (let i = 0; i < 14; i++) {
      let a = i / 14 * Math.PI * 2 + Math.random() * .3, x = cx, y = cy, pts = [`${x},${y}`];
      const len = Math.max(vw, vh) * (.25 + Math.random() * .45);
      for (let d = 0; d < len;) {
        const step = 20 + Math.random() * 50;
        d += step; a += (Math.random() - .5) * .5;
        x += Math.cos(a) * step; y += Math.sin(a) * step; pts.push(`${x | 0},${y | 0}`);
      }
      lines.push(`<polyline points="${pts.join(' ')}"/>`);
    }
    for (const r of [40, 95, 170]) {
      const pts = [];
      for (let k = 0; k <= 16; k++) {
        const a = k / 16 * Math.PI * 2, rr = r * (.85 + Math.random() * .3);
        pts.push(`${cx + Math.cos(a) * rr | 0},${cy + Math.sin(a) * rr | 0}`);
      }
      lines.push(`<polyline points="${pts.join(' ')}"/>`);
    }
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'xp-cracks');
    svg.setAttribute('viewBox', `0 0 ${vw} ${vh}`);
    svg.innerHTML = `<g class="shadow">${lines.join('')}</g><g>${lines.join('')}</g>`;
    return svg;
  }

  // crane space -> screen space (px, y down, z towards the viewer)
  function toScreen([x, y, z], yaw, pitch, roll, s, cx, cy) {
    let X = x * Math.cos(yaw) + z * Math.sin(yaw), Z = -x * Math.sin(yaw) + z * Math.cos(yaw), Y = y;
    [Y, Z] = [Y * Math.cos(pitch) - Z * Math.sin(pitch), Y * Math.sin(pitch) + Z * Math.cos(pitch)];
    [X, Y] = [X * Math.cos(roll) - Y * Math.sin(roll), X * Math.sin(roll) + Y * Math.cos(roll)];
    return [cx + X * s, cy - Y * s, Z * s];
  }
  function el(cls, css) {
    const d = document.createElement('div');
    d.className = cls;
    if (css) d.style.cssText = css;
    return d;
  }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function norm(v) { const l = Math.hypot(...v); return v.map(c => c / l); }
  function clamp(x) { return Math.max(0, Math.min(1, x)); }
  function ease(x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }

  if (location.hash === '#crane') setTimeout(fly, 1200);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  setInterval(() => { if (!document.hidden && Math.random() < 1 / 1000) fly(); }, 1000);
})();
