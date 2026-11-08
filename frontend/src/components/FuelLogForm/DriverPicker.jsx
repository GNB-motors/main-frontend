import SearchableDropdown from '../SearchableDropdown/SearchableDropdown';

export default function DriverPicker({
  uid,
  lockDriver,
  selectedDriver,
  loadingDrivers,
  showDriverDropdown,
  setShowDriverDropdown,
  setShowVehicleDropdown,
  driverSearch,
  setDriverSearch,
  filteredDrivers,
  setSelectedDriver,
}) {
  return (
    <SearchableDropdown
      bare
      role="combobox"
      id={`${uid}-driver`}
      options={filteredDrivers}
      selectedOption={selectedDriver?.name || ''}
      disabled={lockDriver || loadingDrivers}
      loading={loadingDrivers}
      placeholder={loadingDrivers ? 'Loading…' : 'Choose driver…'}
      open={showDriverDropdown}
      onOpenChange={(open) => {
        setShowDriverDropdown(open);
        if (open) setShowVehicleDropdown(false);
      }}
      searchValue={driverSearch}
      onSearchChange={setDriverSearch}
      searchLabel="Search driver"
      searchPlaceholder="Search driver…"
      filterOptions={false}
      isOptionSelected={(item) => item.id === selectedDriver?.id}
      renderOption={(item) => (
        <span>
          {item.name}
          {item.licenseNo ? (
            <small className="block text-xs text-slate-500">{item.licenseNo}</small>
          ) : null}
        </span>
      )}
      onSelect={setSelectedDriver}
    />
  );
}
