import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../utils/axiosConfig';
import { Card, SectionHead, Skeleton } from './settingsAtoms';

const MODES = [
  {
    key: 'INTERACTIVE',
    label: 'Ask the driver',
    desc: 'The WhatsApp bot asks for a dash photo or a typed reading. If the driver does not answer, it uses the FleetEdge reading.',
    tag: 'Default',
  },
  {
    key: 'FLEETEDGE',
    label: 'Read it from FleetEdge',
    desc: "Uses the truck's own odometer from telematics at the bill's time. The driver is not asked.",
  },
  {
    key: 'MANUAL',
    label: 'Manual only',
    desc: 'Needs a dash photo or typed reading checked by a person. Never filled from telematics.',
  },
];

/** How the odometer is captured when a driver sends a fuel bill on WhatsApp. */
export function WhatsAppSettings() {
  const [mode, setMode] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let live = true;
    apiClient
      .get('/api/whatsapp/settings')
      .then((res) => {
        if (live) setMode(res.data?.data?.odometerMode || 'INTERACTIVE');
      })
      .catch(() => {
        if (live) setMode('INTERACTIVE');
      });
    return () => {
      live = false;
    };
  }, []);

  const change = async (next) => {
    if (next === mode || saving) return;
    const prev = mode;
    setMode(next);
    setSaving(true);
    try {
      await apiClient.patch('/api/whatsapp/settings', { odometerMode: next });
      toast.success('Odometer setting saved');
    } catch (err) {
      setMode(prev);
      toast.error(err?.response?.data?.message || 'Could not save the odometer setting.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SectionHead
        id="stx-sec-whatsapp"
        title="WhatsApp bills"
        desc="How the odometer reading is filled in when a driver sends a fuel bill on WhatsApp."
      />
      <Card title="Odometer reading">
        {mode == null ? (
          <Skeleton rows={3} />
        ) : (
          <div className="stx-options" role="radiogroup" aria-label="Odometer reading">
            {MODES.map((m) => (
              <label
                key={m.key}
                htmlFor={`odometer-${m.key}`}
                className={`stx-option${mode === m.key ? ' stx-option--on' : ''}`}
                aria-disabled={saving || undefined}
              >
                <input
                  id={`odometer-${m.key}`}
                  aria-label={m.label}
                  type="radio"
                  name="odometer-mode"
                  value={m.key}
                  checked={mode === m.key}
                  disabled={saving}
                  onChange={() => change(m.key)}
                  className="stx-radio"
                />
                <span className="stx-option-text">
                  <span className="stx-option-label">
                    {m.label}
                    {m.tag ? <span className="stx-badge">{m.tag}</span> : null}
                  </span>
                  <span className="stx-option-desc">{m.desc}</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
