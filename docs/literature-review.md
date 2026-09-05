# Literature Review — CyberLens

Phase 1 of the plan calls for 4–5 papers on phishing detection and
explainable AI (XAI). Track them here as you read so the report
write-up in Phase 5 isn't starting from zero.

| # | Title | Authors / Year | Key technique | Relevance to CyberLens | Notes |
|---|-------|-----------------|----------------|--------------------------|-------|
| 1 |       |                 |                |                          |       |
| 2 |       |                 |                |                          |       |
| 3 |       |                 |                |                          |       |
| 4 |       |                 |                |                          |       |
| 5 |       |                 |                |                          |       |

## Suggested starting points

- Search terms: "phishing detection machine learning", "URL-based
  phishing classifier", "SHAP explainable AI security", "lexical
  features phishing detection"
- Good venues to check: IEEE Xplore, ACM Digital Library, arXiv (cs.CR)
- Look for at least one paper specifically on **explainability in
  security ML** (SHAP/LIME) since that's what differentiates CyberLens
  from a plain classifier — it's a citable justification for the
  SHAP layer in `ml-service/model/predict.py`.

## Where this feeds into the report

- **Related work section**: summarize each paper's approach and how
  CyberLens's feature set (`ml-service/features/extract.py`) compares
  or draws from it.
- **Justification for model choice**: cite whichever papers compare
  Random Forest / XGBoost against other classifiers for phishing
  detection, to justify `model/train.py`'s default of Random Forest.
- **Justification for SHAP**: cite the XAI paper(s) to justify why
  explanations matter for a security tool, not just raw scores.
