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

const SESSION_KEY = "bigtree-current-session";

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
      <button class="remove-btn" onclick="removeItem(${item.id})">❌</button>
    `;
    itemList.appendChild(li);
  });

  totalAmountEl.textContent = total.toFixed(2);
  calculateChange();
}

window.removeItem = id => {
  items = items.filter(i => i.id !== id);
  render();
};

cashInput.oninput = calculateChange;

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
