const txt = document.querySelector(".txt");
const caret = document.querySelector(".caret");
const intro = document.querySelector(".intro");
const globe = document.querySelector(".globe");
const linksBox = document.querySelector(".globe-links");
const regions = [
  {
    label: "[ Minimalistic\n     History ]",
    href: "minimalistic-history.html",
    lat: -0.35,
    lon: 2.094,
  },
  {
    label: "[ YouTube ]",
    href: "https://www.youtube.com/@riverdiamond",
    lat: 0.785,
    lon: 1.396,
  },
  {
    label: "[ Telegram ]",
    href: "https://t.me/River_Diamond",
    lat: 1.082,
    lon: 4.8,
  },
  {
    label: "[ GitHub ]",
    href: "https://github.com/RiverDiamond932",
    lat: 0.087,
    lon: 3.491,
  },
];
const regionEls = linksBox
  ? regions.map((r) => {
      const a = document.createElement("a");
      a.textContent = r.label;
      a.href = r.href;
      a.className = "globe-link";
      if (r.href.startsWith("http")) a.rel = "noreferrer noopener";
      linksBox.appendChild(a);
      return a;
    })
  : [];
const phrase = "Привет, я river_diamond";
function typeText(el, text, speed, caretEl) {
  return new Promise((resolve) => {
    let n = 0;
    const t = setInterval(() => {
      n++;
      el.textContent = text.slice(0, n);
      if (caretEl) el.appendChild(caretEl);
      if (n >= text.length) {
        clearInterval(t);
        resolve();
      }
    }, speed);
  });
}
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const ROWS = 26;
const COLS = 40;
const R = ROWS / 2;
const XU = 0.666;
const BEAM_BRIGHT = {
  "@": "@",
  "#": "@",
  "%": "#",
  "*": "%",
  "+": "*",
  ":": "+",
  "\u00b7": "+",
};
let beamRow = 0;
function landAt(lat, lon, rot) {
  let l = (((lon + rot) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const u = Math.min(179, Math.floor((l / (2 * Math.PI)) * 180));
  const v = Math.min(89, Math.floor(((Math.PI / 2 - lat) / Math.PI) * 90));
  return LAND[v][u] === "#";
}
function renderGlobe(rot) {
  const out = [];
  for (let i = 0; i < ROWS; i++) {
    let line = "";
    const y = ROWS / 2 - (i + 0.5);
    for (let j = 0; j < COLS; j++) {
      const x = (j + 0.5 - COLS / 2) * XU;
      if (x * x + y * y > R * R) {
        line += " ";
        continue;
      }
      const nx = x / R;
      const ny = y / R;
      const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      const lat = Math.asin(ny);
      const lon = Math.atan2(nx, nz);
      const land = landAt(lat, lon, rot);
      if (!land) {
        line += "\u00b7";
        continue;
      }
      if (nz > 0.85) line += "@";
      else if (nz > 0.7) line += "#";
      else if (nz > 0.55) line += "%";
      else if (nz > 0.4) line += "*";
      else if (nz > 0.25) line += "+";
      else line += ":";
    }
    if (i === beamRow || i === beamRow + 1)
      line = line.replace(/./g, (c) => BEAM_BRIGHT[c] || c);
    out.push(line);
  }
  globe.textContent = out.join("\n");
}
let globeStarted = false;
let cancelGlobeDrag = () => {};
function startGlobe() {
  if (globeStarted || !globe || typeof LAND === "undefined") return;
  const wrap = globe.closest(".globe-wrap");
  if (!wrap) return;
  globeStarted = true;
  let rot = 0;
  let speed = 1;
  let autoStep = -0.022;
  let inertia = 0;
  let drag = null;
  let suppressClickUntil = 0;
  let firstSinkDone = false;
  wrap.addEventListener("pointerdown", (e) => {
    if (!e.isPrimary || e.button !== 0 || drag) return;
    suppressClickUntil = 0;
    if (!earthUp || liftTimer) return;
    drag = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      x: e.clientX,
      time: e.timeStamp,
      total: 0,
      velocity: 0,
      moved: false,
    };
    inertia = 0;
  });
  window.addEventListener("pointermove", (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    if (!earthUp || liftTimer || globe.clientWidth <= 0) {
      cancelGlobeDrag();
      return;
    }
    if (!drag.moved) {
      if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < 6)
        return;
      drag.moved = true;
      wrap.classList.add("dragging");
      try {
        wrap.setPointerCapture(e.pointerId);
      } catch (e) {}
    }
    const delta = -((e.clientX - drag.x) / globe.clientWidth) * Math.PI;
    const elapsed = Math.max(16, e.timeStamp - drag.time);
    rot += delta;
    drag.total += delta;
    drag.velocity = drag.velocity * 0.35 + (delta / elapsed) * 90 * 0.65;
    drag.x = e.clientX;
    drag.time = e.timeStamp;
    renderGlobe(rot);
    positionLinks(rot);
    e.preventDefault();
  });
  function endDrag(e) {
    if (!drag || (e.pointerId !== undefined && drag.id !== e.pointerId)) return;
    if (drag.moved) suppressClickUntil = performance.now() + 350;
    if (drag.moved && drag.total !== 0) {
      autoStep = Math.sign(drag.total) * 0.022;
      const flung = e.type === "pointerup" && e.timeStamp - drag.time <= 120;
      let v = flung ? drag.velocity : 0;
      if (v && Math.sign(v) !== Math.sign(drag.total))
        v = Math.sign(drag.total) * Math.abs(v);
      inertia = Math.max(-0.35, Math.min(0.35, v));
    }
    const pointerId = drag.id;
    drag = null;
    wrap.classList.remove("dragging");
    try {
      if (wrap.hasPointerCapture(pointerId))
        wrap.releasePointerCapture(pointerId);
    } catch (e) {}
  }
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);
  window.addEventListener("blur", endDrag);
  cancelGlobeDrag = () => endDrag({ type: "pointercancel" });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelGlobeDrag();
  });
  wrap.addEventListener("lostpointercapture", (e) => {
    if (e.target === wrap) endDrag(e);
  });
  wrap.addEventListener("dragstart", (e) => e.preventDefault());
  wrap.addEventListener(
    "click",
    (e) => {
      if (e.detail !== 0 && performance.now() < suppressClickUntil) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true,
  );
  setInterval(() => {
    const hover = regionEls.some((el) => el.matches(":hover"));
    const focused = regionEls.some((el) => el.matches(":focus-visible"));
    speed += ((hover ? 0.25 : 1) - speed) * 0.1;
    if (!drag && !focused) {
      rot += autoStep * speed + inertia;
      inertia *= 0.9;
    }
    beamRow = (beamRow + 1) % (ROWS + 3);
    if (!rising) {
      renderGlobe(rot);
      positionLinks(rot);
      if (!firstSinkDone) {
        firstSinkDone = true;
        sinkInstant();
      }
    }
  }, 90);
}
let rising = false;
let earthUp = sessionStorage.getItem("earthRisen") === "1";
sessionStorage.removeItem("earthRisen");
let liftTimer = null;
let globeTravel = 0;
const SINK_STEP_PX = 18;
const SINK_STEP_MS = 170;
function wrapY(wrap) {
  const match = /translateY\((-?[\d.]+)px\)/.exec(wrap.style.transform || "");
  return match ? Number(match[1]) : 0;
}
function globeDistance(wrap) {
  const baseTop = wrap.getBoundingClientRect().top - wrapY(wrap);
  return Math.max(1, window.innerHeight - baseTop);
}
function moveGlobe(up) {
  cancelGlobeDrag();
  if (liftTimer) {
    clearInterval(liftTimer);
    liftTimer = null;
  }
  const wrap = document.querySelector(".globe-wrap");
  if (!wrap) return;
  wrap.classList.remove("interactive");
  globeTravel = globeDistance(wrap);
  liftTimer = setInterval(() => {
    const target = up ? 0 : globeTravel;
    const current = wrapY(wrap);
    const y = up
      ? Math.max(target, current - SINK_STEP_PX)
      : Math.min(target, current + SINK_STEP_PX);
    wrap.style.transform = "translateY(" + y + "px)";
    if (y === target) {
      clearInterval(liftTimer);
      liftTimer = null;
      wrap.classList.toggle("interactive", earthUp);
    }
  }, SINK_STEP_MS);
}
function toggleGlobe() {
  startGlobe();
  earthUp = !earthUp;
  moveGlobe(earthUp);
}
function sinkInstant() {
  const wrap = document.querySelector(".globe-wrap");
  if (!wrap || !linksBox) return;
  const nextTravel = globeDistance(wrap);
  let y = earthUp ? 0 : nextTravel;
  if (liftTimer && globeTravel > 0) {
    y = Math.max(0, Math.min(1, wrapY(wrap) / globeTravel)) * nextTravel;
  }
  globeTravel = nextTravel;
  wrap.style.transform = "translateY(" + y + "px)";
  wrap.classList.toggle("interactive", earthUp && !liftTimer);
}
sinkInstant();
function positionLinks(rot) {
  const w = globe.clientWidth;
  const h = globe.clientHeight;
  regions.forEach((r, i) => {
    const ny = Math.sin(r.lat);
    const c = Math.cos(r.lat);
    const l = r.lon - rot;
    const nx = c * Math.sin(l);
    const nz = c * Math.cos(l);
    const el = regionEls[i];
    el.style.left = w / 2 + (nx * w) / 2 + "px";
    el.style.top = h / 2 - (ny * h) / 2 + "px";
    el.style.opacity = nz > 0.12 ? 1 : 0;
    el.style.pointerEvents = nz > 0.12 ? "auto" : "none";
  });
}
if (sessionStorage.getItem("introSeen")) {
  if (intro) intro.remove();
  if (caret) caret.remove();
  startGlobe();
} else if (txt && intro && caret) {
  sessionStorage.setItem("introSeen", "1");
  const cordCanvas = document.getElementById("cord");
  if (cordCanvas) cordCanvas.style.visibility = "hidden";
  setTimeout(async () => {
    await typeText(txt, phrase, 160);
    await pause(2500);
    intro.remove();
    if (cordCanvas) cordCanvas.style.visibility = "";
  }, 900);
}
const cord = document.getElementById("cord");
const cctx = cord.getContext("2d");
const CW = 420;
const CH = 360;
const DPR = Math.min(2, window.devicePixelRatio || 1);
cord.width = CW * DPR;
cord.height = CH * DPR;
cctx.scale(DPR, DPR);
const SEG = 8.5;
const PT_MAX = 23;
const PT_MIN = 5;
let AX = 130;
let pts = [];
let tassel = [];
const collider = { x: -999, y: -999, r: 0 };
const CURSOR_R = 20;
const FINGER_R = 14;
let lastTouch = null;
let ropePress = null;
function resetCordInteraction() {
  collider.x = -999;
  collider.y = -999;
  collider.r = 0;
  lastTouch = null;
  ropePress = null;
}
function buildCord(n) {
  pts = [];
  for (let i = 0; i < n; i++)
    pts.push({ x: AX, y: i * SEG, px: AX, py: i * SEG });
  tassel = [];
  const tailY = (n - 1) * SEG;
  for (let i = 0; i < 13; i++) {
    const s = (i - 6) / 6;
    const len = 27 - Math.abs(s) * 5 + (i % 2) * 1.5;
    const strand = {
      seg: len / 3,
      bias: s * 0.5,
      grav: 0.4 + i * 0.004,
      damp: 0.93 + (i % 3) * 0.012,
      segs: [],
    };
    for (let j = 0; j < 4; j++) {
      const d = (j * len) / 3;
      const x = AX + Math.sin(strand.bias) * d;
      const y = tailY + Math.cos(strand.bias) * d;
      strand.segs.push({ x, y, px: x, py: y });
    }
    tassel.push(strand);
  }
  applySwing();
}
let swingToApply = null;
try {
  swingToApply = JSON.parse(sessionStorage.getItem("cordSwing") || "null");
  sessionStorage.removeItem("cordSwing");
} catch (e) {
  swingToApply = null;
}
if (swingToApply) setTimeout(() => (swingToApply = null), 1500);
function applySwing() {
  if (!swingToApply) return;
  const s = swingToApply;
  const num = (v) => (Number.isFinite(+v) ? +v : 0);
  const last = pts.length - 1;
  if (Array.isArray(s.pose)) {
    if (Array.isArray(s.col) && num(s.col[2]) > 0) {
      collider.x = num(s.col[0]);
      collider.y = num(s.col[1]);
      collider.r = num(s.col[2]);
    }
    if (s.pose.length === pts.length) {
      pts.forEach((p, i) => {
        const w = i / last;
        p.x = num(s.pose[i][0]);
        p.y = Math.max(8, num(s.pose[i][1]));
        p.px = p.x - num(s.vx) * w;
        p.py = p.y - num(s.vy) * w;
      });
      const end = pts[last];
      tassel.forEach((strand) => {
        strand.segs.forEach((t, j) => {
          const d = j * strand.seg;
          t.x = end.x + Math.sin(strand.bias) * d;
          t.y = end.y + Math.cos(strand.bias) * d;
          t.px = t.x - num(s.vx);
          t.py = t.y - num(s.vy);
        });
      });
    }
    return;
  }
  const curLen = (pts.length - 1) * SEG;
  const savedLen = ((num(s.n) || pts.length) - 1) * SEG || curLen;
  const k = Math.min(1.5, curLen / savedLen);
  const dx = Math.max(-curLen * 0.95, Math.min(curLen * 0.95, num(s.dx) * k));
  const dy = num(s.dy) * k;
  const vx = num(s.vx) * k;
  const vy = num(s.vy) * k;
  pts.forEach((p, i) => {
    const w = Math.pow(i / last, 1.2);
    p.x = AX + dx * w;
    p.y = i * SEG + dy * w;
    p.px = p.x - vx * w;
    p.py = p.y - vy * w;
  });
  tassel.forEach((strand) =>
    strand.segs.forEach((t) => {
      t.x += dx;
      t.y += dy;
      t.px = t.x - vx;
      t.py = t.y - vy;
    }),
  );
}
buildCord(PT_MAX);
function anchorX() {
  return 53;
}
let cordBounds = null;
function fitCord() {
  const r = cord.getBoundingClientRect();
  if (
    cordBounds &&
    (r.left !== cordBounds.left ||
      r.top !== cordBounds.top ||
      r.width !== cordBounds.width ||
      r.height !== cordBounds.height ||
      phoneLayout !== cordBounds.phoneLayout)
  )
    resetCordInteraction();
  cordBounds = {
    left: r.left,
    top: r.top,
    width: r.width,
    height: r.height,
    phoneLayout,
  };
  const scale = r.width / CW || 1;
  const ax = anchorX();
  const x1 = (ax - 34) * scale;
  const x2 = (ax + 34) * scale;
  let limit = CH - 16;
  document.querySelectorAll(".head > *, .downloads").forEach((el) => {
    const b = el.getBoundingClientRect();
    if (!b.width || b.right < x1 || b.left > x2) return;
    limit = Math.min(limit, (b.top - r.top) / scale - 16);
  });
  const n = Math.max(
    PT_MIN,
    Math.min(PT_MAX, Math.floor((limit - 34) / SEG) + 1),
  );
  if (n !== pts.length || ax !== AX) {
    AX = ax;
    buildCord(n);
  }
}
function fitTitle() {
  const h1 = document.querySelector("h1");
  if (!h1) return;
  h1.style.fontSize = "";
  h1.style.whiteSpace = "nowrap";
  h1.style.width = "max-content";
  const main = h1.closest("main");
  const mcs = getComputedStyle(main);
  const cs = getComputedStyle(h1);
  const avail =
    (phoneLayout ? layoutWidth : main.clientWidth) -
    parseFloat(mcs.paddingLeft) -
    parseFloat(mcs.paddingRight) -
    parseFloat(cs.marginLeft) -
    parseFloat(cs.marginRight);
  if (avail <= 0) {
    h1.style.whiteSpace = "";
    h1.style.width = "";
    return;
  }
  const over = h1.scrollWidth / avail;
  if (over > 1) {
    const size = parseFloat(cs.fontSize);
    h1.style.fontSize = ((size / over) * 0.98).toFixed(1) + "px";
  }
  h1.style.whiteSpace = "";
  h1.style.width = "";
}
function refit() {
  updateViewportLayout();
  fitTitle();
  fitCord();
  sinkInstant();
}
refit();
if (document.fonts) {
  document.fonts.ready.then(refit);
  document.fonts
    .load("16px Monocraft")
    .then(refit)
    .catch(() => {});
  setTimeout(refit, 700);
}
window.addEventListener("resize", refit);
window.addEventListener("orientationchange", refit);
coarsePointer.addEventListener("change", refit);
if (
  screen.orientation &&
  typeof screen.orientation.addEventListener === "function"
) {
  screen.orientation.addEventListener("change", refit);
}
if (window.visualViewport)
  window.visualViewport.addEventListener("resize", refit);
