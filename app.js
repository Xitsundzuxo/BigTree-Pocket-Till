let items = [];
let history = JSON.parse(localStorage.getItem("bigtree-history")) || [];

const itemName = document.getElementById("itemName");
const itemPrice = document.getElementById("itemPrice");
const startScanBtn = document.getElementById("startScanBtn");
const scanner = document.getElementById("scanner");
const addItemBtn = document.getElementById("addItemBtn");
const itemList = document.getElementById("itemList");
const totalAmountEl = document.getElementById("totalAmount");
const cashInput = document.getElementById("cashInput");
const changeAmountEl = document.getElementById("changeAmount");
const speakBtn = document.getElementById("speakBtn");
const historyBtn = document.getElementById("historyBtn");
const historyList = document.getElementById("historyList");
const cameraInput = document.getElementById("cameraInput");

const SESSION_KEY = "bigtree-current-session";
const savedSession = JSON.parse(localStorage.getItem(SESSION_KEY));

const darkModeBtn = document.getElementById("darkModeBtn");

function updateModeIcon() {
  darkModeBtn.textContent =
    document.body.classList.contains("dark") ? "☀️" : "🌙";
}

if (localStorage.getItem("darkMode") === "on") {
  document.body.classList.add("dark");
}
updateModeIcon();

darkModeBtn.onclick = () => {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "darkMode",
    document.body.classList.contains("dark") ? "on" : "off"
  );
  updateModeIcon();
};

if (savedSession) {
  items = savedSession.items || [];
  cashInput.value = savedSession.cash || "";
  render();
}

addItemBtn.onclick = () => {
  if (!itemName.value || !itemPrice.value) return;

  items.push({
    id: Date.now(),
    name: itemName.value,
    price: parseFloat(itemPrice.value)
  });

  itemName.value = "";
  itemPrice.value = "";
  render();
  saveSession();
};

function render() {
  itemList.innerHTML = "";
  let total = 0;

  items.forEach(item => {
    total += item.price;

    const li = document.createElement("li");
    li.className = "item-row";
    li.innerHTML = `
      ${item.name} - R${item.price.toFixed(2)}
      <button class="remove-btn" onclick="removeItem(${item.id})">🗑️ Remove item</button>
    `;
  
      </button>
    itemList.appendChild(li);
  });

  totalAmountEl.textContent = total.toFixed(2);
  calculateChange();
}

window.removeItem = id => {
  items = items.filter(i => i.id !== id);
  render();
  saveSession();
};

cameraInput.onchange = async () => {
  if (!cameraInput.files.length) return;

  const image = cameraInput.files[0];

  itemName.value = "Scanning...";
  itemPrice.value = "";

  const { data } = await Tesseract.recognize(image, "eng", {
    logger: m => console.log(m)
  });

  const text = data.text;

  // Extract price (Rxx.xx or xx.xx)
  const priceMatch = text.match(/R?\s?(\d+\.\d{2})/);
  if (priceMatch) {
    itemPrice.value = priceMatch[1];
  }

  // Guess item name (first non-price line)
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const nameLine = lines.find(l => !l.match(/\d/));

  if (nameLine) {
    itemName.value = nameLine;
  } else {
    itemName.value = "Unknown item";
  }
};

cashInput.oninput = () => {
  calculateChange();
  saveSession();
};

function calculateChange() {
  const cash = parseFloat(cashInput.value) || 0;
  const total = parseFloat(totalAmountEl.textContent);
  changeAmountEl.textContent = (cash - total).toFixed(2);
}

speakBtn.onclick = () => {
  const total = totalAmountEl.textContent;
  const cash = cashInput.value || 0;
  const change = changeAmountEl.textContent;

  const msg = new SpeechSynthesisUtterance(
    `Total is ${total} rands. Cash given ${cash} rands. Change is ${change} rands`
  );
  speechSynthesis.speak(msg);

  saveHistory(total, cash, change);
  items = [];
cashInput.value = "";
saveSession();
render();
};

function saveHistory(total, cash, change) {
  history.push({
    date: new Date().toLocaleString(),
    total,
    cash,
    change
  });
  localStorage.setItem("bigtree-history", JSON.stringify(history));
}

  function saveSession() {
  const session = {
    items,
    cash: cashInput.value
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}


historyBtn.onclick = () => {
  historyList.classList.toggle("hidden");
  historyList.innerHTML = "";

  history.forEach(h => {
    const li = document.createElement("li");
    li.textContent = `${h.date} → Total R${h.total}, Cash R${h.cash}, Change R${h.change}`;
    historyList.appendChild(li);
  });
};

// Register service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js");
}

startScanBtn.onclick = () => {
  scanner.classList.remove("hidden");

  Quagga.init({
    inputStream: {
      name: "Live",
      type: "LiveStream",
      target: scanner,
      constraints: {
        facingMode: "environment"
      }
    },
    decoder: {
      readers: [
        "ean_reader",
        "ean_8_reader",
        "code_128_reader",
        "upc_reader"
      ]
    }
  }, err => {
    if (err) {
      alert("Camera error");
      return;
    }
    Quagga.start();
  });
};

Quagga.onDetected(result => {
  const code = result.codeResult.code;

  itemName.value = `Barcode: ${code}`;
  scanner.classList.add("hidden");

  Quagga.stop();
});
