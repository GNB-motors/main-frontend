import SearchableSelect from '../../../components/SearchableDropdown/SearchableSelect';

export default function EmployeeSelect({ id, value, onChange, items, disabled = false }) {
  return (
    <SearchableSelect
      id={id}
      value={value || ''}
      onValueChange={(next) => onChange(next || '')}
      disabled={disabled}
      className="employee-select-trigger"
      searchPlaceholder="Search options…"
    >
      {items.map((item) => (
        <option key={item.value ?? 'none'} value={item.value ?? ''}>
          {item.label}
        </option>
      ))}
    </SearchableSelect>
  );
}
