import { useState } from "react";
import axios from "axios";

/* ─── Types ───────────────────────────────────────────────────────── */
interface ShapItem {
  feature: string;
  value: number;
  impact: "positive" | "negative";
  display_label: string;
  raw_value: number | string;
}
interface Result {
  prediction: "Approved" | "Rejected";
  approve_probability: number;
  reject_probability: number;
  eligibility_score: number;
  score_band: string;
  shap_contributions: ShapItem[];
}
interface FormState {
  Gender: string; Married: string; Dependents: string; Education: string;
  Self_Employed: string; ApplicantIncome: string; CoapplicantIncome: string;
  LoanAmount: string; Loan_Amount_Term: string; Credit_History: string; Property_Area: string;
}

const INIT: FormState = {
  Gender: "Male", Married: "Yes", Dependents: "0", Education: "Graduate",
  Self_Employed: "No", ApplicantIncome: "5000", CoapplicantIncome: "1500",
  LoanAmount: "120", Loan_Amount_Term: "360", Credit_History: "1", Property_Area: "Urban",
};

const LABELS: Record<string, string> = {
  Gender: "Gender", Married: "Marital Status", Dependents: "Dependents",
  Education: "Education", Self_Employed: "Employment", ApplicantIncome: "Applicant Income",
  CoapplicantIncome: "Co-applicant Income", LoanAmount: "Loan Amount",
  Loan_Amount_Term: "Loan Term", Credit_History: "Credit History", Property_Area: "Property Area",
};

const fieldCls =
  "w-full bg-stone-50 border border-stone-200 px-3 py-2.5 text-sm text-stone-900 font-sans outline-none focus:border-stone-900 focus:bg-white transition-all duration-150 rounded-none pr-8";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-2xs tracking-[0.14em] uppercase text-stone-400 mb-1.5 block">
      {children}
    </span>
  );
}

function scoreColor(score: number) {
  if (score >= 750) return { text: "text-emerald-500", bg: "bg-emerald-400" };
  if (score >= 700) return { text: "text-lime-500",    bg: "bg-lime-400"    };
  if (score >= 650) return { text: "text-amber-500",   bg: "bg-amber-400"   };
  if (score >= 600) return { text: "text-orange-500",  bg: "bg-orange-400"  };
  return              { text: "text-rose-500",          bg: "bg-rose-400"    };
}

