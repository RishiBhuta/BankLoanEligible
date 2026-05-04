"""
Loan Prediction API — Flask + SHAP
Always returns a score and explanation, never errors on valid form input.
"""
import os, warnings
warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd
import joblib
import shap
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

BASE_DIR     = os.path.dirname(__file__)
MODEL_DIR    = os.path.join(BASE_DIR, "model")

# ── Load artifacts ────────────────────────────────────────────────────────────
pipeline     = joblib.load(os.path.join(MODEL_DIR, "pipeline.pkl"))
feature_cols = joblib.load(os.path.join(MODEL_DIR, "features.pkl"))

NUMERIC_FEATURES     = ["ApplicantIncome", "CoapplicantIncome", "LoanAmount",
                         "Loan_Amount_Term", "Credit_History"]
CATEGORICAL_FEATURES = ["Gender", "Married", "Dependents", "Education",
                         "Self_Employed", "Property_Area"]

VALID_CATEGORIES = {
    "Gender":        ["Male", "Female"],
    "Married":       ["Yes", "No"],
    "Dependents":    ["0", "1", "2", "3+"],
    "Education":     ["Graduate", "Not Graduate"],
    "Self_Employed": ["Yes", "No"],
    "Property_Area": ["Urban", "Semiurban", "Rural"],
}

NUMERIC_DEFAULTS = {
    "ApplicantIncome":   5000.0,
    "CoapplicantIncome": 1500.0,
    "LoanAmount":        120.0,
    "Loan_Amount_Term":  360.0,
    "Credit_History":    1.0,
}

# ── SHAP explainer (once at startup) ─────────────────────────────────────────
clf          = pipeline.named_steps["classifier"]
preprocessor = pipeline.named_steps["preprocessor"]

_bg_raw         = pd.read_csv(os.path.join(MODEL_DIR, "../data/loan_data.csv"))[feature_cols]
_bg_transformed = preprocessor.transform(_bg_raw)
explainer       = shap.TreeExplainer(clf, data=_bg_transformed,
                                     feature_perturbation="interventional")

def _get_ohe_feature_names():
    ohe  = preprocessor.named_transformers_["cat"]
    cats = ohe.get_feature_names_out(CATEGORICAL_FEATURES)
    return list(NUMERIC_FEATURES) + list(cats)

TRANSFORMED_FEATURE_NAMES = _get_ohe_feature_names()
print(f"✅ SHAP explainer ready — {len(TRANSFORMED_FEATURE_NAMES)} features")

# ── Aggregate OHE SHAP → original feature names ───────────────────────────────
def aggregate_shap(shap_values_1d):
    result = {}
    idx    = 0
    for feat in NUMERIC_FEATURES:
        result[feat] = float(shap_values_1d[idx])
        idx += 1
    ohe = preprocessor.named_transformers_["cat"]
    for feat, cats in zip(CATEGORICAL_FEATURES, ohe.categories_):
        n_cats = len(cats)
        result[feat] = float(np.sum(shap_values_1d[idx: idx + n_cats]))
        idx += n_cats
    return result

# ── SHAP label helper ─────────────────────────────────────────────────────────
def shap_label(feature, value, shap_val):
    labels = {
        "Credit_History":     lambda v: "Good credit history" if v >= 1 else "Poor credit history",
        "ApplicantIncome":    lambda v: f"Income ₹{int(v):,}/mo",
        "CoapplicantIncome":  lambda v: f"Co-income ₹{int(v):,}/mo" if v > 0 else "No co-applicant income",
        "LoanAmount":         lambda v: f"Loan ₹{int(v)}K",
        "Loan_Amount_Term":   lambda v: f"{int(v)}-month term",
        "Gender":             lambda v: str(v),
        "Married":            lambda v: "Married" if v == "Yes" else "Single",
        "Dependents":         lambda v: f"{v} dependent(s)",
        "Education":          lambda v: str(v),
        "Self_Employed":      lambda v: "Self-employed" if v == "Yes" else "Salaried",
        "Property_Area":      lambda v: f"{v} area",
    }
    fn = labels.get(feature)
    return fn(value) if fn else str(value)

# ── /predict ──────────────────────────────────────────────────────────────────
@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json(force=True) or {}
        row  = {}

        for feat in NUMERIC_FEATURES:
            raw = data.get(feat)
            try:
                val = float(raw)
                if np.isnan(val) or np.isinf(val):
                    val = NUMERIC_DEFAULTS[feat]
            except (TypeError, ValueError):
                val = NUMERIC_DEFAULTS[feat]
            row[feat] = val

        for feat in CATEGORICAL_FEATURES:
            raw   = str(data.get(feat, "")).strip()
            valid = VALID_CATEGORIES[feat]
            row[feat] = raw if raw in valid else valid[0]

        df_input = pd.DataFrame([row], columns=feature_cols)

        # Predict
        pred_label   = int(pipeline.predict(df_input)[0])
        probas       = pipeline.predict_proba(df_input)[0]
        approve_prob = float(probas[1])
        reject_prob  = float(probas[0])

        # SHAP
        X_transformed = preprocessor.transform(df_input)
        shap_vals = explainer.shap_values(X_transformed, check_additivity=False)
        sv_arr        = np.array(shap_vals)

        if sv_arr.ndim == 3:
            sv = sv_arr[0, :, 1]
        elif sv_arr.ndim == 2:
            sv = sv_arr[0]
        else:
            sv = np.array(shap_vals[1])[0]

        agg = aggregate_shap(sv)
        top = sorted(agg.items(), key=lambda x: abs(x[1]), reverse=True)[:8]

        contributions = []
        for feat, shap_val in top:
            raw_val = row[feat]
            contributions.append({
                "feature":       feat,
                "value":         round(shap_val, 4),
                "impact":        "positive" if shap_val >= 0 else "negative",
                "display_label": shap_label(feat, raw_val, shap_val),
                "raw_value":     raw_val,
            })

        # Eligibility score: map approval probability → 300–900
        eligibility_score = int(300 + approve_prob * 600)
        if eligibility_score >= 750:   band = "Excellent"
        elif eligibility_score >= 700: band = "Good"
        elif eligibility_score >= 650: band = "Fair"
        elif eligibility_score >= 600: band = "Poor"
        else:                          band = "Very Poor"

        return jsonify({
            "prediction":          "Approved" if pred_label == 1 else "Rejected",
            "approve_probability": round(approve_prob * 100, 1),
            "reject_probability":  round(reject_prob  * 100, 1),
            "eligibility_score":   eligibility_score,
            "score_band":          band,
            "shap_contributions":  contributions,
        })

    except Exception as exc:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(exc)}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))