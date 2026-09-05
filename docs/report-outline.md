# Report Outline — CyberLens

A starting skeleton for the Phase 5 report/writeup so it isn't drafted
from a blank page in week 12.

1. **Introduction** — the phishing problem, why browser-level detection,
   what CyberLens adds over existing tools (real-time, explainable).
2. **Related work** — pull from `docs/literature-review.md`.
3. **System architecture** — reuse the diagram and split from the
   original plan doc; explain why ML lives in an isolated Python
   service instead of embedded in Express (`README.md` at the repo
   root has this written out already — adapt, don't restart).
4. **Feature engineering** — walk through
   `ml-service/features/extract.py`: lexical URL features, WHOIS domain
   age, SSL validity, redirect chains, DOM signals. Explain *why* each
   category is a phishing signal.
5. **Model & training** — Random Forest vs. XGBoost choice
   (`ml-service/model/train.py`), evaluation metrics (F1, ROC-AUC) on
   the real dataset once trained.
6. **Explainability** — how SHAP turns feature contributions into the
   `reasons` array (`ml-service/model/predict.py`), with a couple of
   real example screenshots from the dashboard/popup.
7. **Implementation** — brief tour of each of the four pieces
   (extension, Express, ML service, dashboard) and how they talk to
   each other.
8. **Evaluation** — accuracy on held-out real data, plus qualitative
   testing against a handful of live/sandboxed phishing sites (Phase 5
   testing).
9. **Limitations & future work** — pull directly from the "Must-do next
   steps" section of the root `README.md` (dataset size, permission
   scope, rate limiting, etc.) — these are legitimate, honestly-stated
   limitations, which reads better in a report than pretending they
   don't exist.
10. **Conclusion**

## Demo video checklist (Phase 5)

- [ ] Install the extension, log in
- [ ] Browse to a known-safe site → show green/safe badge + popup
- [ ] Browse to a sandboxed/test phishing page → show red/high-risk
      badge, popup reasons
- [ ] Show the same scan appear in the dashboard's history table
- [ ] Expand a row to show the SHAP reasons in the dashboard
- [ ] Show the risk trend chart with a few scans logged
