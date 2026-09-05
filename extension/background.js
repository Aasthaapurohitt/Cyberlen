/**
 * Background service worker (Manifest V3).
 *
 * Owns the JWT and the actual network call to Express — content.js only
 * scrapes and forwards, popup.js only reads/displays. This is the single
 * place that knows about the CyberLens API, so swapping the backend URL
 * or auth scheme only touches this file.
 */

const API_BASE_URL = "http://localhost:5000"; // swap for your deployed Express URL
const SCAN_COOLDOWN_MS = 10 * 60 * 1000; // don't re-hit the API for a URL scanned within the last 10 minutes

const BADGE_COLORS = {
  safe: "#3FBF8B",
  "low risk": "#4FB8C4",
  "medium risk": "#E3A73E",
  "high risk": "#E5484D",
};

// Per-URL cache (separate from the per-tab cache below) so that visiting the
// same page in a new tab, or reloading it, reuses a recent result instead of
// hitting Express + the ML service again. Without this, a user browsing
// normally would fire a scan on every single page load.
async function getCachedUrlResult(url) {
  const { cyberlens_url_cache = {} } = await chrome.storage.session.get("cyberlens_url_cache");
  const entry = cyberlens_url_cache[url];
  if (entry && Date.now() - entry.scannedAt < SCAN_COOLDOWN_MS) {
    return entry;
  }
  return null;
}

async function setCachedUrlResult(url, result) {
  const { cyberlens_url_cache = {} } = await chrome.storage.session.get("cyberlens_url_cache");
  cyberlens_url_cache[url] = { ...result, scannedAt: Date.now() };

  // Keep the cache from growing unbounded over a long browsing session.
  const entries = Object.entries(cyberlens_url_cache);
  if (entries.length > 200) {
    entries
      .sort((a, b) => a[1].scannedAt - b[1].scannedAt)
      .slice(0, entries.length - 200)
      .forEach(([staleUrl]) => delete cyberlens_url_cache[staleUrl]);
  }

  await chrome.storage.session.set({ cyberlens_url_cache });
}

// In-memory + chrome.storage.session cache of the latest result per tab,
// so the popup can show a result instantly without re-scanning.
async function saveResultForTab(tabId, result) {
  const { cyberlens_results = {} } = await chrome.storage.session.get("cyberlens_results");
  cyberlens_results[tabId] = { ...result, scannedAt: Date.now() };
  await chrome.storage.session.set({ cyberlens_results });
}

async function getResultForTab(tabId) {
  const { cyberlens_results = {} } = await chrome.storage.session.get("cyberlens_results");
  return cyberlens_results[tabId] || null;
}

async function getToken() {
  const { cyberlens_token } = await chrome.storage.local.get("cyberlens_token");
  return cyberlens_token || null;
}

function updateBadge(tabId, verdict) {
  const color = BADGE_COLORS[verdict] || "#8892A4";
  const shortLabel = verdict ? verdict.split(" ")[0].toUpperCase().slice(0, 4) : "";
  chrome.action.setBadgeBackgroundColor({ color, tabId });
  chrome.action.setBadgeText({ text: shortLabel, tabId });
}

async function submitScan(payload, tabId) {
  const token = await getToken();
  if (!token) {
    // Not logged in yet — store a placeholder so the popup can prompt for login.
    await saveResultForTab(tabId, { status: "unauthenticated", url: payload.url });
    return;
  }

  const cached = await getCachedUrlResult(payload.url);
  if (cached) {
    await saveResultForTab(tabId, cached);
    if (cached.verdict) updateBadge(tabId, cached.verdict);
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Scan request failed (${res.status})`);
    }

    const data = await res.json();
    const result = { status: "complete", url: payload.url, ...data };
    await saveResultForTab(tabId, result);
    await setCachedUrlResult(payload.url, result);
    updateBadge(tabId, data.verdict);
  } catch (err) {
    console.error("[CyberLens] scan failed:", err);
    await saveResultForTab(tabId, {
      status: "error",
      url: payload.url,
      error: err.message,
    });
    chrome.action.setBadgeText({ text: "ERR", tabId });
    chrome.action.setBadgeBackgroundColor({ color: "#8892A4", tabId });
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender.tab?.id;

  if (message.type === "CYBERLENS_SCAN_PAGE" && tabId != null) {
    submitScan(message.payload, tabId);
    sendResponse({ received: true });
    return; // scan runs async in the background, nothing more to send back here
  }

  if (message.type === "CYBERLENS_GET_ACTIVE_RESULT") {
    chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
      const result = tab ? await getResultForTab(tab.id) : null;
      sendResponse({ result });
    });
    return true; // keep the message channel open for the async response
  }

  if (message.type === "CYBERLENS_LOGIN") {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(message.credentials),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Login failed");

        await chrome.storage.local.set({
          cyberlens_token: data.token,
          cyberlens_user: data.user,
        });
        sendResponse({ success: true, user: data.user });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.type === "CYBERLENS_LOGOUT") {
    chrome.storage.local.remove(["cyberlens_token", "cyberlens_user"], () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// Clear badge state when a tab navigates to a new page, so a stale
// verdict from the previous page never lingers.
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading") {
    chrome.action.setBadgeText({ text: "", tabId });
  }
});
