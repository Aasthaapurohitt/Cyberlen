/**
 * Runs on every page. Scrapes the signals the ML service needs
 * (url, dom html, forms, scripts) and hands them to the background
 * service worker, which owns auth + the actual network call to Express.
 *
 * Kept deliberately dumb: no scoring or auth logic here, so the popup
 * and background script are the only places that need updating if the
 * API contract changes.
 */

(function () {
  // Skip pages the extension shouldn't touch or can't usefully scan.
  const skippablePrefixes = ["chrome://", "chrome-extension://", "about:", "edge://"];
  if (skippablePrefixes.some((p) => window.location.href.startsWith(p))) {
    return;
  }

  const MAX_DOM_CHARS = 50000; // cap payload size — full page HTML can be huge

  function extractForms() {
    return Array.from(document.forms).map((form) => ({
      action: form.action || "",
      method: (form.method || "GET").toUpperCase(),
      hasPasswordField: !!form.querySelector('input[type="password"]'),
    }));
  }

  function extractScripts() {
    return Array.from(document.scripts)
      .filter((s) => s.src)
      .map((s) => ({ src: s.src }));
  }

  function buildPayload() {
    return {
      url: window.location.href,
      domHtml: document.documentElement.outerHTML.slice(0, MAX_DOM_CHARS),
      forms: extractForms(),
      scripts: extractScripts(),
    };
  }

  function sendScan() {
    chrome.runtime.sendMessage(
      { type: "CYBERLENS_SCAN_PAGE", payload: buildPayload() },
      () => {
        // Swallow "receiving end does not exist" errors that can happen
        // if the background worker is still spinning up.
        if (chrome.runtime.lastError) {
          console.debug("[CyberLens]", chrome.runtime.lastError.message);
        }
      }
    );
  }

  // Wait for the page to settle a little so forms/scripts injected by
  // client-side JS are present before scraping.
  if (document.readyState === "complete") {
    sendScan();
  } else {
    window.addEventListener("load", sendScan, { once: true });
  }

  // Lets the popup trigger a re-scan right after login, instead of
  // requiring the user to reload the page to see a result.
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "CYBERLENS_RESCAN") {
      sendScan();
      sendResponse({ received: true });
    }
  });
})();
