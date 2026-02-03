(() => {
  const card = document.getElementById('card');
  const yesBtn = document.getElementById('yesBtn');
  const noBtn = document.getElementById('noBtn');
  const buttons = document.getElementById('buttons');
  const success = document.getElementById('success');

  // --- Make "No" impossible to click ---
  // Strategy:
  // - Render the button absolutely inside the buttons container.
  // - On mouse move, if the cursor gets close, teleport the button to a new position.
  // - Also move on pointer enter/touchstart so you can't reach it.

  const state = {
    noX: 0,
    noY: 0,
    noW: 0,
    noH: 0,
    lastMoveAt: 0,
  };

  function measureNo() {
    const rect = noBtn.getBoundingClientRect();
    state.noW = rect.width;
    state.noH = rect.height;
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function setNoPosition(x, y) {
    state.noX = x;
    state.noY = y;
    noBtn.style.left = `${x}px`;
    noBtn.style.top = `${y}px`;
    noBtn.style.transform = 'translate(0, 0)';
  }

  function placeNoInitially() {
    // Start roughly where it was visually.
    const c = buttons.getBoundingClientRect();
    measureNo();

    const x = c.width / 2 + 72 - state.noW / 2;
    const y = c.height / 2 - state.noH / 2;

    // Switch to explicit positioning
    noBtn.style.left = '0px';
    noBtn.style.top = '0px';
    setNoPosition(x, y);
  }

  function teleportNo(avoidX, avoidY) {
    const c = buttons.getBoundingClientRect();
    measureNo();

    // Keep within container padding
    const pad = 10;
    const minX = pad;
    const maxX = c.width - state.noW - pad;
    const minY = pad;
    const maxY = c.height - state.noH - pad;

    // Try a few random spots far from cursor
    let best = { x: rand(minX, maxX), y: rand(minY, maxY), d: -1 };
    for (let i = 0; i < 12; i++) {
      const x = rand(minX, maxX);
      const y = rand(minY, maxY);
      const dx = x + state.noW / 2 - avoidX;
      const dy = y + state.noH / 2 - avoidY;
      const d = Math.hypot(dx, dy);
      if (d > best.d) best = { x, y, d };
    }

    setNoPosition(best.x, best.y);
  }

  function onPointerMove(e) {
    const now = performance.now();
    // Throttle a bit so it doesn't look glitchy
    if (now - state.lastMoveAt < 40) return;

    const c = buttons.getBoundingClientRect();
    const px = (e.clientX ?? 0) - c.left;
    const py = (e.clientY ?? 0) - c.top;

    const cx = state.noX + state.noW / 2;
    const cy = state.noY + state.noH / 2;
    const dist = Math.hypot(px - cx, py - cy);

    // Make it impossible: move when cursor gets within a generous radius.
    const triggerRadius = 140;
    if (dist < triggerRadius) {
      state.lastMoveAt = now;
      teleportNo(px, py);
    }
  }

  function preventClick(e) {
    e.preventDefault();
    e.stopPropagation();
    // Move away immediately
    const c = buttons.getBoundingClientRect();
    teleportNo(c.width / 2, c.height / 2);
    return false;
  }

  // --- Confetti ---
  const canvas = document.getElementById('confetti');
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    const rect = card.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * devicePixelRatio);
    canvas.height = Math.floor(rect.height * devicePixelRatio);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  const confetti = [];
  const colors = ['#ff4f86', '#7c3aed', '#06b6d4', '#f59e0b', '#22c55e'];

  function spawnConfetti() {
    const rect = card.getBoundingClientRect();
    confetti.length = 0;
    for (let i = 0; i < 180; i++) {
      confetti.push({
        x: Math.random() * rect.width,
        y: -20 - Math.random() * rect.height,
        r: 3 + Math.random() * 4,
        w: 6 + Math.random() * 8,
        h: 10 + Math.random() * 10,
        vy: 2 + Math.random() * 4,
        vx: -1.5 + Math.random() * 3,
        rot: Math.random() * Math.PI,
        vr: (-0.12 + Math.random() * 0.24),
        color: colors[(Math.random() * colors.length) | 0],
      });
    }
  }

  let confettiAnim = 0;
  function tick() {
    const rect = card.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    for (const p of confetti) {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;

      // wrap
      if (p.y > rect.height + 40) {
        p.y = -40;
        p.x = Math.random() * rect.width;
      }
      if (p.x < -40) p.x = rect.width + 40;
      if (p.x > rect.width + 40) p.x = -40;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    confettiAnim = requestAnimationFrame(tick);
  }

  function startConfetti() {
    resizeCanvas();
    spawnConfetti();
    cancelAnimationFrame(confettiAnim);
    confettiAnim = requestAnimationFrame(tick);
  }

  // --- Events ---
  window.addEventListener('resize', () => {
    if (card.classList.contains('is-success')) resizeCanvas();
    placeNoInitially();
  });

  // Initialize
  placeNoInitially();
  buttons.addEventListener('pointermove', onPointerMove);
  buttons.addEventListener('mousemove', onPointerMove);

  noBtn.addEventListener('pointerenter', preventClick);
  noBtn.addEventListener('mouseenter', preventClick);
  noBtn.addEventListener('pointerdown', preventClick);
  noBtn.addEventListener('click', preventClick);
  noBtn.addEventListener('touchstart', preventClick, { passive: false });

  yesBtn.addEventListener('click', () => {
    card.classList.add('is-success');
    success.hidden = false;
    startConfetti();
  });
})();
