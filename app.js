// Data model:
// zones: price categories, keyed by id (the CSS class is "zone-" + the id)
// rows: listed in the order they are drawn on the map, from the back of the
// hall to row 1, which is next to the screen at the bottom. Each row has:
//   name: the row label
//   zone: the id of its price zone
//   seats: how many seats the row has, numbered from 1
//   aislesAfter: seat numbers that have an aisle after them
//   unavailable: seat numbers that can't be booked
// Prices follow the viewing quality: the middle-back rows have the best view
const zones = {
  front: { name: "Front", price: 8 },
  standard: { name: "Standard", price: 12 },
  premium: { name: "Premium", price: 16 },
  back: { name: "Back", price: 10 },
};

// The IMAX hall: every row has a 4-seat block on each side of the center block
const rows = [
  { name: "10", zone: "back", seats: 17, aislesAfter: [4, 13], unavailable: [8, 9] },
  { name: "9", zone: "back", seats: 24, aislesAfter: [4, 20], unavailable: [1, 12, 13] },
  { name: "8", zone: "premium", seats: 31, aislesAfter: [4, 27], unavailable: [15, 16, 30] },
  { name: "7", zone: "premium", seats: 33, aislesAfter: [4, 29], unavailable: [5, 16, 17, 33] },
  { name: "6", zone: "premium", seats: 33, aislesAfter: [4, 29], unavailable: [10, 11, 24] },
  { name: "5", zone: "standard", seats: 33, aislesAfter: [4, 29], unavailable: [1, 2, 20] },
  { name: "4", zone: "standard", seats: 33, aislesAfter: [4, 29], unavailable: [14, 28] },
  { name: "3", zone: "standard", seats: 33, aislesAfter: [4, 29], unavailable: [6, 18, 19] },
  { name: "2", zone: "front", seats: 20, aislesAfter: [4, 16], unavailable: [10, 11] },
  { name: "1", zone: "front", seats: 24, aislesAfter: [4, 20], unavailable: [1, 24] },
];

// State:
// selectedSeat: the seat shown in the details panel, or null
// cart: the seats the user has added
// A seat looks like { id: "7-3", row: "7", number: 3, zone: zones.middle }
let selectedSeat = null;
let cart = [];

function makeSeat(row, number) {
  return {
    id: `${row.name}-${number}`,
    row: row.name,
    number,
    zone: zones[row.zone],
  };
}

// Seat map

function createSeat(row, number) {
  const seatData = makeSeat(row, number);
  const seat = document.createElement("button");
  seat.type = "button";
  seat.className = `seat zone-${row.zone}`;
  seat.dataset.seat = seatData.id;
  seat.textContent = number;
  seat.addEventListener("click", () => {
    selectSeat(seatData);
  });

  // Add the "aisle" class to seats that are next to an aisle
  if (row.aislesAfter.includes(number)) {
    seat.classList.add("aisle");
  }
  if (row.unavailable.includes(number)) {
    seat.classList.add("unavailable");
    seat.disabled = true;
  }
  return seat;
}

function createRowLabel(name) {
  const label = document.createElement("span");
  label.className = "row-label";
  label.textContent = name;
  return label;
}

function renderMap() {
  const rowsEl = document.getElementById("rows");
  for (const row of rows) {
    const rowEl = document.createElement("div");
    rowEl.className = "row";
    // Show the row number on both sides of the row
    rowEl.append(createRowLabel(row.name));
    for (let number = 1; number <= row.seats; number++) {
      rowEl.append(createSeat(row, number));
    }
    rowEl.append(createRowLabel(row.name));
    rowsEl.append(rowEl);
  }
}

// Legend

function renderLegend() {
  const legend = document.getElementById("legend");
  for (const key in zones) {
    const zone = zones[key];
    // Each zone covers a continuous block of rows, so show the first and last
    const numbers = rows
      .filter((row) => row.zone === key)
      .map((row) => Number(row.name));
    const rowRange = `rows ${Math.min(...numbers)}–${Math.max(...numbers)}`;
    legend.innerHTML += `<li><span class="swatch zone-${key}"></span>${zone.name} (${rowRange}): $${zone.price}</li>`;
  }
  legend.innerHTML += `<li><span class="swatch inspected"></span>Selected</li>`;
  legend.innerHTML += `<li><span class="swatch in-cart"></span>In cart</li>`;
  legend.innerHTML += `<li><span class="swatch unavailable"></span>Unavailable</li>`;
}

