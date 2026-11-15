import SearchableDropdown from '../SearchableDropdown/SearchableDropdown';

export default function VehiclePicker({
  uid,
  lockVehicle,
  selectedVehicle,
  loadingVehicles,
  showVehicleDropdown,
  setShowVehicleDropdown,
  setShowDriverDropdown,
  vehicleSearch,
  setVehicleSearch,
  filteredVehicles,
  setSelectedVehicle,
}) {
  return (
    <SearchableDropdown
      bare
      role="combobox"
      id={`${uid}-vehicle`}
      options={filteredVehicles}
      selectedOption={selectedVehicle?.name || ''}
      disabled={lockVehicle || loadingVehicles}
      loading={loadingVehicles}
      placeholder={loadingVehicles ? 'Loading…' : 'Choose vehicle…'}
      open={showVehicleDropdown}
      onOpenChange={(open) => {
        setShowVehicleDropdown(open);
        if (open) setShowDriverDropdown(false);
      }}
      searchValue={vehicleSearch}
      onSearchChange={setVehicleSearch}
      searchLabel="Search vehicle"
      searchPlaceholder="Search vehicle…"
      filterOptions={false}
      isOptionSelected={(item) => item.id === selectedVehicle?.id}
      renderOption={(item) => (
        <span>
          {item.name}
          {item.registration ? (
            <small className="block text-xs text-slate-500">{item.registration}</small>
          ) : null}
        </span>
      )}
      onSelect={setSelectedVehicle}
    />
  );
}
