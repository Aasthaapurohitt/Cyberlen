"""
Feature extraction for CyberLens.

Pulls together:
- Lexical URL features (length, symbols, subdomains, IP-as-host, etc.)
- Domain age via WHOIS
- SSL certificate validity
- Redirect chain length
- DOM-derived signals (forms posting off-domain, external script count)

All network-bound lookups (WHOIS, SSL, redirects) are wrapped in try/except
with short timeouts and safe fallback values, since these are the calls
most likely to fail or hang in a capstone demo environment (rate limits,
firewalls, offline testing).
"""

import re
import socket
import ssl
from datetime import datetime, timezone
from urllib.parse import urlparse

import requests
import tldextract
import whois

# Force tldextract to use its bundled public-suffix-list snapshot instead of
# fetching a fresh copy over the network on first use. Without this, a
# firewalled/offline environment (common in classroom/demo setups) prints a
# noisy traceback on every call before silently falling back anyway.
_tld_extractor = tldextract.TLDExtract(suffix_list_urls=())

SUSPICIOUS_KEYWORDS = [
    "login", "verify", "secure", "account", "update",
    "bank", "confirm", "signin", "webscr", "password",
]

REQUEST_TIMEOUT = 4  # seconds — keep short so a slow/offline site doesn't stall a scan


def _lexical_features(url: str) -> dict:
    parsed = urlparse(url if "://" in url else f"http://{url}")
    host = parsed.netloc or parsed.path
    ext = _tld_extractor(url)
    subdomain_count = len([p for p in ext.subdomain.split(".") if p])

    return {
        "url_length": len(url),
        "num_dots": url.count("."),
        "num_hyphens": url.count("-"),
        "num_digits": sum(c.isdigit() for c in url),
        "num_at_symbols": url.count("@"),
        "num_subdomains": subdomain_count,
        "has_ip_host": 1 if re.match(r"^\d{1,3}(\.\d{1,3}){3}$", host) else 0,
        "is_https": 1 if parsed.scheme == "https" else 0,
        "num_suspicious_keywords": sum(
            1 for kw in SUSPICIOUS_KEYWORDS if kw in url.lower()
        ),
        "registered_domain": ext.registered_domain,
    }


def _domain_age_days(registered_domain: str) -> int:
    """Returns domain age in days, or -1 if the WHOIS lookup fails."""
    try:
        info = whois.whois(registered_domain)
        created = info.creation_date
        if isinstance(created, list):
            created = created[0]
        if created is None:
            return -1
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        return (datetime.now(timezone.utc) - created).days
    except Exception:
        return -1


def _ssl_valid(hostname: str) -> int:
    """Returns 1 if a valid TLS cert is presented on port 443, else 0."""
    try:
        ctx = ssl.create_default_context()
        with socket.create_connection((hostname, 443), timeout=REQUEST_TIMEOUT) as sock:
            with ctx.wrap_socket(sock, server_hostname=hostname) as ssock:
                ssock.getpeercert()
        return 1
    except Exception:
        return 0


def _redirect_count(url: str) -> int:
    try:
        resp = requests.get(
            url if "://" in url else f"http://{url}",
            timeout=REQUEST_TIMEOUT,
            allow_redirects=True,
            headers={"User-Agent": "CyberLens-Scanner/1.0"},
        )
        return len(resp.history)
    except Exception:
        return 0


def _dom_features(url: str, forms: list, scripts: list) -> dict:
    forms = forms or []
    scripts = scripts or []
    page_domain = _tld_extractor(url).registered_domain

    external_forms = 0
    for f in forms:
        action = f.get("action", "") if isinstance(f, dict) else ""
        if action and _tld_extractor(action).registered_domain not in ("", page_domain):
            external_forms += 1

    external_scripts = 0
    for s in scripts:
        src = s.get("src", "") if isinstance(s, dict) else (s if isinstance(s, str) else "")
        if src and _tld_extractor(src).registered_domain not in ("", page_domain):
            external_scripts += 1

    return {
        "num_forms": len(forms),
        "num_forms_external_action": external_forms,
        "num_scripts": len(scripts),
        "num_scripts_external_src": external_scripts,
    }


def extract_features(url: str, dom_html: str = None, forms: list = None, scripts: list = None) -> dict:
    """
    Returns a flat dict of numeric features ready to feed to the model,
    plus a couple of human-readable fields (registered_domain, domain_age_days)
    that the explanation layer uses to phrase reasons.
    """
    lexical = _lexical_features(url)
    registered_domain = lexical.pop("registered_domain")

    domain_age_days = _domain_age_days(registered_domain)
    ssl_valid = _ssl_valid(registered_domain) if registered_domain else 0
    redirects = _redirect_count(url)
    dom = _dom_features(url, forms, scripts)

    features = {
        **lexical,
        "domain_age_days": domain_age_days,
        "ssl_valid": ssl_valid,
        "num_redirects": redirects,
        **dom,
    }
    features["_registered_domain"] = registered_domain  # metadata, dropped before model input
    return features


# Ordered list of columns the model was trained on — extract_features() must
# always produce exactly these keys (plus the _-prefixed metadata field).
FEATURE_COLUMNS = [
    "url_length", "num_dots", "num_hyphens", "num_digits", "num_at_symbols",
    "num_subdomains", "has_ip_host", "is_https", "num_suspicious_keywords",
    "domain_age_days", "ssl_valid", "num_redirects",
    "num_forms", "num_forms_external_action", "num_scripts", "num_scripts_external_src",
]
