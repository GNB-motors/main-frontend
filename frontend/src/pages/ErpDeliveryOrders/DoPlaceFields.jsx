import React, { useState } from 'react';
import { Info, Plus } from 'lucide-react';
import EntityPicker from '../../components/Erp/EntityPicker';
import { forgetEntitySearches } from '../../components/Erp/entityLookup.service';
import { getUserRole } from '../../utils/session';
import NewPlaceForm from './NewPlaceForm';
import { canAddPlaces, placesProblem } from './doPlaces';

const ENDS = [
  { field: 'pickupSiteId', type: 'PICKUP_SITE', label: 'Pickup point', noun: 'pickup point' },
  { field: 'dropSiteId', type: 'DROP_SITE', label: 'Drop point', noun: 'drop point' },
];

/**
 * The exact loading and unloading points of a DO. The route above only prices the
 * order; these are where the truck actually goes, and GPS is measured against them.
 */
const DoPlaceFields = ({ form, setField }) => {
  const canAdd = canAddPlaces(getUserRole());
  // Which end's new-place form is open: { field } | null.
  const [adding, setAdding] = useState(null);
  const [notice, setNotice] = useState(null);

  const saved = (field, site, existing) => {
    forgetEntitySearches('PICKUP_SITE', 'DROP_SITE');
    setField(field, site._id);
    setAdding(null);
    setNotice(
      existing ? { field, text: `Already saved as “${site.name}” — selected that one.` } : null,
    );
  };

  const problem = form.pickupSiteId && form.dropSiteId ? placesProblem(form) : null;

  return (
    <>
      {ENDS.map((end) => (
        <div className="erp-field full" key={end.field}>
          <label htmlFor={`do-${end.field}`}>
            {end.label} <span className="required">*</span>
          </label>
          <EntityPicker
            type={end.type}
            value={form[end.field]}
            onChange={(id) => {
              setField(end.field, id);
              setNotice(null);
            }}
            placeholder={`Search saved places for the ${end.noun}…`}
            required
          />
          {notice?.field === end.field && <span className="erp-field-hint">{notice.text}</span>}
          {adding?.field === end.field ? (
            <NewPlaceForm
              roleLabel={end.noun}
              onSaved={(site, existing) => saved(end.field, site, existing)}
              onCancel={() => setAdding(null)}
            />
          ) : canAdd ? (
            <button
              type="button"
              className="erp-inline-link"
              style={{ alignSelf: 'flex-start', marginTop: 4 }}
              onClick={() => setAdding({ field: end.field })}
            >
              <Plus size={12} /> New {end.noun}
            </button>
          ) : (
            <span className="erp-field-hint">Not listed? Ask an owner or manager to add it.</span>
          )}
        </div>
      ))}
      {problem && (
        <div className="erp-field full">
          <div className="erp-callout info">
            <Info size={16} />
            <span>{problem}</span>
          </div>
        </div>
      )}
    </>
  );
};

export default DoPlaceFields;