export default function App() {
  const [form, setForm]     = useState<FormState>(INIT);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoad]  = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoad(true); setError(null); setResult(null);
    try {
      const response = await axios.post<Result>("https://bankloaneligible-production.up.railway.app/predict", {
        ...form,
        ApplicantIncome:   Number(form.ApplicantIncome)   || 0,
        CoapplicantIncome: Number(form.CoapplicantIncome) || 0,
        LoanAmount:        Number(form.LoanAmount)        || 0,
        Loan_Amount_Term:  Number(form.Loan_Amount_Term)  || 360,
        Credit_History:    Number(form.Credit_History)    || 0,
      });
      setResult(response.data);
    } catch (err: unknown) {
      setError(axios.isAxiosError(err)
        ? (err.response?.data?.error ?? err.message)
        : "Request failed. Is the backend running?");
    } finally { setLoad(false); }
  };

  const ok      = result?.prediction === "Approved";
  const maxShap = result
    ? Math.max(...result.shap_contributions.map(s => Math.abs(s.value)), 0.001)
    : 1;
  const sc       = result ? scoreColor(result.eligibility_score) : null;
  const scorePct = result ? ((result.eligibility_score - 300) / 600) * 100 : 0;

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">

      {/* ══ NAV ══════════════════════════════════════════════════════ */}
      <nav className="sticky top-0 z-30 bg-stone-50/90 backdrop-blur border-b border-stone-200">
        <div className="max-w-[1240px] mx-auto px-6 h-[52px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-stone-900 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="5" height="5" fill="white"/>
                <rect x="8" y="1" width="5" height="5" fill="white" opacity=".5"/>
                <rect x="1" y="8" width="5" height="5" fill="white" opacity=".5"/>
                <rect x="8" y="8" width="5" height="5" fill="white"/>
              </svg>
            </div>
            <span className="font-serif italic text-[17px] text-stone-900 tracking-tight">LoanIQ</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-pulse" />
            <span className="font-mono text-2xs text-stone-400 tracking-widest uppercase">System Live</span>
          </div>
        </div>
      </nav>

      {/* ══ HERO ═════════════════════════════════════════════════════ */}
      <section className="border-b border-stone-200 bg-white">
        <div className="max-w-[1240px] mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-2 gap-10 items-end">
          <div>
            <h1 className="font-serif italic text-[clamp(3rem,7vw,5.5rem)] leading-[0.9] text-stone-900 mb-5">
              Loan<br />Eligibility<br />Engine.
            </h1>
            <p className="font-sans text-sm text-stone-500 max-w-[360px] leading-relaxed">
              Enter your details and receive an instant AI-driven eligibility score,
              decision, and a full breakdown of every factor — good or bad.
            </p>
          </div>
          <div className="flex flex-col gap-4 md:items-end">
            {[
              { n: "80.5%", label: "Real-World Accuracy" },
              { n: "0.79",  label: "ROC-AUC Score"       },
              { n: "614",   label: "Real Loan Applications" },
            ].map(s => (
              <div key={s.label} className="flex items-baseline gap-3">
                <span className="font-serif italic text-[2.2rem] leading-none text-stone-900">{s.n}</span>
                <span className="font-mono text-2xs tracking-widest uppercase text-stone-400">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ MAIN ═════════════════════════════════════════════════════ */}
      <main className="flex-1 max-w-[1240px] w-full mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-start">

          {/* ── FORM ─────────────────────────────────────────────── */}
          <div className="bg-white border border-stone-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <span className="font-mono text-2xs tracking-[0.16em] uppercase text-stone-500">
                Application Form
              </span>
              <span className="font-mono text-2xs text-stone-300">#APL-2025</span>
            </div>

            <form onSubmit={submit} className="p-6">

              {/* § Personal */}
              <div className="flex items-center gap-3 mb-5">
                <span className="font-mono text-2xs tracking-widest text-stone-300 uppercase">01</span>
                <div className="flex-1 h-px bg-stone-100" />
                <span className="font-mono text-2xs tracking-widest text-stone-400 uppercase">Personal Details</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <div>
                  <Label>Gender</Label>
                  <select name="Gender" value={form.Gender} onChange={set} className={fieldCls}>
                    <option>Male</option><option>Female</option>
                  </select>
                </div>
                <div>
                  <Label>Marital Status</Label>
                  <select name="Married" value={form.Married} onChange={set} className={fieldCls}>
                    <option value="Yes">Married</option><option value="No">Single</option>
                  </select>
                </div>
                <div>
                  <Label>Dependents</Label>
                  <select name="Dependents" value={form.Dependents} onChange={set} className={fieldCls}>
                    {["0","1","2","3+"].map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Education</Label>
                  <select name="Education" value={form.Education} onChange={set} className={fieldCls}>
                    <option>Graduate</option>
                    <option value="Not Graduate">Not Graduate</option>
                  </select>
                </div>
                <div>
                  <Label>Employment Type</Label>
                  <select name="Self_Employed" value={form.Self_Employed} onChange={set} className={fieldCls}>
                    <option value="No">Salaried</option>
                    <option value="Yes">Self-Employed</option>
                  </select>
                </div>
                <div>
                  <Label>Property Area</Label>
                  <select name="Property_Area" value={form.Property_Area} onChange={set} className={fieldCls}>
                    {["Urban","Semiurban","Rural"].map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
              </div>

              {/* § Financial */}
              <div className="flex items-center gap-3 mb-5">
                <span className="font-mono text-2xs tracking-widest text-stone-300 uppercase">02</span>
                <div className="flex-1 h-px bg-stone-100" />
                <span className="font-mono text-2xs tracking-widest text-stone-400 uppercase">Financial Details</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div>
                  <Label>Applicant Income (₹ / month)</Label>
                  <input type="number" name="ApplicantIncome" value={form.ApplicantIncome}
                    onChange={set} min="0" placeholder="e.g. 5000" className={fieldCls} />
                </div>
                <div>
                  <Label>Co-applicant Income (₹ / month)</Label>
                  <input type="number" name="CoapplicantIncome" value={form.CoapplicantIncome}
                    onChange={set} min="0" placeholder="e.g. 1500" className={fieldCls} />
                </div>
                <div>
                  <Label>Loan Amount (₹ thousands)</Label>
                  <input type="number" name="LoanAmount" value={form.LoanAmount}
                    onChange={set} min="1" placeholder="e.g. 120" className={fieldCls} />
                </div>
                <div>
                  <Label>Loan Term (months)</Label>
                  <select name="Loan_Amount_Term" value={form.Loan_Amount_Term} onChange={set} className={fieldCls}>
                    {["120","180","240","300","360","480"].map(v => <option key={v}>{v} months</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <Label>Credit History</Label>
                  <select name="Credit_History" value={form.Credit_History} onChange={set} className={fieldCls}>
                    <option value="1">Good — No prior defaults (1.0)</option>
                    <option value="0">Poor — Has defaulted before (0.0)</option>
                  </select>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-stone-900 hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-mono text-2xs tracking-[0.2em] uppercase py-4 flex items-center justify-center gap-3 transition-colors duration-200">
                {loading ? (
                  <>
                    <svg className="spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="5.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
                      <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    Processing…
                  </>
                ) : "Run Assessment →"}
              </button>

              {error && (
                <div className="mt-4 bg-rose-50 border border-rose-200 px-4 py-3 font-sans text-sm text-rose-600 flex gap-2">
                  <span>⚠</span><span>{error}</span>
                </div>
              )}
            </form>
          </div>

          {/* ── RESULTS ──────────────────────────────────────────── */}
          <div className="flex flex-col gap-4 lg:sticky lg:top-[68px]">

            {!result && !loading && (
              <div className="bg-white border border-stone-200 border-dashed flex flex-col items-center justify-center gap-4 py-20 text-center px-8">
                <div className="w-10 h-10 bg-stone-100 flex items-center justify-center text-xl">📋</div>
                <p className="font-sans text-sm text-stone-400 leading-relaxed max-w-[200px]">
                  Complete the form to receive your eligibility score and decision.
                </p>
              </div>
            )}

            {loading && (
              <div className="bg-white border border-stone-200 flex flex-col items-center justify-center gap-4 py-20">
                <svg className="spin" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="#E8E6E1" strokeWidth="2"/>
                  <path d="M12 3A9 9 0 0 1 21 12" stroke="#111110" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span className="font-mono text-2xs tracking-widest uppercase text-stone-400">Evaluating…</span>
              </div>
            )}

            {result && sc && (
              <>
                {/* ── Eligibility Score Card ── */}
                <div className="bg-white border border-stone-200 fade-up fade-up-1">
                  <div className="px-5 py-3.5 border-b border-stone-100">
                    <span className="font-mono text-2xs tracking-[0.16em] uppercase text-stone-500">
                      Eligibility Score
                    </span>
                  </div>
                  <div className="px-5 py-5">
                    <div className="flex items-end justify-between mb-3">
                      <div>
                        <span className={`font-serif italic text-[3.5rem] leading-none ${sc.text}`}>
                          {result.eligibility_score}
                        </span>
                        <span className="font-mono text-2xs text-stone-400 ml-2 tracking-widest">/900</span>
                      </div>
                      <span className={`font-mono text-2xs tracking-widest uppercase px-2.5 py-1 border ${sc.text} border-current`}>
                        {result.score_band}
                      </span>
                    </div>
                    <div className="w-full h-[3px] bg-stone-100 mb-2">
                      <div className={`h-full shap-bar ${sc.bg}`} style={{ width: `${scorePct}%` }} />
                    </div>
                    <div className="flex justify-between font-mono text-2xs text-stone-300">
                      <span>300</span><span>500</span><span>700</span><span>900</span>
                    </div>
                    <p className="font-mono text-2xs text-stone-300 mt-3 leading-relaxed">
                      Based on model confidence — not an official CIBIL score.
                    </p>
                  </div>
                </div>

                {/* ── Decision Card ── */}
                <div className={`relative overflow-hidden noise fade-up fade-up-1 ${ok ? "bg-stone-900" : "bg-white border border-stone-200"}`}>
                  <div className={`h-1 w-full ${ok ? "bg-lime-400" : "bg-rose-400"}`} />
                  <div className="px-6 pt-5 pb-6">
                    <p className={`font-mono text-2xs tracking-[0.18em] uppercase mb-3 ${ok ? "text-stone-500" : "text-stone-400"}`}>
                      Decision
                    </p>
                    <div className="flex items-end justify-between gap-2 mb-4">
                      <h2 className={`font-serif italic text-[clamp(2.5rem,8vw,4rem)] leading-none ${ok ? "text-white" : "text-stone-900"}`}>
                        {result.prediction}
                      </h2>
                      <div className="text-right pb-1">
                        <div className={`font-serif italic text-[2.2rem] leading-none count-up ${ok ? "text-lime-400" : "text-rose-400"}`}>
                          {result.approve_probability}%
                        </div>
                        <div className={`font-mono text-2xs tracking-widest uppercase mt-1 ${ok ? "text-stone-500" : "text-stone-400"}`}>
                          approval odds
                        </div>
                      </div>
                    </div>
                    <div className={`w-full h-[2px] ${ok ? "bg-stone-700" : "bg-stone-100"}`}>
                      <div className={`h-full shap-bar ${ok ? "bg-lime-400" : "bg-rose-400"}`}
                        style={{ width: `${result.approve_probability}%` }} />
                    </div>
                    <p className={`font-mono text-2xs tracking-wide mt-3 ${ok ? "text-stone-600" : "text-stone-400"}`}>
                      {ok
                        ? "Your profile meets our lending criteria."
                        : "Your profile does not currently meet lending criteria."}
                    </p>
                  </div>
                </div>

                {/* ── Factor Analysis ── */}
                <div className="bg-white border border-stone-200 fade-up fade-up-2">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100">
                    <span className="font-mono text-2xs tracking-[0.16em] uppercase text-stone-500">
                      Factor Analysis
                    </span>
                    <div className="flex gap-3 font-mono text-2xs text-stone-400">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-lime-500" />Helps
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />Hurts
                      </span>
                    </div>
                  </div>
                  <div className="px-5 py-4 flex flex-col gap-4">
                    {result.shap_contributions.map((item, i) => {
                      const pct = (Math.abs(item.value) / maxShap) * 100;
                      const pos = item.impact === "positive";
                      return (
                        <div key={item.feature}
                          style={{ animationDelay: `${0.2 + i * 0.05}s` }}
                          className="fade-up">
                          <div className="flex justify-between items-start mb-1.5 gap-2">
                            <div>
                              <div className="font-sans text-sm text-stone-700 font-medium leading-tight">
                                {LABELS[item.feature] ?? item.feature}
                              </div>
                              <div className="font-mono text-2xs text-stone-400 mt-0.5">
                                {item.display_label}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className={`font-mono text-xs font-medium ${pos ? "text-lime-600" : "text-rose-500"}`}>
                                {item.value >= 0 ? "+" : ""}{item.value.toFixed(3)}
                              </span>
                              <div className={`font-mono text-2xs mt-0.5 ${pos ? "text-lime-500" : "text-rose-400"}`}>
                                {pos ? "↑ supports" : "↓ hurts"}
                              </div>
                            </div>
                          </div>
                          <div className="w-full h-[2px] bg-stone-100">
                            <div className={`h-full shap-bar ${pos ? "bg-lime-500" : "bg-rose-400"}`}
                              style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <p className="font-mono text-2xs text-stone-300 leading-relaxed fade-up fade-up-3 px-0.5">
                  SHAP values measure each factor's contribution. Positive values push toward approval, negative values push toward rejection.
                </p>
              </>
            )}
          </div>
        </div>
      </main>

      {/* ══ FOOTER ═══════════════════════════════════════════════════ */}
      <footer className="border-t border-stone-200 mt-10">
        <div className="max-w-[1240px] mx-auto px-6 py-5 flex items-center justify-between flex-wrap gap-4">
          <span className="font-mono text-2xs text-stone-300 tracking-wide uppercase">
            © 2025 LoanIQ · Demonstration Only
          </span>
          <div className="flex gap-2 flex-wrap">
            <span className="font-mono text-2xs tracking-wide text-stone-400 border border-stone-200 px-2.5 py-1">Gradient Boosting</span>
            <span className="font-mono text-2xs tracking-wide text-stone-400 border border-stone-200 px-2.5 py-1">SHAP XAI</span>
            <span className="font-mono text-2xs tracking-wide text-stone-400 border border-stone-200 px-2.5 py-1">80.5% Accuracy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}