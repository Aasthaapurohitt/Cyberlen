"""
Loads the trained model (if present) and turns a feature dict into
{riskScore, verdict, reasons}. Uses SHAP to find which features pushed the
prediction toward "phishing" and turns those into plain-English reasons.

If no trained model exists yet (model/phishing_model.joblib missing), falls
back to a transparent rule-based score so /predict works end-to-end from
day one — swap in the real model once model/train.py has been run.
"""

import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import shap

sys.path.append(str(Path(__file__).resolve().parent.parent))
from features.extract import FEATURE_COLUMNS  # noqa: E402

MODEL_PATH = Path(__file__).resolve().parent / "phishing_model.joblib"

# Human-readable phrasing for each feature, used when that feature is among
# the top SHAP contributors pushing the prediction toward "phishing".
REASON_TEMPLATES = {
    "domain_age_days": lambda v: (
        f"Domain registered only {v} day(s) ago" if 0 <= v < 30
        else "Domain age could not be determined"
    ),
    "ssl_valid": lambda v: "No valid SSL certificate presented" if v == 0 else None,
    "has_ip_host": lambda v: "URL uses a raw IP address instead of a domain name" if v == 1 else None,
    "num_at_symbols": lambda v: "URL contains an '@' symbol, often used to obscure the real destination" if v > 0 else None,
    "num_subdomains": lambda v: f"Unusually deep subdomain chain ({v} levels)" if v >= 3 else None,
    "num_redirects": lambda v: f"Page went through {v} redirect(s) before loading" if v >= 2 else None,
    "num_suspicious_keywords": lambda v: "URL contains wording commonly used in phishing (e.g. 'login', 'verify', 'secure')" if v > 0 else None,
    "num_forms_external_action": lambda v: "A form on this page submits data to a different domain" if v > 0 else None,
    "num_scripts_external_src": lambda v: f"Loads scripts from {v} external domain(s)" if v >= 3 else None,
    "is_https": lambda v: "Connection is not using HTTPS" if v == 0 else None,
    "url_length": lambda v: "Unusually long URL" if v > 75 else None,
    "num_hyphens": lambda v: "URL contains an unusually high number of hyphens" if v >= 4 else None,
}


class PhishingPredictor:
    def __init__(self):
        self.model = None
        self.feature_columns = FEATURE_COLUMNS
        self.explainer = None
        if MODEL_PATH.exists():
            bundle = joblib.load(MODEL_PATH)
            self.model = bundle["model"]
            self.feature_columns = bundle["feature_columns"]
            self.explainer = shap.TreeExplainer(self.model)

    @property
    def is_trained(self) -> bool:
        return self.model is not None

    def predict(self, features: dict) -> dict:
        if self.is_trained:
            return self._predict_with_model(features)
        return self._predict_with_heuristic(features)

    # --- Real model path (used once model/train.py has produced a model) ---
    def _predict_with_model(self, features: dict) -> dict:
        row = pd.DataFrame(
            [[features.get(col, -1) for col in self.feature_columns]],
            columns=self.feature_columns,
        )
        proba = self.model.predict_proba(row)[0][1]  # P(phishing)
        risk_score = round(float(proba) * 100)

        contributions = self._phishing_class_contributions(row)

        ranked = sorted(
            zip(self.feature_columns, contributions, row.iloc[0]),
            key=lambda t: abs(t[1]),
            reverse=True,
        )

        reasons = []
        for name, contribution, value in ranked:
            if contribution <= 0:
                continue  # only explain features pushing toward "phishing"
            template = REASON_TEMPLATES.get(name)
            if not template:
                continue
            text = template(value)
            if text:
                reasons.append(text)
            if len(reasons) == 3:
                break

        if not reasons:
            reasons = ["No strongly suspicious individual signals — score reflects overall pattern"]

        return {
            "riskScore": risk_score,
            "verdict": _verdict(risk_score),
            "reasons": reasons,
        }

    def _phishing_class_contributions(self, row: np.ndarray) -> np.ndarray:
        """
        Normalizes SHAP's output across versions into a flat 1D array of
        per-feature contributions toward the "phishing" (class 1) prediction
        for this single row.

        Different shap/sklearn version combinations return this differently:
        - older shap: a list [class0_array, class1_array], each (n_samples, n_features)
        - newer shap: a single ndarray shaped (n_samples, n_features, n_classes)
        - binary-output edge case: a single ndarray shaped (n_samples, n_features)
        """
        shap_values = self.explainer.shap_values(row)

        if isinstance(shap_values, list):
            class1 = shap_values[1] if len(shap_values) > 1 else shap_values[0]
            return np.asarray(class1)[0]

        shap_values = np.asarray(shap_values)
        if shap_values.ndim == 3:
            # (n_samples, n_features, n_classes) -> take row 0, phishing class (last axis, index 1)
            return shap_values[0, :, 1]
        # (n_samples, n_features)
        return shap_values[0]

    # --- Fallback used before a trained model exists ---
    def _predict_with_heuristic(self, features: dict) -> dict:
        score = 0
        reasons = []

        if features.get("has_ip_host"):
            score += 25
            reasons.append("URL uses a raw IP address instead of a domain name")
        if not features.get("ssl_valid"):
            score += 20
            reasons.append("No valid SSL certificate presented")
        if 0 <= features.get("domain_age_days", -1) < 30:
            score += 25
            reasons.append(f"Domain registered only {features['domain_age_days']} day(s) ago")
        if features.get("num_suspicious_keywords", 0) > 0:
            score += 15
            reasons.append("URL contains wording commonly used in phishing")
        if features.get("num_forms_external_action", 0) > 0:
            score += 15
            reasons.append("A form on this page submits data to a different domain")

        score = min(score, 100)
        if not reasons:
            reasons = ["No suspicious signals detected by rule-based fallback (model not yet trained)"]

        return {"riskScore": score, "verdict": _verdict(score), "reasons": reasons}


def _verdict(score: int) -> str:
    if score >= 70:
        return "high risk"
    if score >= 40:
        return "medium risk"
    if score >= 15:
        return "low risk"
    return "safe"


# Singleton instance imported by main.py
predictor = PhishingPredictor()
