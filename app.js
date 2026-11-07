// Data model:
// seatsPerRow: number of seats in each row
// aisleAfterSeat: seat number after which the aisle is located
// zones: price categories, keyed by id (the CSS class is "zone-" + the id)
// rows: each row has a name, the id of its zone, and its unavailable seat numbers
const seatsPerRow = 6;
const aisleAfterSeat = 3;

const zones = {
  front: { name: "Front", price: 15 },
  middle: { name: "Middle", price: 20 },
  premium: { name: "Premium", price: 25 },
};

const rows = [
  { name: "A", zone: "front", unavailable: [1] },
  { name: "B", zone: "front", unavailable: [5] },
  { name: "C", zone: "middle", unavailable: [3] },
  { name: "D", zone: "premium", unavailable: [6] },
  { name: "E", zone: "premium", unavailable: [1] },
];

// State:
// selectedSeat: the seat shown in the details panel, or null
// cart: the seats the user has added
// A seat looks like { id: "C-3", row: "C", number: 3, zone: zones.middle }
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

  // Add the "aisle" class to seats that are next to the aisle
  if (number === aisleAfterSeat) {
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
    // Show the row letter on both sides of the row
    rowEl.append(createRowLabel(row.name));
    for (let number = 1; number <= seatsPerRow; number++) {
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
    legend.innerHTML += `<li><span class="swatch zone-${key}"></span>${zone.name}: $${zone.price}</li>`;
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
      item.number > seatsPerRow ||
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

document.getElementById("add-to-cart").addEventListener("click", addToCart);

renderMap(); // must come before loadCart, which colors the seats on the map
loadCart();
renderLegend();
renderDetails();
renderCart();
