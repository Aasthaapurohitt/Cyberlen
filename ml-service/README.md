# CyberLens — Python ML Microservice

FastAPI service that extracts features from a scanned page, runs the
phishing classifier, and returns a SHAP-explained risk report. Called
internally by the Express backend at `POST /predict` — never exposed to
the extension or dashboard directly.

## Setup

```bash
cd ml-service
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py       # runs on http://localhost:8000
```

## Endpoints

| Method | Route     | Description                                  |
|--------|-----------|-----------------------------------------------|
| GET    | /health   | Returns `{status, model_loaded}`              |
| POST   | /predict  | Extract features, score, explain, return JSON |

### POST /predict — request
```json
{
  "url": "https://example.com/login",
  "domHtml": "<html>...</html>",
  "forms": [{"action": "https://attacker.example/collect", "method": "POST"}],
  "scripts": [{"src": "https://cdn.trusted.com/lib.js"}]
}
```

### POST /predict — response
```json
{
  "riskScore": 82,
  "verdict": "high risk",
  "reasons": [
    "Domain registered only 4 day(s) ago",
    "A form on this page submits data to a different domain",
    "No valid SSL certificate presented"
  ]
}
```

## Training the real model

Before `model/train.py` has been run, `/predict` uses a transparent
**rule-based fallback** (see `model/predict.py::_predict_with_heuristic`)
so the rest of the pipeline (extension → Express → dashboard) is fully
testable from day one.

1. Collect data per the plan: PhishTank + UCI Phishing Websites dataset
   for phishing examples, Tranco top sites for legitimate examples.
2. Run every URL through `features.extract.extract_features()` to build a
   CSV with the columns in `features.extract.FEATURE_COLUMNS` plus a
   `label` column (1 = phishing, 0 = legit).

   **Want to test the pipeline before real data is ready?**
   `data/generate_sample_dataset.py` fabricates a synthetic CSV in the
   right shape so you can prove `train.py` and `predict.py` work end to
   end today:
   ```bash
   python data/generate_sample_dataset.py --rows 1000 --out data/sample_dataset.csv
   ```
   This is fake data for pipeline testing only — don't report its
   metrics in your write-up, and replace it with the real dataset before
   training the model you submit.
3. Train:
   ```bash
   python model/train.py --data data/phishing_dataset.csv --algo rf --out model/phishing_model.joblib
   ```
4. Restart the service — `model/predict.py` auto-loads
   `model/phishing_model.joblib` if present and switches from the
   heuristic to the real model + SHAP explanations automatically.

## Feature set

Defined once in `features/extract.py::FEATURE_COLUMNS` and shared by
`train.py` and `predict.py` so training and inference never drift out of
sync:

- Lexical: URL length, dot/hyphen/digit counts, `@` symbol, subdomain
  depth, IP-as-host, HTTPS, suspicious-keyword count
- Domain: age in days (WHOIS), SSL certificate validity
- Network: redirect chain length
- DOM: form count / external-action forms, script count / external-src
  scripts

## Notes

- WHOIS, SSL, and redirect lookups are best-effort with short timeouts —
  a failed lookup returns a safe sentinel value rather than crashing the
  request, since these are the calls most likely to fail during a live
  demo (rate limits, offline sites, corporate firewalls).
- `xgboost` is in `requirements.txt` for `--algo xgb`; the default is
  `rf` (Random Forest), which is what `SHAP.TreeExplainer` was tuned
  against in `predict.py`.
