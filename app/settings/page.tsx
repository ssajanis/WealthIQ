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
            <p className="text-sm text-gray-400">Loading…</p>
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
            <p className="text-sm text-gray-400">Loading…</p>
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
            <p className="text-xs text-gray-400">
              Disclaimer: This is an estimate. Consult a CA for tax planning.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
