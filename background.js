// background.js

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "spid-cert-validate",
    title: "Validate",
    contexts: ["selection"]
  });
});

async function getConfig() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      {
        backendUrl: "https://spid-cert-validator-backend.onrender.com/validate-cert",
        sector: "public"
      },
      (items) => resolve(items)
    );
  });
}

function extractCertificate(text) {
  // 1. Se c'è un blocco PEM completo, usalo
  const pemMatch = text.match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/);
  if (pemMatch) {
    return pemMatch[0];
  }

  // 2. Altrimenti, prova a interpretare la selezione come Base64 pura
  const cleaned = text.replace(/[^A-Za-z0-9+/=]/g, "");
  const looksLikeBase64 =
    cleaned.length > 500 && /^[A-Za-z0-9+/=]+$/.test(cleaned);

  if (looksLikeBase64) {
    const wrapped = cleaned.replace(/(.{64})/g, "$1\n");
    return "-----BEGIN CERTIFICATE-----\n" + wrapped + "\n-----END CERTIFICATE-----\n";
  }

  // 3. Non sembra un certificato
  return null;
}

async function callValidatorBackend(pemText) {
  const config = await getConfig();
  const res = await fetch(config.backendUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      certificatePem: pemText,
      sector: config.sector
    })
  });

  if (!res.ok) {
    throw new Error(`Validator HTTP error: ${res.status}`);
  }

  return res.json();
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "spid-cert-validate") return;

  const selectedText = info.selectionText || "";
  const certPem = extractCertificate(selectedText);

  if (!certPem) {
    const basicResult = {
      ok: false,
      sector: "public",
      error: "Il testo selezionato non sembra contenere un certificato (PEM o Base64).",
      checks: [],
      rawOutput: "",
      errors: [],
      timestamp: new Date().toISOString()
    };

    await chrome.storage.local.set({ lastValidation: basicResult });
    await chrome.tabs.create({
      url: chrome.runtime.getURL("results.html")
    });
    return;
  }

  try {
    const validationResult = await callValidatorBackend(certPem);

    const enrichedResult = {
      ...validationResult,
      timestamp: new Date().toISOString()
    };

    await chrome.storage.local.set({ lastValidation: enrichedResult });

    await chrome.tabs.create({
      url: chrome.runtime.getURL("results.html")
    });
  } catch (err) {
    const errorResult = {
      ok: false,
      sector: "public",
      error: `Errore nella chiamata al backend: ${err.message}`,
      checks: [],
      rawOutput: "",
      errors: [err.message],
      timestamp: new Date().toISOString()
    };

    await chrome.storage.local.set({ lastValidation: errorResult });

    await chrome.tabs.create({
      url: chrome.runtime.getURL("results.html")
    });
  }
});
