import React, { useState } from 'react';
import { runScenario } from '../lib/scenarioCalculator';
import type { ScenarioResult } from '../lib/scenarioCalculator';
import './ScenarioCalculator.css';

type Frequency = 'monthly' | 'quarterly' | 'annually';

interface FormValues {
  initialPrincipal: string;
  additionalContribution: string;
  contributionFrequency: Frequency;
  duration: string;
  annualGrowthRate: string;
}

interface FormErrors {
  initialPrincipal?: string;
  additionalContribution?: string;
  duration?: string;
  annualGrowthRate?: string;
}

const INITIAL_FORM: FormValues = {
  initialPrincipal: '',
  additionalContribution: '',
  contributionFrequency: 'monthly',
  duration: '',
  annualGrowthRate: '',
};

function validateForm(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  const ip = parseFloat(values.initialPrincipal);
  if (!values.initialPrincipal) errors.initialPrincipal = 'Required.';
  else if (isNaN(ip) || ip < 0) errors.initialPrincipal = 'Must be a non-negative number.';

  const ac = parseFloat(values.additionalContribution);
  if (values.additionalContribution !== '' && (isNaN(ac) || ac < 0))
    errors.additionalContribution = 'Must be a non-negative number.';

  const d = parseFloat(values.duration);
  if (!values.duration) errors.duration = 'Required.';
  else if (isNaN(d) || d <= 0) errors.duration = 'Must be greater than 0.';
  else if (d > 100) errors.duration = 'Cannot exceed 100 years.';

  const gr = parseFloat(values.annualGrowthRate);
  if (!values.annualGrowthRate) errors.annualGrowthRate = 'Required.';
  else if (isNaN(gr) || gr < 0) errors.annualGrowthRate = 'Must be non-negative.';
  else if (gr > 100) errors.annualGrowthRate = 'Cannot exceed 100%.';

  return errors;
}

function fmt(n: number): string {
  return n.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((part / total) * 100)));
}

