const API_URL_BASE = "https://api.exchangerate-api.com/v4/latest/";
const API_URL_CURRENCIES = "https://api.exchangerate-api.com/v4/latest/USD";
const IMPORTANT_CURRENCIES = ["CAD", "CHF", "CNY", "EUR", "GBP", "JPY", "USD"];

let rates = {};
let multiplier = 1.0;

document.getElementById("loadCurrenciesBtn").addEventListener("click", async () => {
  const res = await fetch(API_URL_CURRENCIES);
  const data = await res.json();
  const selector = document.getElementById("currencySelector");
  selector.innerHTML = '<option value="">-- Select --</option>';
  const added = new Set();
IMPORTANT_CURRENCIES.forEach((code) => {
  if (data.rates.hasOwnProperty(code)) {
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = code;
    selector.appendChild(opt);
    added.add(code);
  }
});

Object.keys(data.rates).sort().forEach((code) => {
  if (!added.has(code)) {
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = code;
    selector.appendChild(opt);
  }
});

});

document.getElementById("fetchRatesBtn").addEventListener("click", async () => {
  const currency = document.getElementById("currencySelector").value;
  if (!currency) return;
  const res = await fetch(API_URL_BASE + currency);
  const data = await res.json();
  rates = data.rates;
  updateTable();
});

document.getElementById("searchField").addEventListener("input", updateTable);

document.getElementById("multiplierField").addEventListener("input", (e) => {
  const val = parseFloat(e.target.value);
  multiplier = isNaN(val) ? 1.0 : val;
  updateTable();
});

document.getElementById("clearBtn").addEventListener("click", () => {
  document.getElementById("currencySelector").innerHTML = '<option value="">-- Select --</option>';
  document.getElementById("searchField").value = '';
  document.getElementById("multiplierField").value = '1';
  document.querySelector("#currencyTable tbody").innerHTML = '';
  rates = {};
  multiplier = 1.0;
});

document.getElementById("exportBtn").addEventListener("click", () => {
  const rows = Array.from(document.querySelectorAll("#currencyTable tbody tr"));
  if (rows.length === 0) return alert("Nothing to export!");

  const data = rows.map(row => ({
    Currency: row.children[0].textContent,
    Rate: parseFloat(row.children[1].textContent)
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Rates");

  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(blob, "currency_rates.xlsx");
});

function updateTable() {
  const tbody = document.querySelector("#currencyTable tbody");
  const searchText = document.getElementById("searchField").value.toLowerCase();
  tbody.innerHTML = "";

  const priority = IMPORTANT_CURRENCIES.filter(code => code.toLowerCase().startsWith(searchText));
  const others = Object.keys(rates)
    .filter(code => !IMPORTANT_CURRENCIES.includes(code) && code.toLowerCase().startsWith(searchText))
    .sort();

  const all = [...priority, ...others];

  all.forEach(code => {
    const rate = rates[code];
    const tr = document.createElement("tr");

    const tdCode = document.createElement("td");
    const tdRate = document.createElement("td");

    tdCode.textContent = code;
    tdRate.textContent = (rate * multiplier).toFixed(4);

    // Bold important currencies
    if (IMPORTANT_CURRENCIES.includes(code)) {
      tdCode.style.fontWeight = "bold";
      tdRate.style.fontWeight = "bold";
    }

    tr.appendChild(tdCode);
    tr.appendChild(tdRate);
    tbody.appendChild(tr);
  });
}


