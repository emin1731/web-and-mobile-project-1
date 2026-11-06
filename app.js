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

// Seat map

function createSeat(row, number) {
  const zone = zones[row.zone];
  const seat = document.createElement("button");
  seat.type = "button";
  seat.className = `seat zone-${row.zone}`;
  seat.textContent = number;

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

function renderMap() {
  const rowsEl = document.getElementById("rows");
  for (const row of rows) {
    const rowEl = document.createElement("div");
    rowEl.className = "row";
    for (let number = 1; number <= seatsPerRow; number++) {
      rowEl.append(createSeat(row, number));
    }
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
  legend.innerHTML += `<li><span class="swatch unavailable"></span>Unavailable</li>`;
}

renderMap();
renderLegend();
