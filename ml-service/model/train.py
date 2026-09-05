"""
Train the CyberLens phishing classifier.

Expects a CSV with one column per entry in features.extract.FEATURE_COLUMNS,
plus a binary `label` column (1 = phishing, 0 = legitimate).

Suggested data sources per the project plan:
- PhishTank (phishing URLs)
- UCI "Phishing Websites" dataset (pre-extracted features + labels)
- Tranco top sites list (legitimate URLs, run through features/extract.py
  yourself to build matching feature rows)

Usage:
    python model/train.py --data data/phishing_dataset.csv --algo rf --out model/phishing_model.joblib
    python model/train.py --data data/phishing_dataset.csv --algo xgb --out model/phishing_model.joblib
"""

import argparse
import sys
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, f1_score, roc_auc_score
from sklearn.model_selection import train_test_split

sys.path.append(str(Path(__file__).resolve().parent.parent))
from features.extract import FEATURE_COLUMNS  # noqa: E402


def load_dataset(path: str) -> tuple[pd.DataFrame, pd.Series]:
    df = pd.read_csv(path)
    missing = [c for c in FEATURE_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(
            f"Dataset is missing expected feature columns: {missing}. "
            f"Every row must have: {FEATURE_COLUMNS}"
        )
    if "label" not in df.columns:
        raise ValueError("Dataset must have a binary 'label' column (1=phishing, 0=legit).")

    X = df[FEATURE_COLUMNS].fillna(-1)
    y = df["label"].astype(int)
    return X, y


def build_model(algo: str):
    if algo == "rf":
        return RandomForestClassifier(
            n_estimators=300,
            max_depth=12,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1,
        )
    if algo == "xgb":
        from xgboost import XGBClassifier

        return XGBClassifier(
            n_estimators=300,
            max_depth=6,
            learning_rate=0.08,
            eval_metric="logloss",
            random_state=42,
        )
    raise ValueError(f"Unknown algo '{algo}'. Choose 'rf' or 'xgb'.")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", required=True, help="Path to training CSV")
    parser.add_argument("--algo", choices=["rf", "xgb"], default="rf")
    parser.add_argument("--out", default="model/phishing_model.joblib")
    parser.add_argument("--test-size", type=float, default=0.2)
    args = parser.parse_args()

    X, y = load_dataset(args.data)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=args.test_size, random_state=42, stratify=y
    )

    model = build_model(args.algo)
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    probs = model.predict_proba(X_test)[:, 1]

    print("\n=== Evaluation ===")
    print(classification_report(y_test, preds, target_names=["legit", "phishing"]))
    print(f"F1 score:  {f1_score(y_test, preds):.4f}")
    print(f"ROC-AUC:   {roc_auc_score(y_test, probs):.4f}")

    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": model, "feature_columns": FEATURE_COLUMNS, "algo": args.algo}, args.out)
    print(f"\nSaved model to {args.out}")


if __name__ == "__main__":
    main()