const ScenarioCalculator: React.FC = () => {
  const [form, setForm] = useState<FormValues>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [result, setResult] = useState<ScenarioResult | null>(null);

  // Contribution is "active" only when user enters a positive number
  const hasContributions = parseFloat(form.additionalContribution) > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (touched[name as keyof FormValues]) {
      // Re-validate on change once touched
      const updated = { ...form, [name]: value };
      const newErrors = validateForm(updated as FormValues);
      setErrors(prev => ({ ...prev, [name]: newErrors[name as keyof FormErrors] }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const newErrors = validateForm(form);
    setErrors(prev => ({ ...prev, [name]: newErrors[name as keyof FormErrors] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateForm(form);
    setErrors(validation);
    setTouched({ initialPrincipal: true, additionalContribution: true, duration: true, annualGrowthRate: true });
    if (Object.keys(validation).length > 0) return;

    setLoading(true);
    setApiError(null);
    try {
      const contrib = parseFloat(form.additionalContribution) || 0;
      const data = await runScenario({
        initialPrincipal: parseFloat(form.initialPrincipal),
        additionalContribution: contrib,
        contributionFrequency: hasContributions ? form.contributionFrequency : 'annually',
        duration: parseFloat(form.duration),
        annualGrowthRate: parseFloat(form.annualGrowthRate),
      });
      setResult(data);
    } catch (err: any) {
      setApiError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    setTouched({});
    setApiError(null);
    setResult(null);
  };

  const contributedPct = result ? pct(result.breakdown.totalContributed, result.finalPrincipal) : 0;
  const growthPct = result ? pct(Math.max(0, result.breakdown.totalGrowth), result.finalPrincipal) : 0;

  return (
    <div className="scenario-page animate-fade">

      {/* ── Page Header ─────────────────────── */}
      <div className="scenario-hero">
        <div className="scenario-hero-icon">📈</div>
        <div>
          <h1 className="scenario-title">Investment Scenario Calculator</h1>
          <p className="scenario-subtitle">
            Project the future value of an investment based on your contributions and growth assumptions.
          </p>
        </div>
      </div>

      <div className="scenario-body">

        {/* ── Left: Parameters form ────────── */}
        <section className="glass-card scenario-form-card">
          <h3 className="scenario-section-heading">Parameters</h3>

          <form onSubmit={handleSubmit} noValidate>

            {/* Row 1: Initial Principal (full width) */}
            <div className="sc-field">
              <label className="sc-label" htmlFor="initialPrincipal">
                Initial Principal
                <span className="sc-hint">Starting investment amount (SGD)</span>
              </label>
              <div className={`sc-input-group ${errors.initialPrincipal ? 'sc-input-error' : ''}`}>
                <span className="sc-affix sc-prefix">SGD</span>
                <input
                  id="initialPrincipal"
                  name="initialPrincipal"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="10,000"
                  value={form.initialPrincipal}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="sc-input"
                />
              </div>
              {errors.initialPrincipal && <p className="sc-error-msg">{errors.initialPrincipal}</p>}
            </div>

            {/* Row 2: Additional Contribution (full width) */}
            <div className="sc-field">
              <label className="sc-label" htmlFor="additionalContribution">
                Additional Contribution
                <span className="sc-hint">Regular top-up amount, leave blank or 0 for none</span>
              </label>
              <div className={`sc-input-group ${errors.additionalContribution ? 'sc-input-error' : ''}`}>
                <span className="sc-affix sc-prefix">SGD</span>
                <input
                  id="additionalContribution"
                  name="additionalContribution"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0 (optional)"
                  value={form.additionalContribution}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="sc-input"
                />
              </div>
              {errors.additionalContribution && <p className="sc-error-msg">{errors.additionalContribution}</p>}
            </div>

            {/* Row 3: Frequency — only shown when contribution > 0 */}
            {hasContributions && (
              <div className="sc-field sc-animate-in">
                <label className="sc-label" htmlFor="contributionFrequency">
                  Contribution Frequency
                  <span className="sc-hint">How often the top-up is made</span>
                </label>
                <div className="sc-select-wrapper">
                  <select
                    id="contributionFrequency"
                    name="contributionFrequency"
                    value={form.contributionFrequency}
                    onChange={handleChange}
                    className="sc-select"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annually">Annually</option>
                  </select>
                  <svg className="sc-select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
            )}

            {/* Duration — full width */}
            <div className="sc-field">
              <label className="sc-label" htmlFor="duration">
                Duration
                <span className="sc-hint">Investment horizon</span>
              </label>
              <div className={`sc-input-group ${errors.duration ? 'sc-input-error' : ''}`}>
                <input
                  id="duration"
                  name="duration"
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  placeholder="10"
                  value={form.duration}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="sc-input"
                />
                <span className="sc-affix sc-suffix">yrs</span>
              </div>
              {errors.duration && <p className="sc-error-msg">{errors.duration}</p>}
            </div>

            {/* Annual Growth Rate — full width */}
            <div className="sc-field">
              <label className="sc-label" htmlFor="annualGrowthRate">
                Annual Growth Rate
                <span className="sc-hint">Expected yearly return</span>
              </label>
              <div className={`sc-input-group ${errors.annualGrowthRate ? 'sc-input-error' : ''}`}>
                <input
                  id="annualGrowthRate"
                  name="annualGrowthRate"
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  placeholder="6"
                  value={form.annualGrowthRate}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="sc-input"
                />
                <span className="sc-affix sc-suffix">%</span>
              </div>
              {errors.annualGrowthRate && <p className="sc-error-msg">{errors.annualGrowthRate}</p>}
            </div>

            {/* API error */}
            {apiError && (
              <div className="sc-api-error">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {apiError}
              </div>
            )}

            {/* Actions */}
            <div className="sc-actions">
              <button type="submit" className="sc-btn-primary" disabled={loading}>
                {loading
                  ? <><span className="sc-spinner" /> Calculating…</>
                  : '📊 Calculate'
                }
              </button>
              {result && (
                <button type="button" className="sc-btn-ghost" onClick={handleReset}>
                  Reset
                </button>
              )}
            </div>
          </form>
        </section>

        {/* ── Right: Results ───────────────── */}
        <div className="scenario-results-col">
          {!result && !loading && (
            <div className="scenario-empty-state glass-card">
              <div className="scenario-empty-icon">💡</div>
              <p className="scenario-empty-title">Enter your parameters</p>
              <p className="scenario-empty-sub">Fill in the form on the left and click <strong>Calculate</strong> to see your projected investment value.</p>
            </div>
          )}

          {result && (
            <div className="sc-animate-in">
              {/* Final value hero */}
              <div className="glass-card sc-hero-card">
                <p className="sc-hero-label">Projected Final Value</p>
                <p className="sc-hero-value">SGD {fmt(result.finalPrincipal)}</p>
                <p className="sc-hero-sub">
                  {result.inputs.duration} yr{result.inputs.duration !== 1 ? 's' : ''}
                  {' · '}{result.inputs.annualGrowthRate}% p.a.
                  {hasContributions && ` · SGD ${fmt(result.inputs.additionalContribution)} ${result.inputs.contributionFrequency}`}
                </p>

                {/* Stacked bar */}
                <div className="sc-bar-wrap">
                  <div className="sc-bar-track">
                    <div className="sc-bar-seg sc-bar-capital" style={{ width: `${contributedPct}%` }} />
                    <div className="sc-bar-seg sc-bar-growth" style={{ width: `${growthPct}%` }} />
                  </div>
                  <div className="sc-bar-legend">
                    <span><span className="sc-dot sc-dot-capital" />Capital ({contributedPct}%)</span>
                    <span><span className="sc-dot sc-dot-growth" />Growth ({growthPct}%)</span>
                  </div>
                </div>
              </div>

              {/* Breakdown grid */}
              <div className="sc-breakdown-grid">
                <div className="glass-card sc-stat">
                  <span className="sc-stat-icon">🏦</span>
                  <span className="sc-stat-label">From Initial Principal</span>
                  <span className="sc-stat-val">SGD {fmt(result.breakdown.fromInitial)}</span>
                </div>
                {hasContributions && (
                  <div className="glass-card sc-stat">
                    <span className="sc-stat-icon">➕</span>
                    <span className="sc-stat-label">From Contributions</span>
                    <span className="sc-stat-val">SGD {fmt(result.breakdown.fromContributions)}</span>
                  </div>
                )}
                <div className="glass-card sc-stat">
                  <span className="sc-stat-icon">💵</span>
                  <span className="sc-stat-label">Total Capital In</span>
                  <span className="sc-stat-val">SGD {fmt(result.breakdown.totalContributed)}</span>
                </div>
                <div className={`glass-card sc-stat ${result.breakdown.totalGrowth >= 0 ? 'sc-stat-positive' : 'sc-stat-negative'}`}>
                  <span className="sc-stat-icon">{result.breakdown.totalGrowth >= 0 ? '📈' : '📉'}</span>
                  <span className="sc-stat-label">Total Growth</span>
                  <span className={`sc-stat-val ${result.breakdown.totalGrowth >= 0 ? 'sc-text-success' : 'sc-text-danger'}`}>
                    {result.breakdown.totalGrowth >= 0 ? '+' : ''}SGD {fmt(result.breakdown.totalGrowth)}
                  </span>
                </div>
              </div>

              <p className="sc-disclaimer">
                This projection assumes a constant annual growth rate compounded at the selected frequency. For illustrative purposes only. Not financial advice.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScenarioCalculator;