// Seat details

function findSeatButton(id) {
  return document.querySelector(`[data-seat="${id}"]`);
}

function isInCart(id) {
  return cart.some((seat) => seat.id === id);
}

function selectSeat(seat) {
  // Only one seat can be selected, so clear the previous one first
  if (selectedSeat) {
    findSeatButton(selectedSeat.id).classList.remove("inspected");
  }
  selectedSeat = seat;
  findSeatButton(seat.id).classList.add("inspected");
  renderDetails();
}

function renderDetails() {
  const details = document.getElementById("details");
  const addButton = document.getElementById("add-to-cart");

  if (!selectedSeat) {
    details.innerHTML = `<p>Select a seat on the map.</p>`;
    addButton.disabled = true;
    return;
  }

  details.innerHTML = `
    <p>Row ${selectedSeat.row}, seat ${selectedSeat.number}</p>
    <p>Zone: ${selectedSeat.zone.name}</p>
    <p>Price: $${selectedSeat.zone.price}</p>
  `;
  if (isInCart(selectedSeat.id)) {
    details.innerHTML += `<p>This seat is already in your cart.</p>`;
  }
  addButton.disabled = isInCart(selectedSeat.id);
}

// Cart

function addToCart() {
  if (!selectedSeat || isInCart(selectedSeat.id)) return;

  cart.push(selectedSeat);
  findSeatButton(selectedSeat.id).classList.add("in-cart");
  saveCart();
  renderCart();
  renderDetails();
}

function removeFromCart(id) {
  cart = cart.filter((seat) => seat.id !== id);
  findSeatButton(id).classList.remove("in-cart");
  saveCart();
  renderCart();
  renderDetails();
}

function renderCart() {
  const list = document.getElementById("cart-items");
  list.innerHTML = "";
  let total = 0;

  for (const seat of cart) {
    const item = document.createElement("li");
    item.textContent = `Row ${seat.row}, seat ${seat.number}: $${seat.zone.price}`;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", () => removeFromCart(seat.id));

    item.append(removeButton);
    list.append(item);
    total += seat.zone.price;
  }

  document.getElementById("cart-count").textContent = cart.length;
  document.getElementById("cart-total").textContent = `$${total.toFixed(2)}`;
}

// Saving the cart
// Only the row and seat number are stored. Zone and price are looked up
// from the data again on load, so they always match the current prices.

const storageKey = "parkcinema-cart";

function saveCart() {
  const saved = cart.map((seat) => ({ row: seat.row, number: seat.number }));
  try {
    localStorage.setItem(storageKey, JSON.stringify(saved));
  } catch (e) {
    console.error("Failed to save cart to localStorage:", e);
  }
}

function loadCart() {
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem(storageKey));
  } catch (e) {
    console.error("Failed to load cart from localStorage:", e);
  }
  if (!Array.isArray(saved)) {
    console.warn("Saved cart is not an array:", saved);
    return;
  }

  for (const item of saved) {
    const row = rows.find((r) => r.name === item?.row);
    // Skip seats that no longer exist, have become unavailable, or are duplicates
    if (
      !row ||
      !Number.isInteger(item.number) ||
      item.number < 1 ||
      item.number > row.seats ||
      row.unavailable.includes(item.number)
    ) {
      continue;
    }
    const seat = makeSeat(row, item.number);
    if (isInCart(seat.id)) continue;

    cart.push(seat);
    findSeatButton(seat.id).classList.add("in-cart");
  }
}

// Map view (zoom and movement)
// The map is moved inside #viewport with a CSS transform: translate(x, y) scale(zoom)
// Zoom 1 is the map's real size. The smallest zoom is the one at which the
// whole hall fits in the frame, which is also what Reset shows.

