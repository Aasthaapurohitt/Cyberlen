"""
Generates a SYNTHETIC sample dataset so `model/train.py` can be run
end-to-end immediately, before the real data collection (Phase 1 of the
plan: PhishTank + UCI Phishing Websites + Tranco) is done.

This is a stand-in, not real data — it fabricates feature rows with
distributions that loosely mimic phishing vs. legitimate pages (younger
domains, fewer valid SSL certs, more suspicious keywords for phishing
rows) so the training/eval pipeline has something to chew on. Do not
report metrics from this dataset in your capstone write-up; swap this
file out for `features.extract.extract_features()` run over real
PhishTank/UCI/Tranco URLs before training the model you actually submit.

Usage:
    python data/generate_sample_dataset.py --rows 1000 --out data/sample_dataset.csv
"""

import argparse
import sys
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.append(str(Path(__file__).resolve().parent.parent))
from features.extract import FEATURE_COLUMNS  # noqa: E402


def generate_row(is_phishing: bool, rng: np.random.Generator) -> dict:
    if is_phishing:
        return {
            "url_length": int(rng.normal(70, 20)),
            "num_dots": rng.integers(2, 6),
            "num_hyphens": rng.integers(0, 6),
            "num_digits": rng.integers(0, 10),
            "num_at_symbols": rng.choice([0, 0, 0, 1]),
            "num_subdomains": rng.integers(1, 4),
            "has_ip_host": rng.choice([0, 0, 0, 1]),
            "is_https": rng.choice([0, 0, 1]),
            "num_suspicious_keywords": rng.integers(1, 4),
            "domain_age_days": max(0, int(rng.normal(15, 20))),
            "ssl_valid": rng.choice([0, 0, 1]),
            "num_redirects": rng.integers(0, 4),
            "num_forms": rng.integers(1, 3),
            "num_forms_external_action": rng.choice([0, 1, 1]),
            "num_scripts": rng.integers(0, 8),
            "num_scripts_external_src": rng.integers(0, 5),
        }
    return {
        "url_length": int(rng.normal(35, 10)),
        "num_dots": rng.integers(1, 3),
        "num_hyphens": rng.integers(0, 2),
        "num_digits": rng.integers(0, 3),
        "num_at_symbols": 0,
        "num_subdomains": rng.integers(0, 2),
        "has_ip_host": 0,
        "is_https": 1,
        "num_suspicious_keywords": rng.choice([0, 0, 0, 1]),
        "domain_age_days": int(rng.normal(1800, 900)),
        "ssl_valid": 1,
        "num_redirects": rng.integers(0, 2),
        "num_forms": rng.integers(0, 2),
        "num_forms_external_action": 0,
        "num_scripts": rng.integers(2, 12),
        "num_scripts_external_src": rng.integers(0, 3),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--rows", type=int, default=1000)
    parser.add_argument("--out", default="data/sample_dataset.csv")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    rng = np.random.default_rng(args.seed)
    rows = []
    for _ in range(args.rows):
        is_phishing = rng.random() < 0.5
        row = generate_row(is_phishing, rng)
        row["domain_age_days"] = max(-1, row["domain_age_days"])
        row["url_length"] = max(5, row["url_length"])
        row["label"] = int(is_phishing)
        rows.append(row)

    df = pd.DataFrame(rows)[FEATURE_COLUMNS + ["label"]]
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(args.out, index=False)
    print(f"Wrote {len(df)} synthetic rows to {args.out}")
    print("Reminder: this is fabricated data for pipeline testing only —")
    print("replace with real PhishTank/UCI/Tranco-derived features before")
    print("training the model you actually submit.")


if __name__ == "__main__":
    main()
