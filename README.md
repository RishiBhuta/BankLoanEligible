# 🏦 LoanIQ — AI-Powered Loan Eligibility Engine

<div align="center">

![LoanIQ Banner](https://img.shields.io/badge/LoanIQ-Credit%20Assessment%20Platform-1a1a1a?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB4PSIyIiB5PSIyIiB3aWR0aD0iOSIgaGVpZ2h0PSI5IiBmaWxsPSJ3aGl0ZSIvPjxyZWN0IHg9IjEzIiB5PSIyIiB3aWR0aD0iOSIgaGVpZ2h0PSI5IiBmaWxsPSJ3aGl0ZSIgb3BhY2l0eT0iMC41Ii8+PHJlY3QgeD0iMiIgeT0iMTMiIHdpZHRoPSI5IiBoZWlnaHQ9IjkiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjUiLz48cmVjdCB4PSIxMyIgeT0iMTMiIHdpZHRoPSI5IiBoZWlnaHQ9IjkiIGZpbGw9IndoaXRlIi8+PC9zdmc+)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-000000?style=for-the-badge&logo=vercel)](https://bank-loan-eligible.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Railway-0B0D0E?style=for-the-badge&logo=railway)](https://bankloaneligible-production.up.railway.app/health)
[![GitHub](https://img.shields.io/badge/GitHub-RishiBhuta-181717?style=for-the-badge&logo=github)](https://github.com/RishiBhuta/BankLoanEligible)

**An intelligent loan eligibility assessment system powered by Machine Learning and Explainable AI**

[View Demo](https://bank-loan-eligible.vercel.app) · [Report Bug](https://github.com/RishiBhuta/BankLoanEligible/issues) · [Request Feature](https://github.com/RishiBhuta/BankLoanEligible/issues)

</div>

---

## 📋 Table of Contents

- [About The Project](#about-the-project)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Model Details](#model-details)
- [Deployment](#deployment)
- [License](#license)

---

## 🎯 About The Project

LoanIQ is a full-stack web application that uses Machine Learning to predict loan eligibility in real time. Unlike black-box models, LoanIQ uses **SHAP (SHapley Additive exPlanations)** to explain every decision — showing users exactly which factors helped or hurt their application.

The model is trained on **614 real loan applications** from a financial institution, making predictions grounded in actual lending data rather than synthetic examples.

> ⚠️ **Disclaimer:** This is a demonstration project. The eligibility score shown is based on model confidence and is **not** an official CIBIL score or financial advice.

---

## ✨ Features

- 🤖 **Real-time AI Prediction** — Instant loan eligibility decision powered by Gradient Boosting
- 🔍 **Explainable AI** — SHAP values show exactly why a decision was made
- 📊 **Eligibility Score** — 300–900 score range with band ratings (Excellent / Good / Fair / Poor)
- 📱 **Responsive Design** — Works seamlessly on desktop and mobile
- ⚡ **Fast API** — Flask REST backend with optimised SHAP explainer loaded once at startup
- 🎨 **Minimal UI** — Clean, professional interface built with Tailwind CSS

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 + TypeScript | UI Framework |
| Vite | Build Tool |
| Tailwind CSS | Styling |
| Axios | HTTP Client |
| Playfair Display + Inter | Typography |

### Backend
| Technology | Purpose |
|------------|---------|
| Python 3.11 | Runtime |
| Flask | Web Framework |
| Scikit-learn | ML Pipeline |
| Gradient Boosting | Prediction Model |
| SHAP | Explainability |
| Pandas + NumPy | Data Processing |
| Joblib | Model Serialisation |
| Gunicorn | Production Server |

### Deployment
| Service | Purpose |
|---------|---------|
| Vercel | Frontend Hosting |
| Railway | Backend Hosting |
| GitHub | Version Control |

---

## 📁 Project Structure

```
BankLoanEligible/
├── backend/
│   ├── app.py                  # Flask API server
│   ├── requirements.txt        # Python dependencies
│   ├── check_accuracy.py       # Model evaluation script
│   ├── .python-version         # Python 3.11 for Railway
│   ├── model/
│   │   ├── train_model.py      # Model training script
│   │   ├── pipeline.pkl        # Trained ML pipeline
│   │   └── features.pkl        # Feature column order
│   └── data/
│       └── loan_data.csv       # Real Kaggle loan dataset (614 rows)
└── frontend/
    ├── src/
    │   ├── App.tsx             # Main React component
    │   ├── index.css           # Global styles + Tailwind
    │   └── main.tsx            # Entry point
    ├── tailwind.config.js      # Tailwind configuration
    ├── vite.config.ts          # Vite configuration
    └── package.json            # Node dependencies
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11
- Node.js 18+
- Git

### Local Setup

**1. Clone the repository**
```bash
git clone https://github.com/RishiBhuta/BankLoanEligible.git
cd BankLoanEligible
```

**2. Set up the backend**
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Train the model
cd model
python train_model.py
cd ..

# Start the backend server
python app.py
# → Running on http://localhost:5000
```

**3. Set up the frontend**
```bash
# Open a new terminal
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
# → Running on http://localhost:5173
```

**4. Open your browser**
```
http://localhost:5173
```

> 💡 Make sure both terminals are running simultaneously — one for the backend and one for the frontend.

---

## 📡 API Reference

### Check Health
```http
GET /health
```
**Response:**
```json
{
  "status": "ok"
}
```

### Predict Loan Eligibility
```http
POST /predict
Content-Type: application/json
```

**Request Body:**
```json
{
  "Gender": "Male",
  "Married": "Yes",
  "Dependents": "0",
  "Education": "Graduate",
  "Self_Employed": "No",
  "ApplicantIncome": 5000,
  "CoapplicantIncome": 1500,
  "LoanAmount": 120,
  "Loan_Amount_Term": 360,
  "Credit_History": 1.0,
  "Property_Area": "Urban"
}
```

**Response:**
```json
{
  "prediction": "Approved",
  "approve_probability": 96.7,
  "reject_probability": 3.3,
  "eligibility_score": 880,
  "score_band": "Excellent",
  "shap_contributions": [
    {
      "feature": "Credit_History",
      "value": 2.2545,
      "impact": "positive",
      "display_label": "Good credit history",
      "raw_value": 1.0
    }
  ]
}
```

---

## 🧠 Model Details

### Dataset
- **Source:** Kaggle Loan Prediction Dataset
- **Size:** 614 real loan applications
- **Approval Rate:** 68.7% (realistic class distribution)
- **Missing Values:** Handled with median/mode imputation

### Algorithm
**Gradient Boosting Classifier** with:
- 300 estimators (trees)
- Learning rate: 0.05
- Max depth: 4
- Subsample: 0.8

### Preprocessing Pipeline
```
Input Features
     │
     ├── Numeric (5 features)
     │   └── SimpleImputer (median) → StandardScaler
     │
     └── Categorical (6 features)
         └── SimpleImputer (most_frequent) → OneHotEncoder
     │
     └── Gradient Boosting Classifier
```

### Performance
| Metric | Score |
|--------|-------|
| Test Accuracy | 80.5% |
| ROC-AUC | 0.79 |
| CV Accuracy (5-fold) | 76.5% ± 2.4% |
| Precision (Approved) | 84% |
| Recall (Approved) | 88% |

### Input Features
| Feature | Type | Description |
|---------|------|-------------|
| Gender | Categorical | Male / Female |
| Married | Categorical | Yes / No |
| Dependents | Categorical | 0 / 1 / 2 / 3+ |
| Education | Categorical | Graduate / Not Graduate |
| Self_Employed | Categorical | Yes / No |
| Property_Area | Categorical | Urban / Semiurban / Rural |
| ApplicantIncome | Numeric | Monthly income (₹) |
| CoapplicantIncome | Numeric | Co-applicant monthly income (₹) |
| LoanAmount | Numeric | Loan amount in thousands (₹) |
| Loan_Amount_Term | Numeric | Repayment term in months |
| Credit_History | Numeric | 1.0 = Good, 0.0 = Poor |

### Eligibility Score
The eligibility score (300–900) is derived from the model's approval probability:
```
eligibility_score = 300 + (approve_probability × 600)
```
This maps onto the CIBIL score range for intuitive interpretation but is **not** an official credit score.

---

## 🌐 Deployment

### Frontend — Vercel
1. Connect GitHub repo to Vercel
2. Set **Root Directory** to `frontend`
3. Vercel auto-detects Vite and deploys

### Backend — Railway
1. Connect GitHub repo to Railway
2. Set **Root Directory** to `backend`
3. Set **Build Command:** `pip install -r requirements.txt && cd model && python train_model.py && cd ..`
4. Set **Start Command:** `gunicorn app:app --bind 0.0.0.0:$PORT`

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">

Built with ❤️ by [Rishi Bhuta](https://github.com/RishiBhuta)

⭐ Star this repo if you found it helpful!

</div>
