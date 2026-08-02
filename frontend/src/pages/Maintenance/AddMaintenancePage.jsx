import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FileText, X } from 'lucide-react';
import PageHeader from '../Drivers/Component/PageHeader.jsx';
import FormFooter from '../Drivers/Component/FormFooter.jsx';
import DropZone from '../../components/DropZone/DropZone.jsx';
import MaintenanceBasicInformationForm from './Component/MaintenanceBasicInformationForm.jsx';
import AddOptionModal from './Component/AddOptionModal.jsx';
import { MaintenanceService } from './MaintenanceService.jsx';
import { VehicleService } from '../Profile/VehicleService.jsx';
import { getThemeCSS } from '../../utils/colorTheme';
import '../Profile/VehiclesPage.css';

/**
 * Dedicated full-page form for adding a Service or Repair entry. Mirrors the
 * AddVehiclePage / AddDriverPage scaffolding: `vehicles-content-wrapper`
 * container + PageHeader + form sections + sticky FormFooter.
 *
 * `recordType` is passed via the route element's prop, so this single page
 * powers both `/vehicles/service-intelligence/add-service` and `.../add-repair`.
 */
const AddMaintenancePage = ({ recordType = 'SERVICE' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isService = recordType === 'SERVICE';
  const formRef = useRef(null);

  const [themeColors, setThemeColors] = useState(getThemeCSS());
  const [vehicles, setVehicles] = useState([]);
  const [options, setOptions] = useState({ workshops: [], serviceTypes: [], repairTypes: [] });
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // For the "+ Add new" mini-modal launched from the form. `initialValue` is
  // pre-filled from whatever the user typed in the SearchableDropdown's search.
  // `clearSearch` is the dropdown's own setSearchTerm("") fn — we call it after
  // a successful save so the dropdown isn't still filtered by the typed text.
  const [addModal, setAddModal] = useState({
    open: false,
    category: null,
    title: '',
    placeholder: '',
    initialValue: '',
    clearSearch: null,
  });

  // Allow deep-linking to this page with a pre-selected vehicle.
  const initialData = useMemo(() => {
    const v = location.state?.preselectedVehicleId;
    return v ? { vehicleId: v } : {};
  }, [location.state]);

  useEffect(() => {
    const handler = () => setThemeColors(getThemeCSS());
    handler();
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    VehicleService.getAllVehicles(null, token, 1, 1000)
      .then((res) => setVehicles(Array.isArray(res?.data) ? res.data : []))
      .catch(() => setVehicles([]));
    MaintenanceService.getOptions(token)
      .then((o) => setOptions(o || { workshops: [], serviceTypes: [], repairTypes: [] }))
      .catch(() => {});
  }, []);

  const openAddWorkshop = (initialValue = '', clearSearch = null) =>
    setAddModal({
      open: true,
      category: 'WORKSHOP',
      title: isService ? 'Add Workshop / Service Center' : 'Add Workshop',
      placeholder: 'e.g., RK Auto Garage',
      initialValue,
      clearSearch,
    });

  const openAddType = (initialValue = '', clearSearch = null) =>
    setAddModal({
      open: true,
      category: isService ? 'SERVICE_TYPE' : 'REPAIR_TYPE',
      title: isService ? 'Add Service Type' : 'Add Repair Type',
      placeholder: isService ? 'e.g., 20,000 km major service' : 'e.g., Turbocharger replacement',
      initialValue,
      clearSearch,
    });

  const handleOptionSaved = (value) => {
    // Merge into local state so the dropdown immediately shows the new value.
    setOptions((prev) => {
      const next = { ...prev };
      if (addModal.category === 'WORKSHOP') next.workshops = [...(prev.workshops || []), value];
      if (addModal.category === 'SERVICE_TYPE') next.serviceTypes = [...(prev.serviceTypes || []), value];
      if (addModal.category === 'REPAIR_TYPE') next.repairTypes = [...(prev.repairTypes || []), value];
      return next;
    });
    // Clear the dropdown's stale search term so the user can scroll/pick the
    // new value without first having to delete what they typed.
    addModal.clearSearch?.();
  };

  const handleDrop = (incoming) => {
    const ok = incoming.filter((f) => {
      if (f.size > 10 * 1024 * 1024) {
        toast.warn(`${f.name} is over 10MB and was skipped.`);
        return false;
      }
      return true;
    });
    setFiles((prev) => [...prev, ...ok]);
  };

  const handleSubmit = async (formData) => {
    if (!formData.vehicleId || !formData.date || !formData.workshop || !formData.type || formData.amount === '') {
      toast.error('Please fill all required fields.');
      return;
    }
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('authToken');
      const payload = {
        vehicleId: formData.vehicleId,
        recordType,
        date: formData.date,
        workshop: formData.workshop,
        type: formData.type,
        amount: Number(formData.amount),
        notes: formData.notes || undefined,
      };
      if (isService && formData.currentKm !== '') payload.currentKm = Number(formData.currentKm);

      await MaintenanceService.createRecord(token, payload, files);
      toast.success(`${isService ? 'Service' : 'Repair'} record added.`);
      navigate('/vehicles/service-intelligence', { state: { focusTab: recordType } });
    } catch (err) {
      toast.error(err?.detail || 'Failed to save record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFooterSubmit = (e) => {
    e.preventDefault();
    if (formRef.current) {
      formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  };

  return (
    <div className="vehicles-page-container" style={themeColors}>
      <div className="vehicles-content-wrapper" style={{ paddingBottom: '80px' }}>
        <PageHeader
          backLabel="Service Intelligence"
          backPath="/vehicles/service-intelligence"
          title={isService ? 'Add Service' : 'Add Repair'}
          description={
            isService
              ? 'Log a routine service performed on a vehicle. Workshop and service type will be saved for future reuse.'
              : 'Log a repair performed on a vehicle. Workshop and repair type will be saved for future reuse.'
          }
          onBack={() => navigate(-1)}
        />

        <MaintenanceBasicInformationForm
          ref={formRef}
          recordType={recordType}
          vehicles={vehicles}
          options={options}
          initialData={initialData}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onRequestAddWorkshop={openAddWorkshop}
          onRequestAddType={openAddType}
        />

        {/* Attachments section — keeps the same card-style scaffolding as the form */}
        <div className="basic-info-wrapper" style={{ marginTop: 16 }}>
          <div className="basic-info-outer-container">
            <div className="basic-info-header">
              <div className="basic-info-header-content">
                <div className="basic-info-icon-wrapper">
                  <FileText size={20} color="#454547" />
                </div>
                <div className="basic-info-title">
                  {isService ? 'Invoice / Job Card (optional)' : 'Repair Bill (optional)'}
                </div>
              </div>
            </div>
            <div className="basic-info-container">
              <DropZone
                onDrop={handleDrop}
                acceptedFormats={['image/*', 'application/pdf']}
                multiple
                maxFiles={10}
                isCompact
                label={isService ? 'Drop invoice / job card here' : 'Drop repair bill here'}
              />
              {files.length > 0 && (
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: '12px 0 0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  {files.map((f, i) => (
                    <li
                      key={`${f.name}-${i}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 13,
                        color: '#334155',
                        padding: '6px 10px',
                        background: '#f1f5f9',
                        borderRadius: 6,
                      }}
                    >
                      <FileText size={14} />
                      <span
                        style={{
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {f.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                      >
                        <X size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      <FormFooter
        onCancel={() => navigate(-1)}
        onSubmit={handleFooterSubmit}
        isSubmitting={isSubmitting}
        submitText={
          isSubmitting
            ? 'Saving…'
            : isService
              ? 'Add Service'
              : 'Add Repair'
        }
      />

      <AddOptionModal
        open={addModal.open}
        onClose={() =>
          setAddModal({
            open: false,
            category: null,
            title: '',
            placeholder: '',
            initialValue: '',
            clearSearch: null,
          })
        }
        category={addModal.category}
        title={addModal.title}
        placeholder={addModal.placeholder}
        initialValue={addModal.initialValue}
        onSaved={handleOptionSaved}
      />
    </div>
  );
};

export default AddMaintenancePage;
