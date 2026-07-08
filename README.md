# SPID Certificate Validator Chrome Extension

Estensione Chrome sviluppata da @agcolella che consente di selezionare un
certificato X.509 (PEM o Base64), cliccare con il tasto destro su "Validate"
e visualizzare in un tab i risultati di validazione SPID forniti dal backend
[`agcolella/spid-cert-validator-backend`](https://github.com/agcolella/spid-cert-validator-backend).

## Configurazione

Nelle opzioni dell'estensione puoi impostare:

- URL del backend (es. `https://spid-cert-validator-backend.onrender.com/validate-cert`)
- Settore SPID (`public` / `private`)

## Caricamento

1. Apri `chrome://extensions`
2. Attiva Developer mode
3. "Load unpacked" sulla cartella `spid-cert-validator-extension`
