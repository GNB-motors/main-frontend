import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Receipt } from 'lucide-react';
import { toast } from 'react-toastify';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import FormFooter from './components/FormFooter';
import SelectField from './components/SelectField';
import TripService from '../Trip/services/TripService';
import KhataLedgerService from './KhataLedgerService';
import LedgerPageHeader from './components/LedgerPageHeader';
import {
  CATEGORIES,
  CATEGORY_LABELS,
  formatCurrency,
  getDriverName,
  getVehicleLabel,
  toDateInputValue,
} from './utils';

const fieldClass =
  'h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

const Field = ({ label, required, hint, className, children }) => (
  <div className={className}>
    <label className="mb-1.5 block text-sm font-medium text-foreground">
      {label}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
    {children}
    {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
  </div>
);

const ExpenseFormPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEdit = !!id;
  const returnTo = location.state?.from || '/khata-ledger/transactions';

  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: 'MISCELLANEOUS',
    description: '',
    expenseDate: toDateInputValue(new Date()),
    vehicleId: '',
    driverId: '',
  });
  const [options, setOptions] = useState({ vehicles: [], drivers: [] });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [vRes, dRes] = await Promise.all([
          TripService.getVehicles({ limit: 200 }),
          TripService.getDrivers({ limit: 200 }),
        ]);
        setOptions({
          vehicles: vRes?.data || vRes?.results || vRes || [],
          drivers: dRes?.data || dRes?.results || dRes || [],
        });
      } catch {
        toast.error('Could not load trucks and drivers — you can still save without them');
      }
    };
    loadOptions();
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    const loadExpense = async () => {
      setLoading(true);
      try {
        const match = await KhataLedgerService.getExpenseById(id);
        setForm({
          title: match.title || '',
          amount: match.amount ?? '',
          category: match.category || 'MISCELLANEOUS',
          description: match.description || '',
          expenseDate: toDateInputValue(match.expenseDate),
          vehicleId: match.vehicle?._id || '',
          driverId: match.driver?._id || '',
        });
      } catch (err) {
        toast.error(err?.response?.data?.message || err?.message || 'Could not load that expense');
        navigate(returnTo);
      } finally {
        setLoading(false);
      }
    };
    loadExpense();
  }, [id, isEdit, navigate, returnTo]);

  const set = useCallback((key, value) => setForm((f) => ({ ...f, [key]: value })), []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Give the entry a title so it can be found later');
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('Enter an amount greater than zero');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        amount: Number(form.amount),
        category: form.category,
        description: form.description.trim() || undefined,
        expenseDate: new Date(form.expenseDate).toISOString(),
        vehicleId: form.vehicleId || null,
        driverId: form.driverId || null,
      };
      if (isEdit) {
        await KhataLedgerService.updateExpense(id, payload);
        toast.success('Expense updated');
      } else {
        await KhataLedgerService.createExpense(payload);
        toast.success('Expense added');
      }
      navigate(returnTo);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Could not save that expense');
    } finally {
      setSaving(false);
    }
  };

  return (
    // pb-20 clears the fixed footer (min-height 64px) so the last field is reachable.
    <div className="space-y-5 p-1 pb-20">
      <LedgerPageHeader
        title={isEdit ? 'Edit Expense' : 'Add Expense'}
        icon={Receipt}
        description="Manual khata entries — anything not already captured by a trip, fuel log or service record."
        backTo={returnTo}
      />

      {loading ? (
        <Card className="card-static">
          <CardContent className="space-y-4 p-5">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* items-stretch is the grid default — both cards run to the height of
              the taller one, so no page background shows through beside them. */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <Card className="card-static flex flex-col lg:col-span-2">
              <CardContent className="flex flex-1 flex-col gap-4 p-5">
                <p className="console-eyebrow">The entry</p>

                <Field label="Title" required>
                  <input
                    className={fieldClass}
                    value={form.title}
                    onChange={(e) => set('title', e.target.value)}
                    placeholder="e.g. Tyre replacement, front left"
                    maxLength={200}
                  />
                </Field>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field label="Amount" required hint={form.amount ? formatCurrency(form.amount) : '₹'}>
                    <input
                      type="number"
                      inputMode="decimal"
                      className={`${fieldClass} num`}
                      value={form.amount}
                      onChange={(e) => set('amount', e.target.value)}
                      placeholder="0"
                      min="0"
                      step="1"
                    />
                  </Field>

                  <SelectField
                    label="Category"
                    value={form.category}
                    onChange={(v) => set('category', v || 'MISCELLANEOUS')}
                    placeholder="Miscellaneous"
                    options={CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))}
                  />

                  <Field label="Date">
                    <input
                      type="date"
                      className={`${fieldClass} num`}
                      value={form.expenseDate}
                      onChange={(e) => set('expenseDate', e.target.value)}
                    />
                  </Field>
                </div>

                {/* Grows into whatever height the card has left, so the notes
                    box absorbs the slack instead of leaving a gap under it. */}
                <Field
                  label="Notes"
                  hint="Optional — anything that explains the entry later."
                  className="flex flex-1 flex-col"
                >
                  <textarea
                    className={`${fieldClass} h-auto min-h-[104px] flex-1 resize-none py-2`}
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                    placeholder="Bill number, vendor, what was replaced…"
                    maxLength={1000}
                  />
                </Field>
              </CardContent>
            </Card>

            <Card className="card-static flex flex-col">
              <CardContent className="flex flex-1 flex-col gap-4 p-5">
                <div>
                  <p className="console-eyebrow">Attribution</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Whoever you pick here is who the entry shows up against in the driver and truck
                    ledgers. Leave blank if it belongs to neither.
                  </p>
                </div>

                <SelectField
                  label="Truck"
                  value={form.vehicleId}
                  onChange={(v) => set('vehicleId', v)}
                  placeholder="Not linked to a truck"
                  options={options.vehicles.map((v) => ({
                    value: v._id,
                    label: getVehicleLabel(v),
                  }))}
                />

                <SelectField
                  label="Driver"
                  value={form.driverId}
                  onChange={(v) => set('driverId', v)}
                  placeholder="Not linked to a driver"
                  options={options.drivers.map((d) => ({
                    value: d._id,
                    label: getDriverName(d),
                  }))}
                />
              </CardContent>
            </Card>
          </div>

          {/* Same fixed action bar as Add Employee. It lives inside the form so
              the submit button fires natively — no formRef/dispatchEvent dance. */}
          <FormFooter
            onCancel={() => navigate(returnTo)}
            isSubmitting={saving}
            submitText={saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add expense'}
          />
        </form>
      )}
    </div>
  );
};

export default ExpenseFormPage;
