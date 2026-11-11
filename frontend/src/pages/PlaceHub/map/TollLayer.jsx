import { memo, useState } from 'react';
import { InfoWindowF, MarkerF } from '@react-google-maps/api';
import { tollPopupLines } from '../model/tollPlazas.js';
import { tollMarkerIcon } from '../../LiveTracking/mapPlaceIcon.js';

/**
 * Toll plazas: solid where this org's trucks have been, hollow for the rest (shown only with the
 * "All tolls" toggle). Clicking one opens what is known about it.
 */
const TollLayer = memo(function TollLayer({ plazas, interactive }) {
  const [openId, setOpenId] = useState(null);
  const open = plazas.find((p) => p.id === openId) || null;
  return (
    <>
      {plazas.map((p) => (
        <MarkerF
          key={`toll-${p.id}`}
          position={{ lat: p.lat, lng: p.lng }}
          icon={tollMarkerIcon(p.visited)}
          title={`${p.name || 'Toll Plaza'} · ${p.visited ? 'Used by your fleet' : 'Other toll plaza'}`}
          clickable={interactive}
          onClick={() => setOpenId(p.id)}
          zIndex={p.visited ? 2 : 1}
        />
      ))}
      {open ? (
        <InfoWindowF
          position={{ lat: open.lat, lng: open.lng }}
          onCloseClick={() => setOpenId(null)}
        >
          <div className="ph-toll-pop">
            <strong className="ph-toll-pop-title">{open.name || 'Toll Plaza'}</strong>
            <dl className="ph-toll-pop-lines">
              {tollPopupLines(open).map(([label, text]) => (
                <div key={label} className="ph-toll-pop-line">
                  <dt>{label}</dt>
                  <dd>{text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </InfoWindowF>
      ) : null}
    </>
  );
});

export default TollLayer;
