const root = document.documentElement;
const coarsePointer = window.matchMedia("(pointer: coarse)");
let phoneLayout;
let layoutWidth;
function updateViewportLayout() {
  phoneLayout = navigator.maxTouchPoints > 0 || coarsePointer.matches;
  layoutWidth = phoneLayout
    ? Math.min(
        screen.width || window.innerWidth,
        screen.height || window.innerHeight,
        window.innerWidth,
      )
    : window.innerWidth;
  root.classList.toggle("phone", phoneLayout);
  root.classList.toggle("compact", layoutWidth <= 600);
  if (phoneLayout) {
    root.style.setProperty("--layout-vw", layoutWidth / 100 + "px");
    root.style.setProperty("--cord-width", Math.min(420, layoutWidth) + "px");
    root.style.setProperty("--mod-width", Math.max(0, layoutWidth - 32) + "px");
  } else {
    for (const property of ["--layout-vw", "--cord-width", "--mod-width"])
      root.style.removeProperty(property);
  }
}
updateViewportLayout();
window.addEventListener("resize", updateViewportLayout);
window.addEventListener("orientationchange", updateViewportLayout);
coarsePointer.addEventListener("change", updateViewportLayout);
function preventViewportGesture(e) {
  if (e.cancelable) e.preventDefault();
}
for (const type of [
  "gesturestart",
  "gesturechange",
  "gestureend",
  "touchmove",
  "wheel",
]) {
  document.addEventListener(type, preventViewportGesture, { passive: false });
}
document.addEventListener(
  "touchstart",
  (e) => {
    if (e.touches.length > 1) preventViewportGesture(e);
  },
  { passive: false },
);
let lastTap = null;
document.addEventListener(
  "touchend",
  (e) => {
    if (e.touches.length || e.changedTouches.length !== 1) return;
    const touch = e.changedTouches[0];
    if (
      lastTap &&
      e.timeStamp - lastTap.time < 300 &&
      Math.hypot(touch.clientX - lastTap.x, touch.clientY - lastTap.y) < 30
    ) {
      preventViewportGesture(e);
    }
    lastTap = { time: e.timeStamp, x: touch.clientX, y: touch.clientY };
  },
  { passive: false },
);
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && ["+", "-", "=", "0"].includes(e.key))
    preventViewportGesture(e);
  if (
    ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(
      e.key,
    )
  )
    preventViewportGesture(e);
});
