const currencyNames = {
  USD: "US Dollar", EUR: "Euro", GBP: "British Pound", INR: "Indian Rupee",
  JPY: "Japanese Yen", AUD: "Australian Dollar", CAD: "Canadian Dollar",
  CHF: "Swiss Franc", CNY: "Chinese Yuan", SGD: "Singapore Dollar",
  NZD: "New Zealand Dollar", AED: "UAE Dirham", SAR: "Saudi Riyal",
  KRW: "South Korean Won", THB: "Thai Baht", MYR: "Malaysian Ringgit",
  IDR: "Indonesian Rupiah", PHP: "Philippine Peso", BRL: "Brazilian Real",
  MXN: "Mexican Peso", ZAR: "South African Rand", SEK: "Swedish Krona",
  NOK: "Norwegian Krone", DKK: "Danish Krone", HKD: "Hong Kong Dollar",
  TRY: "Turkish Lira", PLN: "Polish Zloty", CZK: "Czech Koruna",
  HUF: "Hungarian Forint", ILS: "Israeli New Shekel"
};

const currencyFlags = {
  USD:"🇺🇸", EUR:"🇪🇺", GBP:"🇬🇧", INR:"🇮🇳", JPY:"🇯🇵", AUD:"🇦🇺",
  CAD:"🇨🇦", CHF:"🇨🇭", CNY:"🇨🇳", SGD:"🇸🇬", NZD:"🇳🇿", AED:"🇦🇪",
  SAR:"🇸🇦", KRW:"🇰🇷", THB:"🇹🇭", MYR:"🇲🇾", IDR:"🇮🇩", PHP:"🇵🇭",
  BRL:"🇧🇷", MXN:"🇲🇽", ZAR:"🇿🇦", SEK:"🇸🇪", NOK:"🇳🇴", DKK:"🇩🇰",
  HKD:"🇭🇰", TRY:"🇹🇷", PLN:"🇵🇱", CZK:"🇨🇿", HUF:"🇭🇺", ILS:"🇮🇱"
};

const currencySymbols = {
  USD:"$", EUR:"€", GBP:"£", INR:"₹", JPY:"¥", AUD:"A$", CAD:"C$",
  CHF:"CHF", CNY:"¥", SGD:"S$", NZD:"NZ$", AED:"د.إ", SAR:"﷼",
  KRW:"₩", THB:"฿", MYR:"RM", IDR:"Rp", PHP:"₱", BRL:"R$", MXN:"$",
  ZAR:"R", SEK:"kr", NOK:"kr", DKK:"kr", HKD:"HK$", TRY:"₺",
  PLN:"zł", CZK:"Kč", HUF:"Ft", ILS:"₪"
};

const fromSelect = document.getElementById("from-currency");
const toSelect = document.getElementById("to-currency");
const amountInput = document.getElementById("amount");
const convertedOutput = document.getElementById("converted-amount");
const rateText = document.getElementById("rate-text");
const rateStatus = document.getElementById("rate-status");
const convertButton = document.getElementById("convert-button");

let ratesCache = {};

function formatNumber(value, currency) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: currency === "JPY" || currency === "KRW" ? 0 : 2,
    minimumFractionDigits: 2
  }).format(value);
}

function populateCurrencies() {
  const codes = Object.keys(currencyNames).sort();
  for (const select of [fromSelect, toSelect]) {
    codes.forEach(code => {
      const option = document.createElement("option");
      option.value = code;
      option.textContent = `${code} — ${currencyNames[code]}`;
      select.appendChild(option);
    });
  }
  fromSelect.value = "USD";
  toSelect.value = "INR";
  updateCurrencyDecorations();
}

function updateCurrencyDecorations() {
  const from = fromSelect.value;
  const to = toSelect.value;
  document.getElementById("from-flag").textContent = currencyFlags[from] || "💱";
  document.getElementById("to-flag").textContent = currencyFlags[to] || "💱";
  document.getElementById("from-symbol").textContent = currencySymbols[from] || from;
  document.getElementById("to-symbol").textContent = currencySymbols[to] || to;
}

async function getRates(base) {
  if (ratesCache[base]) return ratesCache[base];

  const response = await fetch(
    `https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`
  );

  if (!response.ok) {
    throw new Error("Exchange rates could not be loaded.");
  }

  const data = await response.json();

  if (data.result !== "success") {
    throw new Error("Exchange rate API failed.");
  }

  ratesCache[base] = data.rates;
  return data.rates;
}

async function convertCurrency() {
  const amount = Number(amountInput.value);
  const from = fromSelect.value;
  const to = toSelect.value;

  if (!Number.isFinite(amount) || amount < 0) {
    convertedOutput.textContent = "Enter a valid amount";
    return;
  }

  convertButton.disabled = true;
  convertButton.innerHTML = "Converting… <span>↻</span>";
  rateStatus.classList.remove("error");

  try {
    if (from === to) {
      convertedOutput.textContent = formatNumber(amount, to);
      rateText.textContent = `1 ${from} = 1 ${to}`;
      rateStatus.innerHTML = '<span class="status-dot"></span> Same currency';
      updateCurrencyDecorations();
      return;
    }

    const rates = await getRates(from);
    const rate = rates[to];
    if (!rate) throw new Error("This currency pair is not available.");
    const result = amount * rate;

    convertedOutput.textContent = formatNumber(result, to);
    rateText.textContent = `1 ${from} = ${formatNumber(rate, to)} ${to}`;
    rateStatus.innerHTML = '<span class="status-dot"></span> Rates updated';
    updateCurrencyDecorations();
  } catch (error) {
    convertedOutput.textContent = "Unavailable";
    rateText.textContent = "Please try again";
    rateStatus.classList.add("error");
    rateStatus.innerHTML = '<span class="status-dot"></span> Rate error';
  } finally {
    convertButton.disabled = false;
    convertButton.innerHTML = 'Convert currency <span>→</span>';
  }
}

async function loadQuickRates() {
  const cards = document.querySelectorAll(".quick-card");
  try {
    const rates = await getRates("USD");
    const targets = ["EUR", "GBP", "INR", "JPY"];
    cards.forEach((card, index) => {
      const code = targets[index];
      const value = rates[code];
      card.querySelector(".quick-value").textContent =
        value ? `${currencySymbols[code] || ""}${formatNumber(value, code)}` : "—";
    });
  } catch {
    cards.forEach(card => card.querySelector(".quick-value").textContent = "Unavailable");
  }
}

document.getElementById("swap-button").addEventListener("click", () => {
  const oldFrom = fromSelect.value;
  fromSelect.value = toSelect.value;
  toSelect.value = oldFrom;
  updateCurrencyDecorations();
  convertCurrency();
});

fromSelect.addEventListener("change", () => {
  updateCurrencyDecorations();
  convertCurrency();
});
toSelect.addEventListener("change", () => {
  updateCurrencyDecorations();
  convertCurrency();
});
amountInput.addEventListener("input", convertCurrency);
convertButton.addEventListener("click", convertCurrency);

populateCurrencies();
convertCurrency();
loadQuickRates();
