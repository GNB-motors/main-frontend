/**
 * Tolls — the toll-plaza master (CRUD + CSV bulk upload).
 *
 * Separate from the report because the two answer to different people: an
 * OWNER/MANAGER maintains rates here, everyone else only ever reads the report.
 * Writes are gated server-side by `authorize('OWNER','MANAGER')`; this screen
 * simply hides them for anyone else so nobody discovers the limit by clicking.
 *
 * Plaza data is entered by hand on purpose — the national toll list is not
 * scraped. The CSV upload is the fast path for an operator who already has a
 * sheet of their own plazas.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Search, Pencil, Trash2, Upload, Download, RotateCcw } from 'lucide-react';
import { toast } from 'react-toastify';
import TollsService from './TollsService';
import PageShell from '../../components/ui/PageShell';
import DataTable from '../../components/ui/DataTable';
import EnterprisePagination from '../../components/ui/EnterprisePagination';
import {
  VEHICLE_CLASSES,
  DEFAULT_RADIUS_METERS,
  downloadBlob,
  parseFaresText,
  formatFares,
} from './tollsUtils';
import './TollsPlazasTab.css';

const EMPTY_FORM = {
  code: '',
  name: '',
  highway: '',
  lat: '',
  lng: '',
  radiusMeters: DEFAULT_RADIUS_METERS,
  defaultVehicleClass: 'HMV_3AXLE',
  returnWindowHours: 24,
  returnChargeRatio: 0.5,
  isActive: true,
  /** "HMV_3AXLE=310; HMV_6AXLE=460" — parsed into the fares object on save. */
  faresText: '',
};

const TEMPLATE =
  'CODE,NAME,HIGHWAY,LAT,LNG,RADIUS_METERS,FARES,DEFAULT_VEHICLE_CLASS,RETURN_WINDOW_HOURS,RETURN_CHARGE_RATIO,IS_ACTIVE\n';

