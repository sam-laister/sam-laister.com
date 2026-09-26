// 1-in-25 chance, every second, of a pirate fox animatronic peeking in
// from the edge of the screen. An original pixel-art homage (not the real
// FNAF sprite), drawn in code. Add #foxy to the URL to trigger it on purpose.
(function () {
  const S = 40;
  const C = {
    fur: '#9b2d1f', dark: '#5e1a12', tan: '#c9955f', metal: '#8a8f96', steel: '#4a4f56',
    mouth: '#1a0404', tooth: '#e8e2cf', eye: '#ffe14a', pupil: '#000', patch: '#0b0b0b', nose: '#111'
  };
  const inEll = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
  const inTri = (x, y, [ax, ay], [bx, by], [cx, cy]) => {
    const s = (bx - ax) * (y - ay) - (by - ay) * (x - ax), t = (cx - bx) * (y - by) - (cy - by) * (x - bx),
          u = (ax - cx) * (y - cy) - (ay - cy) * (x - cx);
    return (s >= 0 && t >= 0 && u >= 0) || (s <= 0 && t <= 0 && u <= 0);
  };
  // deterministic "wear and tear" so the fur looks ripped in the same places
  const worn = (x, y) => ((x * 73856093 ^ y * 19349663) >>> 0) % 23 === 0;

  // Paint the fox at 40x40. `open` (0..1) is how far the jaw has dropped.
  function paint(g, open, eyeOn) {
    g.clearRect(0, 0, S, S);
    const jaw = Math.round(open * 7);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      let c = null;
      // ears, with torn inner metal
      if (inTri(x, y, [5, 0], [15, 7], [7, 12]) || inTri(x, y, [35, 1], [25, 7], [33, 12])) c = C.fur;
      if (inTri(x, y, [7, 3], [12, 7], [8, 10]) || inTri(x, y, [33, 4], [28, 7], [32, 10])) c = C.steel;
      // head
      if (inEll(x, y, 20, 14, 13, 10)) c = worn(x, y) ? C.metal : C.fur;
      if (inEll(x, y, 20, 9, 9, 3)) c = C.dark; // brow shadow
      // lower jaw (drops down as it opens), endoskeleton showing through
      if (inEll(x, y, 20, 27 + jaw, 9, 4)) c = C.tan;
      if (inEll(x, y, 20, 29 + jaw, 6, 2) && (x + y) % 3 === 0) c = C.steel;
      // open mouth between the jaws, with teeth top and bottom
      if (y >= 22 && y <= 24 + jaw && inEll(x, y, 20, 23 + jaw / 2, 8, 2 + jaw / 2)) {
        c = C.mouth;
        if (y <= 23 && (x % 3 !== 0)) c = C.tooth; // upper fangs
        if (y >= 23 + jaw && jaw > 1 && x % 3 === 1) c = C.tooth; // lower fangs
      }
      // muzzle and nose
      if (inEll(x, y, 20, 19, 8, 4)) c = worn(x + 1, y) ? C.metal : C.tan;
      if (inEll(x, y, 20, 16.5, 2.5, 1.5)) c = x === 19 && y === 16 ? C.metal : C.nose;
      // the eye: glowing yellow with a pinprick pupil
      if (inEll(x, y, 13, 12, 3, 2.5)) c = eyeOn ? C.eye : C.dark;
      if (eyeOn && x === 13 && y === 12) c = C.pupil;
      // eyepatch and strap
      if (inEll(x, y, 27, 12, 4, 3.5) || (Math.abs(y - (0.33 * x + 1)) < 0.7 && x > 7 && x < 26)) c = C.patch;
      if (c) { g.fillStyle = c; g.fillRect(x, y, 1, 1); }
    }
  }

  // Where he can peek from: which edge, how he's tilted, and the transforms
  // for hidden (fully off screen) and peeking (ears and eye showing).
  const EDGES = [
    { side: 'left', along: 'top', rot: 90, out: 'translateX(-100%)', peek: 'translateX(-35%)' },
    { side: 'right', along: 'top', rot: -90, out: 'translateX(100%)', peek: 'translateX(35%)' },
    { side: 'bottom', along: 'left', rot: 0, out: 'translateY(100%)', peek: 'translateY(35%)' },
    { side: 'top', along: 'left', rot: 180, out: 'translateY(-100%)', peek: 'translateY(-35%)' },
  ];

  let running = false;
  function peek() {
    if (running) return;
    running = true;
    const e = EDGES[Math.random() * EDGES.length | 0];
    const fox = document.createElement('canvas');
    fox.className = 'foxy';
    fox.width = fox.height = S;
    fox.style[e.side] = '0';
    fox.style[e.along] = 12 + Math.random() * 60 + '%';
    const place = (t, secs, ease) => {
      fox.style.transition = `transform ${secs}s ${ease}`;
      fox.style.transform = `${t} rotate(${e.rot}deg)`;
    };
    place(e.out, 0, 'linear');
    document.body.appendChild(fox);
    const g = fox.getContext('2d');

    const t0 = performance.now(), IN = 1.4, HOLD = 2.6;
    let leaving = false;
    const leave = fast => {
      if (leaving) return;
      leaving = true;
      place(e.out, fast ? .15 : .5, 'ease-in');
      setTimeout(() => { fox.remove(); running = false; }, 700);
    };
    fox.addEventListener('click', () => leave(true)); // he's shy
    requestAnimationFrame(() => requestAnimationFrame(() => place(e.peek, IN, 'cubic-bezier(.2,.7,.3,1)')));

    (function frame(now) {
      const t = (now - t0) / 1000, h = Math.max(0, t - IN) / HOLD; // h: 0..1 through the hold
      // jaw creaks open while he stares, eye flickers now and then
      paint(g, Math.sin(Math.min(1, h) * Math.PI) * .45, !(Math.sin(t * 13) > .93));
      if (t > IN + HOLD) leave(false);
      if (!leaving || t < IN + HOLD + 1) requestAnimationFrame(frame);
    })(t0);
  }

  if (location.hash === '#foxy') setTimeout(peek, 1200);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  setInterval(() => { if (!document.hidden && Math.random() < 1 / 25) peek(); }, 1000);
})();
