// Mouse navigation: the wheel zooms, dragging moves the map.
// Both use the same limits as the buttons, which keep working as before.
// Loaded after app.js, because it uses view, setZoom and renderView from it.

const wheelZoomFactor = 1.1; // each wheel step multiplies or divides by this
const dragThreshold = 4; // pixels the mouse must move before a press becomes a drag

function setupMouseNavigation() {
  const viewport = document.getElementById("viewport");

  // Wheel: zoom toward the mouse, so the seat under it stays in place
  viewport.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault(); // zoom the map instead of scrolling the page
      const rect = viewport.getBoundingClientRect();
      const anchorX = event.clientX - (rect.left + rect.width / 2);
      const anchorY = event.clientY - (rect.top + rect.height / 2);
      const factor = event.deltaY < 0 ? wheelZoomFactor : 1 / wheelZoomFactor;
      setZoom(view.zoom * factor, anchorX, anchorY);
      renderView();
    },
    { passive: false },
  );

  // Drag: move the map with the mouse. The move and release are listened
  // for on the window, so the drag keeps working outside the frame.
  let dragging = false;
  let moved = 0; // how far the mouse moved since it was pressed
  let lastX, lastY;

  viewport.addEventListener("pointerdown", (event) => {
    moved = 0; // a new press, so the last drag no longer blocks clicks
    if (event.pointerType !== "mouse" || event.button !== 0) return; // left mouse button only
    if (event.target.closest(".map-controls")) return; // pressing a map button isn't a drag
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
  });

  window.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    view.x += dx;
    view.y += dy;
    viewport.classList.add("dragging");
    renderView();
  });

  window.addEventListener("pointerup", () => {
    dragging = false;
    viewport.classList.remove("dragging");
  });

  // Releasing the mouse after a drag also counts as a click, so stop it
  // before it selects a seat. A tiny wobble still counts as a click.
  viewport.addEventListener(
    "click",
    (event) => {
      if (moved > dragThreshold) event.stopPropagation();
      moved = 0;
    },
    true,
  );
}

setupMouseNavigation();
