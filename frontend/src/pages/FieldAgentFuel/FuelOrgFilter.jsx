/** Organization chips that narrow the vehicle and driver pickers. */
const FuelOrgFilter = ({ organizations, selectedOrgFilter, setSelectedOrgFilter }) => (
  <div style={{ marginBottom: '24px' }}>
    {/* eslint-disable-next-line jsx-a11y/label-has-associated-control -- names the organization button group below (aria-labelledby), which has no single form control to point htmlFor at */}
    <label
      id="fa-fuel-org-filter-label"
      style={{
        display: 'block',
        marginBottom: 8,
        color: '#5D5D5E',
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      Filter by Organization
    </label>
    <div
      role="group"
      aria-labelledby="fa-fuel-org-filter-label"
      style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}
    >
      <button
        type="button"
        onClick={() => setSelectedOrgFilter('')}
        style={{
          padding: '6px 14px',
          borderRadius: '99px',
          fontSize: '13px',
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
          backgroundColor: selectedOrgFilter === '' ? '#3b82f6' : '#f1f5f9',
          color: selectedOrgFilter === '' ? '#fff' : '#64748b',
          transition: 'all 0.2s',
        }}
      >
        All Organizations
      </button>
      {organizations.map((org) => (
        <button
          key={org}
          type="button"
          onClick={() => setSelectedOrgFilter(org)}
          style={{
            padding: '6px 14px',
            borderRadius: '99px',
            fontSize: '13px',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            backgroundColor: selectedOrgFilter === org ? '#3b82f6' : '#f1f5f9',
            color: selectedOrgFilter === org ? '#fff' : '#64748b',
            transition: 'all 0.2s',
          }}
        >
          {org}
        </button>
      ))}
    </div>
  </div>
);

export default FuelOrgFilter;