function cursorCollide() {
  if (collider.r <= 0) return;
  const reach = Math.abs(
    Math.hypot(collider.x - AX, collider.y - 8) - collider.r,
  );
  for (let i = 1; i < pts.length; i++) {
    if (i * SEG < reach) continue;
    const p = pts[i];
    const dx = p.x - collider.x;
    const dy = p.y - collider.y;
    const d = Math.hypot(dx, dy);
    if (d < collider.r && d > 0.0001) {
      const nx = dx / d;
      const ny = dy / d;
      p.x = collider.x + nx * collider.r;
      p.y = collider.y + ny * collider.r;
      const vx = p.x - p.px;
      const vy = p.y - p.py;
      const vn = vx * nx + vy * ny;
      if (vn < 0) {
        const tx = vx - vn * nx;
        const ty = vy - vn * ny;
        p.px = p.x - tx * 0.95;
        p.py = p.y - ty * 0.95;
      }
    }
  }
  for (let i = 2; i < pts.length; i++) {
    if ((i - 0.5) * SEG < reach) continue;
    const a = pts[i - 1];
    const b = pts[i];
    const mx = (a.x + b.x) * 0.5;
    const my = (a.y + b.y) * 0.5;
    const dx = mx - collider.x;
    const dy = my - collider.y;
    const d = Math.hypot(dx, dy);
    if (d < collider.r) {
      const nx = d > 0.0001 ? dx / d : 1;
      const ny = d > 0.0001 ? dy / d : 0;
      const push = (collider.r - d) * 0.5;
      a.x += nx * push;
      a.y += ny * push;
      b.x += nx * push;
      b.y += ny * push;
    }
  }
}
let pullT = -1;
let pullRate = 54;
let navAfterPull = false;
cordStep();
cordDraw();
function pull() {
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i];
    const d = Math.hypot(p.x - collider.x, p.y - collider.y);
    p.py += Math.min(3 + 3 * Math.exp(-d / 110), 5.5);
  }
  pullT = 0;
  if (!linksBox) {
    if (!navAfterPull) {
      sessionStorage.setItem("earthRisen", "1");
      navAfterPull = true;
    }
    return;
  }
  toggleGlobe();
}
function cordStep() {
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i];
    const vx = (p.x - p.px) * 0.99;
    const vy = (p.y - p.py) * 0.99;
    p.px = p.x;
    p.py = p.y;
    p.x += vx;
    p.y += vy + 0.45;
    const dx = p.x - p.px;
    const dy = p.y - p.py;
    const dist = Math.hypot(dx, dy);
    if (dist > 12) {
      p.x = p.px + (dx / dist) * 12;
      p.y = p.py + (dy / dist) * 12;
    }
  }
  for (let k = 0; k < 8; k++) {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 0.001;
      const diff = (d - SEG) / d;
      if (i === 0) {
        b.x -= dx * diff;
        b.y -= dy * diff;
      } else {
        a.x += dx * diff * 0.5;
        a.y += dy * diff * 0.5;
        b.x -= dx * diff * 0.5;
        b.y -= dy * diff * 0.5;
      }
    }
    pts[0].x = AX;
    pts[0].y = 8;
    for (let i = 1; i < pts.length; i++) {
      if (pts[i].y < 8) {
        const vy = pts[i].y - pts[i].py;
        pts[i].y = 16 - pts[i].y;
        if (vy < 0) pts[i].py = pts[i].y + -vy * 0.3;
      }
    }
    cursorCollide();
  }
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i];
    p.x += ((pts[i - 1].x + pts[i + 1].x) / 2 - p.x) * 0.12;
    p.y += ((pts[i - 1].y + pts[i + 1].y) / 2 - p.y) * 0.12;
  }
  cursorCollide();
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i];
    if (p.x < 8) {
      p.x = 8;
      if (p.px < p.x) p.px = p.x - 2;
    }
    if (p.x > CW - 8) p.x = CW - 8;
    if (p.y < 8) {
      p.y = 8;
      if (p.py > p.y) p.py = p.y - 2;
    }
    if (p.y > CH - 8) p.y = CH - 8;
  }
  const end = pts[pts.length - 1];
  for (const strand of tassel) {
    for (const t of strand.segs) {
      const vx = (t.x - t.px) * strand.damp;
      const vy = (t.y - t.py) * strand.damp;
      t.px = t.x;
      t.py = t.y;
      t.x += vx + Math.sin(strand.bias) * 0.26;
      t.y += vy + strand.grav;
      const dx = t.x - t.px;
      const dy = t.y - t.py;
      const dist = Math.hypot(dx, dy);
      if (dist > 12) {
        t.x = t.px + (dx / dist) * 12;
        t.y = t.py + (dy / dist) * 12;
      }
    }
    strand.segs[0].x = end.x;
    strand.segs[0].y = end.y;
    for (let k = 0; k < 4; k++) {
      for (let j = 0; j < strand.segs.length - 1; j++) {
        const a = strand.segs[j];
        const b = strand.segs[j + 1];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 0.001;
        const diff = (d - strand.seg) / d;
        a.x += dx * diff * 0.5;
        a.y += dy * diff * 0.5;
        b.x -= dx * diff * 0.5;
        b.y -= dy * diff * 0.5;
      }
      strand.segs[0].x = end.x;
      strand.segs[0].y = end.y;
    }
    for (let j = 1; j < strand.segs.length - 1; j++) {
      const t = strand.segs[j];
      t.x += ((strand.segs[j - 1].x + strand.segs[j + 1].x) / 2 - t.x) * 0.08;
      t.y += ((strand.segs[j - 1].y + strand.segs[j + 1].y) / 2 - t.y) * 0.08;
    }
    for (const t of strand.segs) {
      if (t.x < 4) t.x = 4;
      if (t.x > CW - 4) t.x = CW - 4;
      if (t.y > CH - 4) t.y = CH - 4;
    }
  }
}
function cordDraw(dy) {
  const ink = document.documentElement.classList.contains("light")
    ? "#1c1c1c"
    : "#cacbcc";
  cctx.clearRect(0, 0, CW, CH);
  cctx.save();
  if (dy) cctx.translate(0, dy);
  cctx.strokeStyle = ink;
  cctx.fillStyle = ink;
  cctx.lineWidth = 2;
  cctx.beginPath();
  cctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) cctx.lineTo(pts[i].x, pts[i].y);
  cctx.stroke();
  const end = pts[pts.length - 1];
  cctx.lineWidth = 1;
  cctx.beginPath();
  for (const strand of tassel) {
    cctx.moveTo(strand.segs[0].x, strand.segs[0].y);
    for (let j = 1; j < strand.segs.length; j++)
      cctx.lineTo(strand.segs[j].x, strand.segs[j].y);
  }
  cctx.stroke();
  cctx.lineWidth = 2;
  cctx.beginPath();
  cctx.arc(end.x, end.y, 5, 0, Math.PI * 2);
  cctx.fill();
  cctx.restore();
}
function hitCord(e, radius, includeTassel) {
  const r = cord.getBoundingClientRect();
  const scale = r.width / CW;
  const mx = (e.clientX - r.left) / scale;
  const my = (e.clientY - r.top) / scale;
  const all = pts.slice();
  if (includeTassel) for (const strand of tassel) all.push(...strand.segs);
  for (const p of all) {
    if (Math.hypot(mx - p.x, my - p.y) < radius) return true;
  }
  if (pullT >= 0 && includeTassel === false) {
    const restLen = (pts.length - 1) * SEG + 50;
    return Math.abs(mx - AX) < 34 && my >= -20 && my <= restLen;
  }
  return false;
}
function swingCord(e, dx, dy) {
  const r = cord.getBoundingClientRect();
  const scale = r.width / CW;
  const mx = (e.clientX - r.left) / scale;
  const my = (e.clientY - r.top) / scale;
  const mv = Math.hypot(dx, dy);
  if (mv < 0.01) return;
  const all = pts.slice();
  for (const strand of tassel) all.push(...strand.segs);
  for (const p of all) {
    const px = p.x - mx;
    const py = p.y - my;
    const d = Math.hypot(px, py);
    if (d < 36) {
      const k = 1 - d / 36;
      p.x += (dx * 0.55 + (px / (d || 1)) * mv * 0.18) * k;
      p.y += (dy * 0.55 + (py / (d || 1)) * mv * 0.18) * k;
    }
  }
}
function pokeCord(e) {
  const r = cord.getBoundingClientRect();
  const scale = r.width / CW;
  const mx = (e.clientX - r.left) / scale;
  const my = (e.clientY - r.top) / scale;
  const all = pts.slice();
  for (const strand of tassel) all.push(...strand.segs);
  for (const p of all) {
    const dx = p.x - mx;
    const dy = p.y - my;
    const d = Math.hypot(dx, dy);
    if (d < 36 && d > 0.01) {
      const k = (1 - d / 36) * 10;
      p.x += (dx / d) * k;
      p.y += (dy / d) * k;
    }
  }
}
function cordPos(e) {
  const r = cord.getBoundingClientRect();
  const scale = r.width / CW || 1;
  const x = (e.clientX - r.left) / scale;
  const y = (e.clientY - r.top) / scale;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y, scale };
}
window.addEventListener("pointermove", (e) => {
  const c = cordPos(e);
  if (!c) return;
  collider.x = c.x;
  collider.y = c.y;
  if (e.pointerType === "mouse") {
    collider.r = CURSOR_R / c.scale;
    swingCord(e, e.movementX, e.movementY);
    return;
  }
  if (!lastTouch || lastTouch.id !== e.pointerId) {
    lastTouch = { id: e.pointerId, x: e.clientX, y: e.clientY };
    return;
  }
  const dx = e.clientX - lastTouch.x;
  const dy = e.clientY - lastTouch.y;
  lastTouch.x = e.clientX;
  lastTouch.y = e.clientY;
  if (ropePress) {
    if (Math.hypot(e.clientX - ropePress.x, e.clientY - ropePress.y) > 12) {
      ropePress.moved = true;
    }
    ropePress.dy = e.clientY - ropePress.y;
  }
  swingCord(e, dx, dy);
});
window.addEventListener("pointerdown", (e) => {
  if (document.querySelector(".intro")) return;
  const c = cordPos(e);
  if (!c) return;
  collider.x = c.x;
  collider.y = c.y;
  if (e.pointerType === "mouse") {
    collider.r = CURSOR_R / c.scale;
    if (hitCord(e, 28, false)) pull();
    return;
  }
  collider.r = FINGER_R / c.scale;
  const onRope = hitCord(e, 26, false);
  const near = hitCord(e, 40, true);
  if (!onRope && !near) return;
  ropePress = { x: e.clientX, y: e.clientY, dy: 0, moved: false, grab: onRope };
});
for (const type of ["pointerup", "pointercancel"]) {
  window.addEventListener(type, (e) => {
    if (type === "pointerup" && ropePress) {
      if (ropePress.dy > 40 && ropePress.grab) {
        pull();
      } else if (!ropePress.moved) {
        if (ropePress.grab) pull();
        else pokeCord(e);
      }
    }
    if (lastTouch && lastTouch.id === e.pointerId) lastTouch = null;
    if (e.pointerType === "touch") collider.r = 0;
    ropePress = null;
  });
}
window.addEventListener("pagehide", () => {
  try {
    const end = pts[pts.length - 1];
    sessionStorage.setItem(
      "cordSwing",
      JSON.stringify({
        pose: pts.map((p) => [
          Math.round(p.x * 10) / 10,
          Math.round(p.y * 10) / 10,
        ]),
        vx: end.x - end.px,
        vy: end.y - end.py,
        n: pts.length,
        col:
          collider.r > 0
            ? [
                Math.round(collider.x),
                Math.round(collider.y),
                Math.round(collider.r),
              ]
            : null,
      }),
    );
  } catch (e) {}
});
const PHYS_STEP = 1000 / 60;
let lastFrameT = 0;
let physAcc = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(100, now - lastFrameT);
  lastFrameT = now;
  physAcc += dt;
  while (physAcc >= PHYS_STEP) {
    physAcc -= PHYS_STEP;
    if (pullT >= 0) {
      if (pullT < 0.2) {
        const fade = 1 - pullT / 0.2;
        for (let i = 1; i < pts.length; i++) {
          const p = pts[i];
          const d = Math.hypot(p.x - collider.x, p.y - collider.y);
          p.py += fade * (1.7 * Math.exp(-d / 110) + 0.2);
        }
      }
      pullT += 1 / pullRate;
    }
    cordStep();
    if (pullT >= 1) {
      pullT = -1;
      if (navAfterPull) {
        navAfterPull = false;
        location.href = "index.html";
      }
    }
  }
  cordDraw();
}
startGlobe();
requestAnimationFrame(frame);
