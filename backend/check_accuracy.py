"""
check_accuracy.py  —  Run this anytime to evaluate model performance.
Usage:  python check_accuracy.py
"""
import warnings; warnings.filterwarnings("ignore")
import joblib, pandas as pd, numpy as np
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.metrics import (accuracy_score, classification_report,
                             confusion_matrix, roc_auc_score)

print("\n" + "="*55)
print("   LOAN PREDICTION MODEL — ACCURACY REPORT")
print("="*55)

pipeline     = joblib.load("model/pipeline.pkl")
feature_cols = joblib.load("model/features.pkl")
df           = pd.read_csv("data/loan_data.csv")

X = df[feature_cols]
y = df["Loan_Status"]

# ── Hold-out split (same seed as training) ────────────────────────────────────
from sklearn.model_selection import train_test_split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y)

y_pred  = pipeline.predict(X_test)
y_proba = pipeline.predict_proba(X_test)[:, 1]

acc = accuracy_score(y_test, y_pred)
auc = roc_auc_score(y_test, y_proba)

# ── Cross-validation ──────────────────────────────────────────────────────────
cv = cross_val_score(pipeline, X, y, cv=StratifiedKFold(5, shuffle=True, random_state=42), scoring="accuracy")

print(f"\n  Test Accuracy   : {acc*100:.2f}%")
print(f"  ROC-AUC Score   : {auc:.4f}  (1.0 = perfect)")
print(f"  CV Accuracy     : {cv.mean()*100:.2f}% ± {cv.std()*100:.2f}%  (5-fold)")
print(f"\n  Training samples: {len(X_train)}")
print(f"  Test samples    : {len(X_test)}")
print(f"  Total features  : {len(feature_cols)}")

print(f"\n{'─'*55}")
print("  CLASSIFICATION REPORT")
print(f"{'─'*55}")
print(classification_report(y_test, y_pred, target_names=["Rejected","Approved"]))

cm = confusion_matrix(y_test, y_pred)
print(f"{'─'*55}")
print("  CONFUSION MATRIX")
print(f"{'─'*55}")
print(f"                 Predicted")
print(f"                 Rejected  Approved")
print(f"  Actual Rejected  {cm[0,0]:>5}     {cm[0,1]:>5}")
print(f"  Actual Approved  {cm[1,0]:>5}     {cm[1,1]:>5}")

# ── Sanity checks ─────────────────────────────────────────────────────────────
print(f"\n{'─'*55}")
print("  SANITY CHECKS (edge cases)")
print(f"{'─'*55}")

cases = [
    ("Ideal applicant",
     dict(ApplicantIncome=9000,CoapplicantIncome=3000,LoanAmount=120,
          Loan_Amount_Term=360,Credit_History=1.0,Gender="Male",Married="Yes",
          Dependents="0",Education="Graduate",Self_Employed="No",Property_Area="Semiurban")),
    ("Poor credit, high loan",
     dict(ApplicantIncome=1500,CoapplicantIncome=0,LoanAmount=450,
          Loan_Amount_Term=360,Credit_History=0.0,Gender="Male",Married="No",
          Dependents="3+",Education="Not Graduate",Self_Employed="Yes",Property_Area="Rural")),
    ("Medium profile",
     dict(ApplicantIncome=4500,CoapplicantIncome=1000,LoanAmount=150,
          Loan_Amount_Term=360,Credit_History=1.0,Gender="Female",Married="Yes",
          Dependents="1",Education="Graduate",Self_Employed="No",Property_Area="Urban")),
    ("Good income, no credit history",
     dict(ApplicantIncome=12000,CoapplicantIncome=5000,LoanAmount=200,
          Loan_Amount_Term=360,Credit_History=0.0,Gender="Male",Married="Yes",
          Dependents="0",Education="Graduate",Self_Employed="No",Property_Area="Urban")),
]

for label, vals in cases:
    row   = pd.DataFrame([vals], columns=feature_cols)
    pred  = pipeline.predict(row)[0]
    proba = pipeline.predict_proba(row)[0][1]
    icon  = "✅" if pred == 1 else "❌"
    print(f"  {icon} {label:<35} → {'Approved' if pred==1 else 'Rejected':8} ({proba:.1%})")

print(f"\n{'='*55}\n")
