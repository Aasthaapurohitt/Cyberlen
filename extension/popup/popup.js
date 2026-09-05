const views = {
  loading: document.getElementById("view-loading"),
  login: document.getElementById("view-login"),
  result: document.getElementById("view-result"),
  empty: document.getElementById("view-empty"),
  error: document.getElementById("view-error"),
};
const logoutBtn = document.getElementById("logout-btn");

function showView(name) {
  Object.values(views).forEach((v) => v.classList.add("hidden"));
  views[name].classList.remove("hidden");
  logoutBtn.classList.toggle("hidden", name !== "result" && name !== "empty");
}

function verdictClass(verdict) {
  return (verdict || "").replace(" ", "-").toLowerCase();
}

function renderResult(result) {
  document.getElementById("result-url").textContent = result.url;
  document.getElementById("result-score").textContent =
    result.riskScore != null ? `${result.riskScore}/100` : "—";

  const verdictEl = document.getElementById("result-verdict");
  verdictEl.textContent = result.verdict || "pending";
  verdictEl.className = `verdict mono ${verdictClass(result.verdict)}`;

  const list = document.getElementById("reasons-list");
  list.innerHTML = "";
  (result.reasons || []).forEach((reason) => {
    const li = document.createElement("li");
    li.textContent = reason;
    list.appendChild(li);
  });

  showView("result");
}

function loadActiveResult() {
  showView("loading");
  chrome.runtime.sendMessage({ type: "CYBERLENS_GET_ACTIVE_RESULT" }, (response) => {
    const result = response?.result;

    if (!result) {
      showView("empty");
      return;
    }
    if (result.status === "unauthenticated") {
      showView("login");
      return;
    }
    if (result.status === "error") {
      document.getElementById("error-detail").textContent = result.error || "Unknown error";
      showView("error");
      return;
    }
    renderResult(result);
  });
}

document.getElementById("login-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorEl = document.getElementById("login-error");
  errorEl.classList.add("hidden");

  chrome.runtime.sendMessage(
    { type: "CYBERLENS_LOGIN", credentials: { email, password } },
    (response) => {
      if (!response?.success) {
        errorEl.textContent = response?.error || "Login failed";
        errorEl.classList.remove("hidden");
        return;
      }
      // Re-scan the active tab now that we have a token, then refresh the popup.
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (tab?.id != null) {
          chrome.tabs.sendMessage(tab.id, { type: "CYBERLENS_RESCAN" }, () => {
            if (chrome.runtime.lastError) {
              console.debug("[CyberLens]", chrome.runtime.lastError.message);
            }
            setTimeout(loadActiveResult, 800); // give the scan a moment to complete
          });
        }
      });
    }
  );
});

logoutBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "CYBERLENS_LOGOUT" }, () => {
    showView("login");
  });
});

document.addEventListener("DOMContentLoaded", loadActiveResult);
