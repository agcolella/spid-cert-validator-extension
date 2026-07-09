async function loadLastValidation() {
  return new Promise((resolve) => {
    chrome.storage.local.get("lastValidation", (data) => {
      resolve(data.lastValidation || null);
    });
  });
}

function renderSummary(result) {
  const summaryEl = document.getElementById("summary");
  if (!result) {
    summaryEl.textContent = "Nessun risultato di validazione disponibile.";
    return;
  }

  const status = result.ok ? "COMPLIANT" : "NON COMPLIANT";
  summaryEl.innerHTML = `
    <p><strong>Stato:</strong> ${status}</p>
    <p><strong>Settore:</strong> ${result.sector}</p>
    <p><strong>Timestamp:</strong> ${result.timestamp || "-"}</p>
    ${result.error ? `<p><strong>Errore:</strong> ${result.error}</p>` : ""}
  `;
}

function renderProperties(result) {
  const propsEl = document.getElementById("properties");
  propsEl.innerHTML = "";

  if (!result || !result.properties) {
    propsEl.textContent = "Nessuna proprietà disponibile.";
    return;
  }

  const p = result.properties;
  const subject = p.subject || {};
  const issuer = p.issuer || {};

  // Calcolo scadenza imminente
  let expiryWarningHtml = "";
  if (p.validTo) {
    const now = new Date();
    const validToDate = new Date(p.validTo);
    const diffMs = validToDate.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays > 0 && diffDays < 30) {
      // meno di un mese alla scadenza
      const daysRounded = Math.ceil(diffDays);
      expiryWarningHtml = `
        <p class="expiry-warning">
          <strong>ATTENZIONE:</strong> il certificato scade tra ${daysRounded} giorno${daysRounded === 1 ? "" : "i"}.
        </p>
      `;
    }
  }

  propsEl.innerHTML = `
    ${expiryWarningHtml}

    <h3>Subject</h3>
    <ul>
      <li><strong>CN</strong>: ${subject.commonName || "-"}</li>
      <li><strong>O</strong>: ${subject.organization || "-"}</li>
      <li><strong>L</strong>: ${subject.locality || "-"}</li>
      <li><strong>C</strong>: ${subject.country || "-"}</li>
      <li><strong>organizationIdentifier</strong>: ${subject.organizationIdentifier || "-"}</li>
    </ul>

    <h3>Issuer</h3>
    <ul>
      <li><strong>emailAddress</strong>: ${issuer.emailAddress || "-"}</li>
      <li><strong>CN</strong>: ${issuer.commonName || "-"}</li>
      <li><strong>OU</strong>: ${issuer.organizationalUnit || "-"}</li>
      <li><strong>O</strong>: ${issuer.organization || "-"}</li>
      <li><strong>L</strong>: ${issuer.locality || "-"}</li>
      <li><strong>C</strong>: ${issuer.country || "-"}</li>
      <li><strong>serialNumber</strong>: ${issuer.serialNumber || "-"}</li>
    </ul>

    <h3>Validity</h3>
    <ul>
      <li><strong>Valid From</strong>: ${p.validFrom || "-"}</li>
      <li><strong>Valid To</strong>: ${p.validTo || "-"}</li>
    </ul>

    <h3>Key</h3>
    <ul>
      <li><strong>Key Size</strong>: ${p.keySize || "-"}</li>
      <li><strong>Key Algorithm</strong>: ${p.keyAlgorithm || "-"}</li>
    </ul>

    <h3>Signature</h3>
    <ul>
      <li><strong>Sig. Algorithm</strong>: ${p.signatureAlgorithm || "-"}</li>
      <li><strong>Serial Number</strong>: ${p.serialNumber || "-"}</li>
    </ul>
  `;
}
function renderDetails(result) {
  const detailsEl = document.getElementById("details");
  detailsEl.innerHTML = "";

  if (!result || !Array.isArray(result.checks) || result.checks.length === 0) {
    detailsEl.textContent = "Nessun dettaglio disponibile.";
    return;
  }

  const list = document.createElement("ul");

  result.checks.forEach((check) => {
    const li = document.createElement("li");
    const statusClass = check.passed ? "check-ok" : "check-ko";
    const statusText = check.passed ? "OK" : "KO";

    li.innerHTML = `
      <span class="${statusClass}">
        <strong>${check.name}</strong> (${check.id}) - ${statusText}
      </span>
      ${check.message ? `<br/><em>${check.message}</em>` : ""}
    `;

    if (Array.isArray(check.subChecks) && check.subChecks.length > 0) {
      const subList = document.createElement("ul");
      check.subChecks.forEach((sub) => {
        const subStatusClass = sub.passed ? "check-ok" : "check-ko";
        const subStatusText = sub.passed ? "OK" : "KO";
        const subLi = document.createElement("li");

        subLi.innerHTML = `
          <span class="${subStatusClass}">
            <strong>${sub.name}</strong> - ${subStatusText}
          </span>
          ${sub.message ? `: ${sub.message}` : ""}
          ${sub.docUrl ? ` (<a href="${sub.docUrl}" target="_blank">norma</a>)` : ""}
        `;
        subList.appendChild(subLi);
      });
      li.appendChild(subList);
    }

    list.appendChild(li);
  });

  detailsEl.appendChild(list);
}

function renderRawOutput(result) {
  const rawEl = document.getElementById("rawOutput");
  rawEl.textContent = result && result.rawOutput ? result.rawOutput : "";
}

document.addEventListener("DOMContentLoaded", async () => {
  const result = await loadLastValidation();
  renderSummary(result);
  renderProperties(result);
  renderDetails(result);
  renderRawOutput(result);
});
