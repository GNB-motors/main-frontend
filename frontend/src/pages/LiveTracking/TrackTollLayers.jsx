import { useState } from 'react';
import { InfoWindowF, MarkerF } from '@react-google-maps/api';
import { replayTolls } from './trackTollsModel';

const dateTime = (at) =>
  new Date(at).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });

/** Toll evidence is independent of trip legs and of the generic Places toggle. */
export default function TrackTollLayers({ passes = [], playheadTime }) {
  const [selectedId, setSelectedId] = useState(null);
  const markers = replayTolls(passes, playheadTime);
  const selected = markers.find((pass) => pass.id === selectedId);
  return (
    <>
      {markers.map((pass) => (
        <MarkerF
          key={pass.id}
          position={{ lat: pass.lat, lng: pass.lng }}
          icon={{
            path: 'M -9,9 L -9,-3 L -5,-8 L 5,-8 L 9,-3 L 9,9 L 4,9 L 4,0 L -4,0 L -4,9 Z',
            fillColor: pass.passed ? '#0f766e' : '#ffffff',
            fillOpacity: 1,
            strokeColor: '#0f766e',
            strokeWeight: 2,
            scale: 1,
          }}
          label={{
            text: 'T',
            color: pass.passed ? '#ffffff' : '#0f766e',
            fontSize: '10px',
            fontWeight: '700',
          }}
          title={`${pass.name || 'Toll booth'} · ${pass.label} · ${dateTime(pass.at)} IST`}
          zIndex={75}
          onClick={() => setSelectedId(pass.id)}
        />
      ))}
      {selected ? (
        <InfoWindowF
          position={{ lat: selected.lat, lng: selected.lng }}
          onCloseClick={() => setSelectedId(null)}
        >
          <div style={{ padding: '4px 6px', maxWidth: 240, color: '#172033', fontSize: 13 }}>
            <strong>{selected.name || 'Toll booth'}</strong>
            <p style={{ margin: '6px 0' }}>{selected.label}</p>
            <span>{dateTime(selected.at)} IST</span>
            {!selected.passed && selected.action !== 'Toll crossed' ? (
              <p>{selected.action}</p>
            ) : null}
          </div>
        </InfoWindowF>
      ) : null}
    </>
  );
}
