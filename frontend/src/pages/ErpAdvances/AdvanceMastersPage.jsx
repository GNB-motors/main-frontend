/**
 * Advance Masters (ISOCL ERP Stage 4)
 *
 * The three inputs the advance calculator reads: expected mileage, state diesel
 * prices, and per-route non-fuel costs. One page with three tabs, because they
 * are only ever set up together.
 */

import React, { useState, useEffect } from 'react';
import { Plus, Info } from 'lucide-react';
import { toast } from 'react-toastify';
import AdvanceService from './AdvanceService';
import ErpMasterService from '../ErpMasters/ErpMasterService';
import useApi from '../../hooks/useApi';
import PageShell from '../../components/Erp/PageShell';
import TABS from './advanceMasterTabs';
import AdvanceMastersTable from './AdvanceMastersTable';
import AdvanceMasterModal from './AdvanceMasterModal';
import '../../styles/erp.css';

const AdvanceMastersPage = () => {
  const [tab, setTab] = useState('mileage');
  const [routes, setRoutes] = useState([]);
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({});

  const { data: routesResponse } = useApi((signal) => ErpMasterService.getRoutes({ signal }), []);

  const {
    data: rowsResponse,
    loading,
    error: rowsError,
    refetch: refetchRows,
  } = useApi(
    (signal) => {
      if (tab === 'mileage') return AdvanceService.getMileage({ limit: 200 }, { signal });
      if (tab === 'fuel') return AdvanceService.getFuelRates({}, { signal });
      return AdvanceService.getRouteBudgets({ limit: 200 }, { signal });
    },
    [JSON.stringify({ tab })],
  );

  useEffect(() => {
    if (routesResponse) setRoutes(routesResponse);
  }, [routesResponse]);

  useEffect(() => {
    if (rowsResponse) setRows(rowsResponse.data || []);
  }, [rowsResponse]);

  useEffect(() => {
    if (!rowsError) return;
    if (rowsError.status === 404) {
      toast.error('ERP Masters is not enabled for your organization');
    } else {
      toast.error(rowsError.message);
    }
    setRows([]);
  }, [rowsError]);

  const openCreate = () => {
    setForm(
      tab === 'mileage'
        ? { vehicleModel: '', routeId: '', loadType: 'LOAD', kmPerLitre: '' }
        : tab === 'fuel'
          ? { state: '', rate: '', effectiveDate: new Date().toISOString().slice(0, 10) }
          : {
              routeId: '',
              vehicleModel: '',
              servicingAmount: '',
              bordersAmount: '',
              miscAmount: '',
              emptyDieselOnly: true,
            },
    );
    setShowModal(true);
  };

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (tab === 'mileage') {
        await AdvanceService.saveMileage({
          vehicleModel: form.vehicleModel.trim(),
          routeId: form.routeId || null,
          loadType: form.loadType,
          kmPerLitre: Number(form.kmPerLitre),
        });
      } else if (tab === 'fuel') {
        await AdvanceService.saveFuelRate({
          state: form.state.trim().toUpperCase(),
          rate: Number(form.rate),
          effectiveDate: form.effectiveDate,
        });
      } else {
        await AdvanceService.saveRouteBudget({
          routeId: form.routeId,
          vehicleModel: form.vehicleModel?.trim() || null,
          servicingAmount: Number(form.servicingAmount) || 0,
          bordersAmount: Number(form.bordersAmount) || 0,
          miscAmount: Number(form.miscAmount) || 0,
          emptyDieselOnly: form.emptyDieselOnly !== false,
        });
      }
      toast.success('Saved');
      setShowModal(false);
      refetchRows();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    setSaving(true);
    try {
      if (tab === 'mileage') await AdvanceService.deleteMileage(row._id);
      else if (tab === 'fuel') await AdvanceService.deleteFuelRate(row._id);
      else await AdvanceService.deleteRouteBudget(row._id);
      toast.success('Removed');
      refetchRows();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell
      title="Advance Masters"
      subtitle="What the advance calculator reads to cost a trip"
      actions={
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} />
          Add
        </button>
      }
    >
      <div className="erp-toolbar">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              className={`btn ${tab === t.key ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTab(t.key)}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'fuel' && (
        <div className="erp-callout info" style={{ marginTop: 16 }}>
          <Info size={16} />
          <span>
            A trip&apos;s diesel is costed at the <strong>average</strong> of these across the
            states its route crosses — not a single state&apos;s price. Every state on a route needs
            a rate here.
          </span>
        </div>
      )}

      {tab === 'mileage' && (
        <div className="erp-callout info" style={{ marginTop: 16 }}>
          <Info size={16} />
          <span>
            Load and empty are kept separate. Leave the route blank to set a model-wide default;
            with nothing here, the fleet&apos;s own fuel history is used instead.
          </span>
        </div>
      )}

      <div className="erp-container">
        {loading ? (
          <div className="erp-state">
            <p>Loading...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="erp-state">
            <p>Nothing configured yet</p>
            <button className="btn btn-primary" onClick={openCreate}>
              <Plus size={18} />
              Add the first entry
            </button>
          </div>
        ) : (
          <AdvanceMastersTable tab={tab} rows={rows} handleDelete={handleDelete} saving={saving} />
        )}
      </div>

      {showModal && (
        <AdvanceMasterModal
          tab={tab}
          setShowModal={setShowModal}
          handleSubmit={handleSubmit}
          form={form}
          setField={setField}
          routes={routes}
          saving={saving}
        />
      )}
    </PageShell>
  );
};

export default AdvanceMastersPage;
