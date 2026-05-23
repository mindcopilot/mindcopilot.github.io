/* MindCopilot — theme toggle, year stamp, scroll reveal, swarm canvas */
(function () {
  "use strict";

  /* ---------- Theme toggle ---------- */
  var root = document.documentElement;
  var btn = document.getElementById("themeBtn");
  var stored = localStorage.getItem("theme");
  var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  var theme = stored || (prefersDark ? "dark" : "light");

  function applyTheme(t) {
    root.setAttribute("data-theme", t);
    if (btn) btn.textContent = t === "dark" ? "☀️" : "🌙";
  }
  applyTheme(theme);

  if (btn) {
    btn.addEventListener("click", function () {
      theme = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(theme);
      localStorage.setItem("theme", theme);
    });
  }

  /* ---------- Current year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Reveal on scroll ---------- */
  var items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Swarm canvas (hero background) ---------- */
  var canvas = document.getElementById("swarmCanvas");
  if (!canvas) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;

  var ctx = canvas.getContext("2d");
  var nodes = [];
  var W = 0, H = 0, dpr = 1, raf = 0;
  var mouse = { x: -9999, y: -9999, active: false };

  function resize() {
    var rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width;
    H = rect.height;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function seed() {
    resize();
    nodes = [];
    var count = Math.min(70, Math.max(28, Math.floor((W * H) / 22000)));
    for (var i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: 1.1 + Math.random() * 1.6,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function step(t) {
    ctx.clearRect(0, 0, W, H);

    /* Update */
    for (var i = 0; i < nodes.length; i++) {
      var a = nodes[i];
      a.x += a.vx;
      a.y += a.vy;
      if (a.x < 0 || a.x > W) a.vx *= -1;
      if (a.y < 0 || a.y > H) a.vy *= -1;

      /* Mouse repulsion */
      if (mouse.active) {
        var dx0 = a.x - mouse.x, dy0 = a.y - mouse.y;
        var d0 = Math.sqrt(dx0 * dx0 + dy0 * dy0);
        if (d0 < 110 && d0 > 0.001) {
          var force = (110 - d0) / 110 * 0.6;
          a.x += (dx0 / d0) * force;
          a.y += (dy0 / d0) * force;
        }
      }
    }

    /* Connect lines */
    for (var i = 0; i < nodes.length; i++) {
      var a = nodes[i];
      for (var j = i + 1; j < nodes.length; j++) {
        var b = nodes[j];
        var dx = a.x - b.x, dy = a.y - b.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < 140) {
          var alpha = (1 - d / 140) * 0.45;
          ctx.strokeStyle = "rgba(138, 125, 255," + alpha.toFixed(3) + ")";
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    /* Draw nodes (with cyan core) */
    var time = t * 0.001;
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var pulse = 0.6 + 0.4 * Math.sin(time + n.phase);

      ctx.fillStyle = "rgba(0, 229, 255, " + (0.55 + 0.35 * pulse) + ")";
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(0, 229, 255, " + (0.1 * pulse) + ")";
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r * 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    raf = requestAnimationFrame(step);
  }

  seed();
  raf = requestAnimationFrame(step);

  /* Throttled resize */
  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(seed, 150);
  });

  /* Mouse interaction */
  canvas.addEventListener("pointermove", function (e) {
    var rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
  });
  canvas.addEventListener("pointerleave", function () {
    mouse.active = false;
  });

  /* Pause when offscreen */
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(step);
    }
  });
})();
