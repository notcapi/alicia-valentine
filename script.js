(() => {
  const card = document.getElementById('card');
  const yesBtn = document.getElementById('yesBtn');
  const noBtn = document.getElementById('noBtn');
  const buttons = document.getElementById('buttons');
  const success = document.getElementById('success');

  // --- Make "No" impossible to click ---
  // Replicate the behavior from https://github.com/devanshulakhani/val:
  // - When the cursor gets close, move the "No" button away from the cursor
  //   along the normalized vector (buttonCenter - cursor), with a fixed step.
  // - Clamp to stay inside the container.

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

  function moveNoAway(cursorX, cursorY) {
    const c = buttons.getBoundingClientRect();
    measureNo();

    // Convert cursor to container-local coordinates
    const px = cursorX - c.left;
    const py = cursorY - c.top;

    const cx = state.noX + state.noW / 2;
    const cy = state.noY + state.noH / 2;

    // Vector from cursor -> button center
    let dx = cx - px;
    let dy = cy - py;
    let mag = Math.hypot(dx, dy) || 1;
    dx /= mag;
    dy /= mag;

    // Fixed step (similar to the reference: 150)
    const step = 150;

    let newX = state.noX + dx * step;
    let newY = state.noY + dy * step;

    newX = clamp(newX, 0, c.width - state.noW);
    newY = clamp(newY, 0, c.height - state.noH);

    setNoPosition(newX, newY);
  }

  function onPointerMove(e) {
    const now = performance.now();
    // Throttle so it looks smooth and not too jittery
    if (now - state.lastMoveAt < 30) return;

    const b = noBtn.getBoundingClientRect();
    const dist = Math.hypot(
      (b.left + b.width / 2) - e.clientX,
      (b.top + b.height / 2) - e.clientY
    );

    const triggerRadius = 140;
    if (dist < triggerRadius) {
      state.lastMoveAt = now;
      moveNoAway(e.clientX, e.clientY);
    }
  }

  function preventClick(e) {
    e.preventDefault();
    e.stopPropagation();
    // Jump away immediately (use current pointer if available)
    const x = e.clientX ?? (buttons.getBoundingClientRect().left + 1);
    const y = e.clientY ?? (buttons.getBoundingClientRect().top + 1);
    moveNoAway(x, y);
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
