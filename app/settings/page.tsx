'use client';

import { useEffect, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AssetSchema, InsuranceSchema, type AssetInput, type InsuranceInput } from '@/lib/schemas';
import type { Asset, Insurance } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DataTable from '@/components/DataTable';
import { computeNewRegimeTax, computeOldRegimeTax } from '@/lib/tax';

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export default function SettingsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [insurance, setInsurance] = useState<Insurance[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingAsset, setDeletingAsset] = useState<string | null>(null);
  const [deletingInsurance, setDeletingInsurance] = useState<string | null>(null);
  const [submittingAsset, setSubmittingAsset] = useState(false);
  const [submittingInsurance, setSubmittingInsurance] = useState(false);
  const [assetError, setAssetError] = useState('');
  const [insuranceError, setInsuranceError] = useState('');

  const assetForm = useForm<AssetInput>({
    resolver: zodResolver(AssetSchema) as Resolver<AssetInput>,
    defaultValues: { asset_type: 'property' },
  });
  const insuranceForm = useForm<InsuranceInput>({
    resolver: zodResolver(InsuranceSchema) as Resolver<InsuranceInput>,
    defaultValues: { policy_type: 'term_life' },
  });

  async function fetchAll() {
    setLoading(true);
    const [aRes, iRes] = await Promise.all([fetch('/api/assets'), fetch('/api/insurance')]);
    const [aJson, iJson] = await Promise.all([
      aRes.json() as Promise<{ ok: boolean; data?: Asset[] }>,
      iRes.json() as Promise<{ ok: boolean; data?: Insurance[] }>,
    ]);
    if (aJson.ok && aJson.data) setAssets(aJson.data);
    if (iJson.ok && iJson.data) setInsurance(iJson.data);
    setLoading(false);
  }

  useEffect(() => {
    void fetchAll();
  }, []);

  async function onAssetSubmit(data: AssetInput) {
    setSubmittingAsset(true);
    setAssetError('');
    const res = await fetch('/api/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = (await res.json()) as { ok: boolean; error?: string };
    if (!json.ok) {
      setAssetError(json.error ?? 'Failed to save');
      setSubmittingAsset(false);
      return;
    }
    assetForm.reset({ asset_type: 'property' });
    await fetchAll();
    setSubmittingAsset(false);
  }

  async function onInsuranceSubmit(data: InsuranceInput) {
    setSubmittingInsurance(true);
    setInsuranceError('');
    const res = await fetch('/api/insurance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = (await res.json()) as { ok: boolean; error?: string };
    if (!json.ok) {
      setInsuranceError(json.error ?? 'Failed to save');
      setSubmittingInsurance(false);
      return;
    }
    insuranceForm.reset({ policy_type: 'term_life' });
    await fetchAll();
    setSubmittingInsurance(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>

      {/* ── Assets ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Asset</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={assetForm.handleSubmit(onAssetSubmit)}
            noValidate
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <div className="space-y-1">
              <Label htmlFor="asset_type">Asset Type</Label>
              <Select
                defaultValue="property"
                onValueChange={(v) =>
                  assetForm.setValue('asset_type', v as AssetInput['asset_type'])
                }
              >
                <SelectTrigger id="asset_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="property">Property</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="vehicle">Vehicle</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="asset_desc">Description</Label>
              <Input
                id="asset_desc"
                placeholder="e.g. 2BHK Flat - Andheri"
                {...assetForm.register('description')}
              />
              {assetForm.formState.errors.description && (
                <p className="text-sm text-red-600" role="alert">
                  {assetForm.formState.errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="current_val">Current Market Value (₹)</Label>
              <Input
                id="current_val"
                type="number"
                min={0}
                placeholder="8000000"
                {...assetForm.register('current_value_inr')}
              />
              {assetForm.formState.errors.current_value_inr && (
                <p className="text-sm text-red-600" role="alert">
                  {assetForm.formState.errors.current_value_inr.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="purchase_val">Purchase Price (₹)</Label>
              <Input
                id="purchase_val"
                type="number"
                min={0}
                placeholder="5000000"
                {...assetForm.register('purchase_value_inr')}
              />
              {assetForm.formState.errors.purchase_value_inr && (
                <p className="text-sm text-red-600" role="alert">
                  {assetForm.formState.errors.purchase_value_inr.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="purchase_date_asset">Purchase Date</Label>
              <Input
                id="purchase_date_asset"
                type="date"
                {...assetForm.register('purchase_date')}
              />
              {assetForm.formState.errors.purchase_date && (
                <p className="text-sm text-red-600" role="alert">
                  {assetForm.formState.errors.purchase_date.message}
                </p>
              )}
            </div>

            {assetError && (
              <p className="text-sm text-red-600 col-span-full" role="alert">
                {assetError}
              </p>
            )}
            <div className="col-span-full">
              <Button type="submit" disabled={submittingAsset}>
                {submittingAsset ? 'Saving…' : 'Add Asset'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Assets</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : (
            <DataTable
              rows={assets}
              columns={[
                { key: 'description', label: 'Asset' },
                { key: 'asset_type', label: 'Type' },
                {
                  key: 'current_value_inr',
                  label: 'Current Value',
                  format: (v) => INR.format(Number(v)),
                },
                {
                  key: 'purchase_value_inr',
                  label: 'Purchase Price',
                  format: (v) => INR.format(Number(v)),
                },
              ]}
              onDelete={async (id) => {
                setDeletingAsset(id);
                await fetch(`/api/assets?id=${id}`, { method: 'DELETE' });
                await fetchAll();
                setDeletingAsset(null);
              }}
              deleting={deletingAsset}
            />
          )}
        </CardContent>
      </Card>

      {/* ── Insurance ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Insurance Policy</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={insuranceForm.handleSubmit(onInsuranceSubmit)}
            noValidate
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <div className="space-y-1">
              <Label htmlFor="policy_type">Policy Type</Label>
              <Select
                defaultValue="term_life"
                onValueChange={(v) =>
                  insuranceForm.setValue('policy_type', v as InsuranceInput['policy_type'])
                }
              >
                <SelectTrigger id="policy_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="term_life">Term Life</SelectItem>
                  <SelectItem value="health">Health Insurance</SelectItem>
                  <SelectItem value="vehicle">Vehicle</SelectItem>
                  <SelectItem value="home">Home / Property</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="insurer_name">Insurer Name</Label>
              <Input
                id="insurer_name"
                placeholder="e.g. LIC, Star Health"
                {...insuranceForm.register('insurer_name')}
              />
              {insuranceForm.formState.errors.insurer_name && (
                <p className="text-sm text-red-600" role="alert">
                  {insuranceForm.formState.errors.insurer_name.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="sum_assured">Sum Assured / Cover (₹)</Label>
              <Input
                id="sum_assured"
                type="number"
                min={0}
                placeholder="10000000"
                {...insuranceForm.register('sum_assured_inr')}
              />
              {insuranceForm.formState.errors.sum_assured_inr && (
                <p className="text-sm text-red-600" role="alert">
                  {insuranceForm.formState.errors.sum_assured_inr.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="annual_premium">Annual Premium (₹)</Label>
              <Input
                id="annual_premium"
                type="number"
                min={0}
                placeholder="15000"
                {...insuranceForm.register('annual_premium_inr')}
              />
              {insuranceForm.formState.errors.annual_premium_inr && (
                <p className="text-sm text-red-600" role="alert">
                  {insuranceForm.formState.errors.annual_premium_inr.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="members_covered">Members Covered</Label>
              <Input
                id="members_covered"
                placeholder="e.g. Self, Spouse, 2 children"
                {...insuranceForm.register('members_covered')}
              />
              {insuranceForm.formState.errors.members_covered && (
                <p className="text-sm text-red-600" role="alert">
                  {insuranceForm.formState.errors.members_covered.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="expiry_date">Expiry / Renewal Date</Label>
              <Input id="expiry_date" type="date" {...insuranceForm.register('expiry_date')} />
              {insuranceForm.formState.errors.expiry_date && (
                <p className="text-sm text-red-600" role="alert">
                  {insuranceForm.formState.errors.expiry_date.message}
                </p>
              )}
            </div>

            {insuranceError && (
              <p className="text-sm text-red-600 col-span-full" role="alert">
                {insuranceError}
              </p>
            )}
            <div className="col-span-full">
              <Button type="submit" disabled={submittingInsurance}>
                {submittingInsurance ? 'Saving…' : 'Add Policy'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Insurance Policies</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : (
            <DataTable
              rows={insurance}
              columns={[
                { key: 'insurer_name', label: 'Insurer' },
                { key: 'policy_type', label: 'Type' },
                { key: 'sum_assured_inr', label: 'Cover', format: (v) => INR.format(Number(v)) },
                {
                  key: 'annual_premium_inr',
                  label: 'Premium / yr',
                  format: (v) => INR.format(Number(v)),
                },
                { key: 'expiry_date', label: 'Expiry' },
              ]}
              onDelete={async (id) => {
                setDeletingInsurance(id);
                await fetch(`/api/insurance?id=${id}`, { method: 'DELETE' });
                await fetchAll();
                setDeletingInsurance(null);
              }}
              deleting={deletingInsurance}
            />
          )}
        </CardContent>
      </Card>

      {/* ── Tax Regime Comparison ── */}
      <TaxRegimeCompare />

      {/* ── Risk Profile ── */}
      <RiskProfileQuestionnaire />
    </div>
  );
}

function TaxRegimeCompare() {
  const [gross, setGross] = useState('');
  const [section80C, setSection80C] = useState('150000');
  const [section80D, setSection80D] = useState('25000');
  const [homeLoan, setHomeLoan] = useState('0');
  const [nps, setNps] = useState('0');

  const INR_FMT = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

  const income = Number(gross);
  const newResult = income > 0 ? computeNewRegimeTax(income) : null;
  const oldResult =
    income > 0
      ? computeOldRegimeTax(income, {
          section80C: Number(section80C),
          section80D: Number(section80D),
          homeLoanInterest24b: Number(homeLoan),
          npsAdditional80CCD: Number(nps),
        })
      : null;
  const recommended =
    newResult && oldResult
      ? newResult.totalTax <= oldResult.totalTax
        ? 'New Regime'
        : 'Old Regime'
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tax Regime Comparison (FY 2025-26)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: 'Annual Gross Income (₹)', value: gross, set: setGross, ph: '1500000' },
            {
              label: 'Section 80C (₹, max ₹1.5L)',
              value: section80C,
              set: setSection80C,
              ph: '150000',
            },
            {
              label: 'Section 80D (₹, max ₹25K)',
              value: section80D,
              set: setSection80D,
              ph: '25000',
            },
            { label: 'Home Loan Interest 24(b) (₹)', value: homeLoan, set: setHomeLoan, ph: '0' },
            { label: 'NPS 80CCD(1B) (₹, max ₹50K)', value: nps, set: setNps, ph: '0' },
          ].map(({ label, value, set, ph }) => (
            <div key={label} className="space-y-1">
              <label className="text-sm text-gray-600">{label}</label>
              <input
                className="border rounded-lg px-3 py-2 text-sm w-full"
                type="number"
                placeholder={ph}
                value={value}
                onChange={(e) => set(e.target.value)}
              />
            </div>
          ))}
        </div>

        {newResult && oldResult && (
          <div className="space-y-3">
            {recommended && (
              <p className="text-sm font-semibold text-green-700">
                ✓ Recommended: {recommended} saves you{' '}
                {INR_FMT.format(Math.abs(newResult.totalTax - oldResult.totalTax))} in tax
              </p>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-left border-b">
                    <th className="pb-2 font-medium">Metric</th>
                    <th className="pb-2 font-medium">New Regime</th>
                    <th className="pb-2 font-medium">Old Regime</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[
                    [
                      'Taxable Income',
                      INR_FMT.format(newResult.taxableIncome),
                      INR_FMT.format(oldResult.taxableIncome),
                    ],
                    [
                      'Base Tax',
                      INR_FMT.format(newResult.baseTax),
                      INR_FMT.format(oldResult.baseTax),
                    ],
                    ['Cess (4%)', INR_FMT.format(newResult.cess), INR_FMT.format(oldResult.cess)],
                    [
                      'Total Tax',
                      INR_FMT.format(newResult.totalTax),
                      INR_FMT.format(oldResult.totalTax),
                    ],
                    [
                      'Effective Rate',
                      `${newResult.effectiveRatePct.toFixed(1)}%`,
                      `${oldResult.effectiveRatePct.toFixed(1)}%`,
                    ],
                    [
                      'Take-Home Annual',
                      INR_FMT.format(newResult.takeHomeAnnual),
                      INR_FMT.format(oldResult.takeHomeAnnual),
                    ],
                  ].map(([metric, nv, ov]) => (
                    <tr key={metric}>
                      <td className="py-2 text-gray-600">{metric}</td>
                      <td
                        className={`py-2 font-medium ${newResult.totalTax <= oldResult.totalTax ? 'text-green-700' : ''}`}
                      >
                        {nv}
                      </td>
                      <td
                        className={`py-2 font-medium ${oldResult.totalTax < newResult.totalTax ? 'text-green-700' : ''}`}
                      >
                        {ov}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500">
              Disclaimer: This is an estimate. Consult a CA for tax planning.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const RISK_QUESTIONS: { q: string; options: { label: string; score: number }[] }[] = [
  {
    q: '1. How long is your investment time horizon?',
    options: [
      { label: 'Less than 3 years', score: 1 },
      { label: '3–7 years', score: 2 },
      { label: 'More than 7 years', score: 3 },
    ],
  },
  {
    q: '2. If your portfolio dropped 20% in a month, you would:',
    options: [
      { label: 'Sell everything immediately', score: 1 },
      { label: 'Wait and watch', score: 2 },
      { label: 'Buy more at lower prices', score: 3 },
    ],
  },
  {
    q: '3. What is your primary investment goal?',
    options: [
      { label: 'Preserve capital — avoid losses', score: 1 },
      { label: 'Steady growth with some income', score: 2 },
      { label: 'Maximize long-term wealth', score: 3 },
    ],
  },
  {
    q: '4. What is your household annual income?',
    options: [
      { label: 'Below ₹10 L', score: 1 },
      { label: '₹10 L – ₹30 L', score: 2 },
      { label: 'Above ₹30 L', score: 3 },
    ],
  },
  {
    q: '5. How stable is your primary income source?',
    options: [
      { label: 'Uncertain / freelance / contract', score: 1 },
      { label: 'Reasonably stable', score: 2 },
      { label: 'Very stable / government / tenured', score: 3 },
    ],
  },
  {
    q: '6. How many financial dependents do you have?',
    options: [
      { label: '3 or more', score: 1 },
      { label: '1–2', score: 2 },
      { label: 'None', score: 3 },
    ],
  },
  {
    q: '7. Do you have an emergency fund (3–6 months of expenses)?',
    options: [
      { label: 'No', score: 1 },
      { label: 'Partially (1–2 months)', score: 2 },
      { label: 'Yes, fully funded', score: 3 },
    ],
  },
  {
    q: '8. How comfortable are you seeing your portfolio swing ±15% in a year?',
    options: [
      { label: 'Very uncomfortable', score: 1 },
      { label: 'Somewhat uncomfortable', score: 2 },
      { label: 'Fully comfortable', score: 3 },
    ],
  },
  {
    q: '9. What is your investment experience?',
    options: [
      { label: 'Beginner — mostly FDs and savings', score: 1 },
      { label: 'Intermediate — mutual funds and some stocks', score: 2 },
      { label: 'Experienced — direct equity, derivatives, etc.', score: 3 },
    ],
  },
  {
    q: '10. Which statement best describes your priority?',
    options: [
      { label: 'I cannot afford to lose money', score: 1 },
      { label: 'I want balance between safety and growth', score: 2 },
      { label: 'I am willing to take higher risk for higher returns', score: 3 },
    ],
  },
];

type RiskBand = 'Conservative' | 'Moderate' | 'Aggressive';

function riskBand(total: number): RiskBand {
  if (total <= 16) return 'Conservative';
  if (total <= 23) return 'Moderate';
  return 'Aggressive';
}

const BAND_STYLE: Record<RiskBand, string> = {
  Conservative: 'bg-blue-100 text-blue-800',
  Moderate: 'bg-yellow-100 text-yellow-800',
  Aggressive: 'bg-green-100 text-green-800',
};

const BAND_DESC: Record<RiskBand, string> = {
  Conservative:
    'Focus on capital preservation. Suitable allocation: ~70–80% debt (FDs, PPF, debt MFs), 20–30% equity. Avoid high-volatility instruments.',
  Moderate:
    'Balanced growth with managed risk. Suitable allocation: ~50% equity, 50% debt. Diversified across large-cap mutual funds, PPF, and some bonds.',
  Aggressive:
    'Growth-oriented with high risk tolerance. Suitable allocation: ~70–80% equity (mid/small-cap, direct stocks), 20–30% debt. Longer investment horizon required.',
};

const STORAGE_KEY = 'wealthiq_risk_profile';

function RiskProfileQuestionnaire() {
  const [answers, setAnswers] = useState<(number | null)[]>(() => Array(10).fill(null) as null[]);
  const [saved, setSaved] = useState<{ total: number; band: RiskBand } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSaved(JSON.parse(raw) as { total: number; band: RiskBand });
    } catch {
      /* ignore */
    }
  }, []);

  function handleSelect(qi: number, score: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[qi] = score;
      return next;
    });
  }

  const allAnswered = answers.every((a) => a !== null);
  const totalScore = answers.reduce<number>((sum, a) => sum + (a ?? 0), 0);

  function handleSave() {
    const band = riskBand(totalScore);
    const result = { total: totalScore, band };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
    setSaved(result);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Risk Profile Questionnaire</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {saved && (
          <div className={`rounded-xl px-4 py-3 text-sm ${BAND_STYLE[saved.band]}`}>
            <p className="font-semibold">
              Current profile: {saved.band} (score {saved.total}/30)
            </p>
            <p className="mt-1">{BAND_DESC[saved.band]}</p>
            <p className="mt-1 text-xs opacity-70">
              Disclaimer: Generic education only. Not SEBI-regulated advice. Consult a financial advisor.
            </p>
          </div>
        )}

        {RISK_QUESTIONS.map((item, qi) => (
          <div key={qi} className="space-y-2">
            <p className="text-sm font-medium text-gray-700">{item.q}</p>
            <div className="flex flex-col gap-1">
              {item.options.map((opt) => (
                <label
                  key={opt.score}
                  className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg cursor-pointer border transition-colors ${
                    answers[qi] === opt.score
                      ? 'border-indigo-400 bg-indigo-50 text-indigo-800'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`rq_${qi}`}
                    value={opt.score}
                    checked={answers[qi] === opt.score}
                    onChange={() => handleSelect(qi, opt.score)}
                    className="sr-only"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        ))}

        {allAnswered && (
          <div className="pt-2 space-y-3">
            <div className={`rounded-xl px-4 py-3 text-sm ${BAND_STYLE[riskBand(totalScore)]}`}>
              <p className="font-semibold">
                Your profile: {riskBand(totalScore)} (score {totalScore}/30)
              </p>
              <p className="mt-1">{BAND_DESC[riskBand(totalScore)]}</p>
            </div>
            <Button onClick={handleSave}>Save Profile</Button>
          </div>
        )}

        {!allAnswered && (
          <p className="text-xs text-gray-500">Answer all 10 questions to see your risk profile.</p>
        )}
      </CardContent>
    </Card>
  );
}
