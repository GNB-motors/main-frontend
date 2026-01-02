import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MapPin } from 'lucide-react';
import RouteService from "./RouteService";
import GoogleMapsModal from '../../components/GoogleMapsModal/GoogleMapsModal';
import PageHeader from './Component/PageHeader.jsx';
import BasicInformationForm from './Component/BasicInformationForm.jsx';
import FormFooter from './Component/FormFooter.jsx';
import './RoutesPage.css';

const AddRoutePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const formRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [routeId, setRouteId] = useState(null);
  const [initialFormData, setInitialFormData] = useState({});
  const [isMapsModalOpen, setIsMapsModalOpen] = useState(false);
  const [currentLocationType, setCurrentLocationType] = useState(null); // 'source' or 'destination'

  // Location data state
  const [locationData, setLocationData] = useState({
    sourceLocation: { address: '', city: '', state: '', lat: null, lng: null },
    destLocation: { address: '', city: '', state: '', lat: null, lng: null },
  });

  // If navigated here for editing, prefill form from location.state.editingRoute
  useEffect(() => {
    const editing = location?.state?.editingRoute;
    if (editing) {
      setIsEdit(true);
      setRouteId(editing.id || editing._id);
      const formData = {
        name: editing.name || '',
        distanceKm: editing.distanceKm || '',
      };
      const locationData = {
        sourceLocation: editing.sourceLocation || { address: '', city: '', state: '', lat: null, lng: null },
        destLocation: editing.destLocation || { address: '', city: '', state: '', lat: null, lng: null },
      };
      setInitialFormData(formData);
      setLocationData(locationData);
    } else {
      // Reset to add mode when no editing route
      setIsEdit(false);
      setRouteId(null);
      setInitialFormData({});
      setLocationData({
        sourceLocation: { address: '', city: '', state: '', lat: null, lng: null },
        destLocation: { address: '', city: '', state: '', lat: null, lng: null },
      });
    }
  }, [location?.state?.editingRoute]);

  const handleInputChange = (field, value) => {
    setInitialFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLocationChange = (locationType, field, value) => {
    setLocationData(prev => ({
      ...prev,
      [locationType]: {
        ...prev[locationType],
        [field]: value
      }
    }));
  };

  const handleOpenMapsModal = (locationType) => {
    setCurrentLocationType(locationType);
    setIsMapsModalOpen(true);
  };

  const handleApplyLocation = (locationDataFromMap) => {
    const locationType = currentLocationType === 'source' ? 'sourceLocation' : 'destLocation';
    setLocationData(prev => ({
      ...prev,
      [locationType]: {
        address: locationDataFromMap.address,
        city: locationDataFromMap.city,
        state: locationDataFromMap.state,
        lat: locationDataFromMap.lat,
        lng: locationDataFromMap.lng
      }
    }));
  };

  const handleSubmit = async (basicFormData) => {
    setIsSubmitting(true);
    try {
      if (!basicFormData.name.trim()) {
        toast.error('Route name is required');
        return;
      }
      if (!locationData.sourceLocation.address || !locationData.sourceLocation.city) {
        toast.error('Source location is incomplete');
        return;
      }
      if (!locationData.destLocation.address || !locationData.destLocation.city) {
        toast.error('Destination location is incomplete');
        return;
      }
      if (!basicFormData.distanceKm) {
        toast.error('Distance is required');
        return;
      }

      const payload = {
        name: basicFormData.name,
        sourceLocation: locationData.sourceLocation,
        destLocation: locationData.destLocation,
        distanceKm: parseFloat(basicFormData.distanceKm) || 0,
      };

      if (isEdit) {
        await RouteService.updateRoute(routeId, payload);
        toast.success('Route updated successfully');
        navigate('/routes');
      } else {
        await RouteService.createRoute(payload);
        toast.success('Route created successfully');
        navigate('/routes');
      }
    } catch (err) {
      const msg = err?.message || err?.detail || 'Failed to save route';
      toast.error(msg);
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
    <div className="routes-page">
      <PageHeader
        backLabel="Routes"
        backPath="/routes"
        currentLabel={isEdit ? "Edit Route" : "Add Route"}
        title={isEdit ? "Edit Route" : "Add New Route"}
        description={isEdit ? "Update route information" : "Create a new route with source and destination locations"}
      />

      <div style={{ paddingBottom: '80px' }}>
        <BasicInformationForm
          ref={formRef}
          initialData={initialFormData}
          locationData={locationData}
          onSubmit={handleSubmit}
          onLocationChange={handleLocationChange}
          onOpenMapsModal={handleOpenMapsModal}
          isSubmitting={isSubmitting}
          isEdit={isEdit}
        />
      </div>

      <FormFooter
        onCancel={() => navigate('/routes')}
        onSubmit={handleFooterSubmit}
        isSubmitting={isSubmitting}
        isEdit={isEdit}
      />

      <GoogleMapsModal
        isOpen={isMapsModalOpen}
        onClose={() => setIsMapsModalOpen(false)}
        onApply={handleApplyLocation}
        initialLocation={
          currentLocationType === 'source'
            ? locationData.sourceLocation.lat && locationData.sourceLocation.lng
              ? { lat: locationData.sourceLocation.lat, lng: locationData.sourceLocation.lng }
              : null
            : locationData.destLocation.lat && locationData.destLocation.lng
              ? { lat: locationData.destLocation.lat, lng: locationData.destLocation.lng }
              : null
        }
      />
    </div>
  );
};

export default AddRoutePage;
