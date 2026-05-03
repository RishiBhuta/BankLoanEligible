"""
Loan Prediction Model — Retrained with realistic class balance
"""
import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix, roc_auc_score
import joblib, os

np.random.seed(42)
N = 2000

gender          = np.random.choice(["Male","Female"], N, p=[0.78,0.22])
married         = np.random.choice(["Yes","No"],      N, p=[0.65,0.35])
dependents      = np.random.choice(["0","1","2","3+"],N, p=[0.57,0.17,0.16,0.10])
education       = np.random.choice(["Graduate","Not Graduate"], N, p=[0.78,0.22])
self_employed   = np.random.choice(["Yes","No"],      N, p=[0.14,0.86])
applicant_inc   = np.random.lognormal(8.0, 0.7, N).astype(int).clip(1000, 100000)
coapplicant_inc = (np.random.random(N) > 0.4) * np.random.lognormal(7.5, 0.6, N).astype(int)
loan_amount     = np.random.lognormal(4.9, 0.6, N).astype(int).clip(10, 700)
loan_term       = np.random.choice([120,180,240,300,360,480], N, p=[0.02,0.04,0.04,0.08,0.79,0.03])
credit_history  = np.random.choice([1.0, 0.0], N, p=[0.78, 0.22])
property_area   = np.random.choice(["Urban","Semiurban","Rural"], N, p=[0.33,0.38,0.29])

total_income  = applicant_inc + coapplicant_inc
emi_ratio     = (loan_amount * 1000) / (loan_term * total_income / 12 + 1)
income_score  = np.clip((total_income - 2500) / 10000, 0, 1)
emi_score     = np.clip(1 - emi_ratio / 2, 0, 1)

score = (
    0.35 * credit_history
  + 0.20 * emi_score
  + 0.15 * income_score
  + 0.08 * (education == "Graduate").astype(float)
  + 0.06 * (married == "Yes").astype(float)
  + 0.06 * (property_area == "Semiurban").astype(float)
  + 0.04 * (property_area == "Urban").astype(float)
  + 0.03 * (self_employed == "No").astype(float)
  + 0.03 * (dependents == "0").astype(float)
  - 0.05 * (dependents == "3+").astype(float)
  - 0.03 * (loan_amount > 300).astype(float)
  + 0.05 * np.random.random(N)
)

threshold   = np.percentile(score, 42)
loan_status = (score > threshold).astype(int)
print(f"Approval rate: {loan_status.mean():.1%}")

df = pd.DataFrame({
    "Gender": gender, "Married": married, "Dependents": dependents,
    "Education": education, "Self_Employed": self_employed,
    "ApplicantIncome": applicant_inc, "CoapplicantIncome": coapplicant_inc,
    "LoanAmount": loan_amount, "Loan_Amount_Term": loan_term,
    "Credit_History": credit_history, "Property_Area": property_area,
    "Loan_Status": loan_status,
})

os.makedirs("../data", exist_ok=True)
df.to_csv("../data/loan_data.csv", index=False)

NUMERIC      = ["ApplicantIncome","CoapplicantIncome","LoanAmount","Loan_Amount_Term","Credit_History"]
CATEGORICAL  = ["Gender","Married","Dependents","Education","Self_Employed","Property_Area"]
ALL_FEATURES = NUMERIC + CATEGORICAL

X = df[ALL_FEATURES]
y = df["Loan_Status"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

preprocessor = ColumnTransformer([
    ("num", StandardScaler(), NUMERIC),
    ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL),
])

pipeline = Pipeline([
    ("preprocessor", preprocessor),
    ("classifier", GradientBoostingClassifier(
        n_estimators=300, learning_rate=0.05, max_depth=4,
        min_samples_leaf=10, subsample=0.8, random_state=42,
    )),
])

pipeline.fit(X_train, y_train)

y_pred  = pipeline.predict(X_test)
y_proba = pipeline.predict_proba(X_test)[:,1]
acc = accuracy_score(y_test, y_pred)
auc = roc_auc_score(y_test, y_proba)
cv  = cross_val_score(pipeline, X, y, cv=5, scoring="accuracy")

print(f"\n{'='*50}")
print(f"  Accuracy   : {acc:.4f}  ({acc*100:.1f}%)")
print(f"  ROC-AUC    : {auc:.4f}")
print(f"  CV (5-fold): {cv.mean():.4f} +/- {cv.std():.4f}")
print(f"{'='*50}")
print(classification_report(y_test, y_pred, target_names=["Rejected","Approved"]))
print("Confusion Matrix:\n", confusion_matrix(y_test, y_pred))

bad = pd.DataFrame([{"ApplicantIncome":1500,"CoapplicantIncome":0,"LoanAmount":400,"Loan_Amount_Term":360,"Credit_History":0.0,"Gender":"Male","Married":"No","Dependents":"3+","Education":"Not Graduate","Self_Employed":"Yes","Property_Area":"Rural"}], columns=ALL_FEATURES)
print(f"\nObvious rejection -> pred={pipeline.predict(bad)[0]}  p_approve={pipeline.predict_proba(bad)[0][1]:.2%}")

good = pd.DataFrame([{"ApplicantIncome":9000,"CoapplicantIncome":3000,"LoanAmount":120,"Loan_Amount_Term":360,"Credit_History":1.0,"Gender":"Male","Married":"Yes","Dependents":"0","Education":"Graduate","Self_Employed":"No","Property_Area":"Semiurban"}], columns=ALL_FEATURES)
print(f"Obvious approval  -> pred={pipeline.predict(good)[0]}  p_approve={pipeline.predict_proba(good)[0][1]:.2%}")

joblib.dump(pipeline,     "pipeline.pkl")
joblib.dump(ALL_FEATURES, "features.pkl")
print("\nSaved: pipeline.pkl  features.pkl")
