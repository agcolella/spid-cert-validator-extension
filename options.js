// options.js

const backendUrlInput = document.getElementById("backendUrl");
const sectorSelect = document.getElementById("sector");
const saveBtn = document.getElementById("saveBtn");
const statusEl = document.getElementById("status");

function loadOptions() {
  chrome.storage.sync.get(
    {
      backendUrl: "https://spid-cert-validator-backend.onrender.com/validate-cert",
      sector: "public"
    },
    (items) => {
      backendUrlInput.value = items.backendUrl || "";
      sectorSelect.value = items.sector || "public";
    }
  );
}

function saveOptions() {
  const backendUrl = backendUrlInput.value.trim();
  const sector = sectorSelect.value;

  chrome.storage.sync.set(
    { backendUrl, sector },
    () => {
      statusEl.textContent = "Impostazioni salvate.";
      setTimeout(() => { statusEl.textContent = ""; }, 2000);
    }
  );
}

document.addEventListener("DOMContentLoaded", loadOptions);
saveBtn.addEventListener("click", saveOptions);