const maxZoom = 2;
const zoomFactor = 1.4; // each zoom click multiplies or divides by this
const moveFraction = 0.2; // each arrow click moves a fifth of the frame

const view = { zoom: 1, x: 0, y: 0 };
let fitZoom = 1;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function updateFitZoom() {
  const viewport = document.getElementById("viewport");
  const map = document.getElementById("map");
  const wasReset = isResetView();
  fitZoom = Math.min(
    1,
    viewport.clientWidth / map.offsetWidth,
    viewport.clientHeight / map.offsetHeight,
  );
  // Keep showing the whole hall if the user hadn't moved the view
  if (wasReset) view.zoom = fitZoom;
  else view.zoom = clamp(view.zoom, fitZoom, maxZoom);
}

function isResetView() {
  return view.zoom === fitZoom && view.x === 0 && view.y === 0;
}

// How far the map may move from the center: far enough to bring every edge
// of the zoomed map into view, and at least half the viewport, so the middle
// of the map always stays inside the frame and can't get lost.
function moveLimit() {
  const viewport = document.getElementById("viewport");
  const map = document.getElementById("map");
  const overflowX = (map.offsetWidth * view.zoom - viewport.clientWidth) / 2;
  const overflowY = (map.offsetHeight * view.zoom - viewport.clientHeight) / 2;
  return {
    x: Math.max(viewport.clientWidth / 2, overflowX),
    y: Math.max(viewport.clientHeight / 2, overflowY),
  };
}

function setZoom(newZoom) {
  newZoom = clamp(newZoom, fitZoom, maxZoom);
  // Zooming in and back out can leave a rounding error, so snap to the fit
  if (newZoom / fitZoom < 1.001) newZoom = fitZoom;
  // Scale the offset too, so the part of the map in the middle stays in the middle
  view.x = (view.x * newZoom) / view.zoom;
  view.y = (view.y * newZoom) / view.zoom;
  view.zoom = newZoom;
}

function renderView() {
  const limit = moveLimit();
  view.x = clamp(view.x, -limit.x, limit.x);
  view.y = clamp(view.y, -limit.y, limit.y);

  document.getElementById("map").style.transform =
    `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`;

  // Disable the buttons that would have no effect
  const button = (action) =>
    document.querySelector(`[data-action="${action}"]`);
  button("zoom-in").disabled = view.zoom >= maxZoom;
  button("zoom-out").disabled = view.zoom <= fitZoom;
  button("up").disabled = view.y >= limit.y;
  button("down").disabled = view.y <= -limit.y;
  button("left").disabled = view.x >= limit.x;
  button("right").disabled = view.x <= -limit.x;
  button("reset").disabled = isResetView();
}

// The arrows move the view, like scrolling: "down" shows more of the bottom
// of the map, so the map itself moves up.
function handleMapControl(action) {
  const viewport = document.getElementById("viewport");
  const stepX = viewport.clientWidth * moveFraction;
  const stepY = viewport.clientHeight * moveFraction;

  if (action === "zoom-in") setZoom(view.zoom * zoomFactor);
  else if (action === "zoom-out") setZoom(view.zoom / zoomFactor);
  else if (action === "up") view.y += stepY;
  else if (action === "down") view.y -= stepY;
  else if (action === "left") view.x += stepX;
  else if (action === "right") view.x -= stepX;
  else if (action === "reset") {
    view.zoom = fitZoom;
    view.x = 0;
    view.y = 0;
  }
  renderView();
}

document.querySelectorAll(".map-controls button").forEach((button) => {
  button.addEventListener("click", () =>
    handleMapControl(button.dataset.action),
  );
});

document.getElementById("add-to-cart").addEventListener("click", addToCart);

// Refit the hall when the frame changes size (window resize, phone rotation)
new ResizeObserver(() => {
  updateFitZoom();
  renderView();
}).observe(document.getElementById("viewport"));

renderMap(); // must come before loadCart, which colors the seats on the map
loadCart();
renderLegend();
renderDetails();
renderCart();
updateFitZoom();
renderView();