export default function TollPlazasTab({ canEdit }) {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 25 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [csvText, setCsvText] = useState('');
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const fetchPlazas = useCallback(async ({ search: q = '', page = 1, limit = 25 } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await TollsService.listPlazas({ search: q || undefined, page, limit });
      setRows(data?.rows || []);
      setMeta({ total: data?.total ?? 0, page: data?.page ?? 1, limit: data?.limit ?? 25 });
    } catch (err) {
      setError(err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlazas({});
  }, [fetchPlazas]);

  const openCreate = () => {
    setEditing('new');
    setForm(EMPTY_FORM);
    setFormError(null);
  };

  const openEdit = (plaza) => {
    setEditing(plaza.id);
    setForm({
      code: plaza.code,
      name: plaza.name,
      highway: plaza.highway || '',
      lat: String(plaza.lat),
      lng: String(plaza.lng),
      radiusMeters: plaza.radiusMeters,
      defaultVehicleClass: plaza.defaultVehicleClass,
      returnWindowHours: plaza.returnWindowHours,
      returnChargeRatio: plaza.returnChargeRatio,
      isActive: plaza.isActive !== false,
      faresText: formatFares(plaza.fares),
    });
    setFormError(null);
  };

  const setField = (name, value) => setForm((p) => ({ ...p, [name]: value }));

  const save = async () => {
    setFormError(null);
    let fares;
    try {
      fares = parseFaresText(form.faresText);
    } catch (err) {
      setFormError(err.message);
      return;
    }
    const lat = Number(form.lat);
    const lng = Number(form.lng);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      setFormError('Latitude must be between -90 and 90');
      return;
    }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      setFormError('Longitude must be between -180 and 180');
      return;
    }

    const body = {
      name: form.name.trim(),
      highway: form.highway.trim().toUpperCase(),
      lat,
      lng,
      radiusMeters: Number(form.radiusMeters) || DEFAULT_RADIUS_METERS,
      fares,
      defaultVehicleClass: form.defaultVehicleClass,
      returnWindowHours: Number(form.returnWindowHours),
      returnChargeRatio: Number(form.returnChargeRatio),
      isActive: form.isActive,
    };

    setSaving(true);
    try {
      if (editing === 'new') {
        await TollsService.createPlaza({ code: form.code.trim().toUpperCase(), ...body });
        toast.success('Toll plaza created');
      } else {
        await TollsService.updatePlaza(editing, body);
        toast.success('Toll plaza updated');
      }
      setEditing(null);
      fetchPlazas({ search, page: meta.page });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (plaza) => {
    // Global plazas (orgId null) are platform data — the server refuses, so the
    // button is not offered for them either.
    if (plaza.isGlobal) return;
    if (!window.confirm(`Delete "${plaza.name}"? Crossings already recorded are kept.`)) return;
    try {
      await TollsService.deletePlaza(plaza.id);
      toast.success('Toll plaza deleted');
      fetchPlazas({ search, page: meta.page });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const runBulk = async (dryRun) => {
    if (!csvText.trim()) {
      toast.error('Paste the CSV first');
      return;
    }
    setBulkBusy(true);
    try {
      const result = await TollsService.bulkUploadPlazas(csvText, dryRun);
      setBulkResult(result);
      if (dryRun) toast.info(`Dry run: ${result.created} to create, ${result.updated} to update`);
      else {
        toast.success(
          `Uploaded — ${result.created} created, ${result.updated} updated${
            result.errors ? `, ${result.errors} failed` : ''
          }`,
        );
        fetchPlazas({ search, page: meta.page });
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBulkBusy(false);
    }
  };

  const downloadTemplate = () =>
    downloadBlob(new Blob([TEMPLATE], { type: 'text/csv;charset=utf-8' }), 'toll-plaza-template.csv');

  const columns = [
    { key: 'name', label: 'Plaza', render: (r) => <strong>{r.name}</strong> },
    { key: 'code', label: 'Code', render: (r) => <code className="tpl-code">{r.code}</code> },
    { key: 'highway', label: 'Highway', render: (r) => r.highway || '—' },
    {
      key: 'return',
      label: 'Return rule',
      render: (r) => (
        <span>
          {r.returnWindowHours}h window · {Math.round((r.returnChargeRatio ?? 0) * 100)}% charge
        </span>
      ),
    },
    {
      key: 'defaultVehicleClass',
      label: 'Default class',
      render: (r) => r.defaultVehicleClass || 'UNKNOWN',
    },
    {
      key: 'scope',
      label: 'Scope',
      render: (r) =>
        r.isGlobal ? (
          <span className="tpl-badge tpl-badge--global">Global</span>
        ) : (
          <span className="tpl-badge">This org</span>
        ),
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (r) =>
        canEdit && !r.isGlobal ? (
          <span className="tpl-actions">
            <button type="button" className="tpl-icon-btn" onClick={() => openEdit(r)} title="Edit">
              <Pencil size={14} />
            </button>
            <button
              type="button"
              className="tpl-icon-btn tpl-icon-btn--danger"
              onClick={() => remove(r)}
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </span>
        ) : null,
    },
  ];

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  return (
    <div className="tpl">
      <PageShell
        title="Toll plaza master"
        count={meta.total}
        subtitle="Rates are per vehicle class. The return window and the return charge belong to the plaza — most are 24 h at half rate, some are not."
        actions={
          canEdit ? (
            <>
              <button type="button" className="pshell-btn" onClick={downloadTemplate}>
                <Download size={14} /> Template
              </button>
              <button type="button" className="pshell-btn pshell-btn--primary" onClick={openCreate}>
                <Plus size={14} /> New plaza
              </button>
            </>
          ) : null
        }
        filters={
          <div className="tpl-filters">
            <label className="tpl-search">
              <Search size={14} />
              <input
                aria-label="Search plazas"
                placeholder="Search name, code or highway"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  fetchPlazas({ search: e.target.value, page: 1 });
                }}
              />
            </label>
          </div>
        }
        footer={`Showing ${rows.length} of ${meta.total}`}
      >
        {editing && (
          <div className="tpl-editor">
            <h3>{editing === 'new' ? 'New toll plaza' : `Edit ${form.name}`}</h3>
            <div className="tpl-grid">
              {editing === 'new' && (
                <label>
                  Code
                  <input
                    aria-label="Code"
                    value={form.code}
                    onChange={(e) => setField('code', e.target.value)}
                    placeholder="NH44-DUMUR-SAGARDWARI"
                  />
                </label>
              )}
              <label>
                Name
                <input
                  aria-label="Name"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                />
              </label>
              <label>
                Highway
                <input
                  aria-label="Highway"
                  value={form.highway}
                  onChange={(e) => setField('highway', e.target.value)}
                />
              </label>
              <label>
                Latitude
                <input
                  aria-label="Latitude"
                  value={form.lat}
                  onChange={(e) => setField('lat', e.target.value)}
                />
              </label>
              <label>
                Longitude
                <input
                  aria-label="Longitude"
                  value={form.lng}
                  onChange={(e) => setField('lng', e.target.value)}
                />
              </label>
              <label>
                Radius (m)
                <input
                  aria-label="Radius (m)"
                  type="number"
                  value={form.radiusMeters}
                  onChange={(e) => setField('radiusMeters', e.target.value)}
                />
              </label>
              <label className="tpl-grid--wide">
                Fares — CLASS=rupees; separated by semicolons
                <input
                  aria-label="Fares"
                  value={form.faresText}
                  onChange={(e) => setField('faresText', e.target.value)}
                  placeholder="HMV_3AXLE=310; HMV_6AXLE=460; CAR=85"
                />
              </label>
              <label>
                Default class
                <select
                  aria-label="Default class"
                  value={form.defaultVehicleClass}
                  onChange={(e) => setField('defaultVehicleClass', e.target.value)}
                >
                  {VEHICLE_CLASSES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Return window (hours)
                <input
                  aria-label="Return window (hours)"
                  type="number"
                  min="0"
                  value={form.returnWindowHours}
                  onChange={(e) => setField('returnWindowHours', e.target.value)}
                />
              </label>
              <label>
                Return charge ratio
                <input
                  aria-label="Return charge ratio"
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  value={form.returnChargeRatio}
                  onChange={(e) => setField('returnChargeRatio', e.target.value)}
                />
              </label>
              <label className="tpl-check">
                <input
                  type="checkbox"
                  aria-label="Active"
                  checked={form.isActive}
                  onChange={(e) => setField('isActive', e.target.checked)}
                />
                Active
              </label>
            </div>
            {formError && <p className="tpl-error">{formError}</p>}
            <div className="tpl-editor-actions">
              <button type="button" className="pshell-btn" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="pshell-btn pshell-btn--primary"
                onClick={save}
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        )}

        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          loading={loading}
          error={error}
          onRetry={() => fetchPlazas({ search, page: meta.page })}
          emptyTitle="No toll plazas yet"
          emptyHint={
            canEdit
              ? 'Add one, or paste a CSV in the bulk upload below.'
              : 'Your organization has not loaded a toll-plaza master yet.'
          }
          pagination={
            <EnterprisePagination
              page={meta.page}
              totalPages={totalPages}
              totalItems={meta.total}
              pageSize={meta.limit}
              onPageChange={(page) => fetchPlazas({ search, page })}
            />
          }
        />

        {canEdit && (
          <div className="tpl-bulk">
            <h3>
              <Upload size={15} /> Bulk upload (CSV)
            </h3>
            <p className="tpl-hint">
              Rows upsert on <code>CODE</code>, so re-running the same file updates rather than
              duplicates. Dry run first — nothing is written until you apply.
            </p>
            <textarea
              aria-label="Plaza CSV"
              rows={5}
              spellCheck={false}
              placeholder={`${TEMPLATE}NH2-A,Plaza A,NH2,22.5,88.3,400,HMV_3AXLE=300;HMV_6AXLE=450,HMV_3AXLE,24,0.5,true`}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
            />
            <div className="tpl-bulk-actions">
              <button
                type="button"
                className="pshell-btn"
                onClick={() => runBulk(true)}
                disabled={bulkBusy}
              >
                Dry run
              </button>
              <button
                type="button"
                className="pshell-btn pshell-btn--primary"
                onClick={() => runBulk(false)}
                disabled={bulkBusy}
              >
                <Upload size={14} /> Apply
              </button>
              {bulkResult && (
                <button
                  type="button"
                  className="pshell-btn"
                  onClick={() => setBulkResult(null)}
                  title="Clear"
                >
                  <RotateCcw size={14} />
                </button>
              )}
            </div>
            {bulkResult && (
              <div className="tpl-bulk-result">
                <p>
                  <strong>
                    {bulkResult.dryRun ? 'Dry run — ' : 'Applied — '}
                    {bulkResult.created} created, {bulkResult.updated} updated,{' '}
                    {bulkResult.errors} failed
                  </strong>
                </p>
                {bulkResult.errors > 0 && (
                  <ul>
                    {bulkResult.results
                      .filter((r) => r.status === 'ERROR')
                      .slice(0, 20)
                      .map((r) => (
                        <li key={`${r.line}-${r.code}`}>
                          Line {r.line}
                          {r.code ? ` (${r.code})` : ''}: {r.message}
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </PageShell>
    </div>
  );
}