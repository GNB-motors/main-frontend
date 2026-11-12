import { useState } from 'react';
import { toast } from 'react-toastify';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext.jsx';
import { getUserRole } from '../../utils/session.js';
import { SettingsService } from './SettingsService';
import { Card, LoadError, SectionHead, Skeleton } from './settingsAtoms';

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

/** How the bot reads what the sender sends (plan §8.1). */
const CAPTURE_MODES = [
  {
    key: 'GUIDED',
    label: 'Ask the sender questions',
    desc: 'The bot asks for what a message is missing (truck, full or partial) before it saves a fill.',
    tag: 'Default',
  },
  {
    key: 'SILENT',
    label: 'Just receive and read',
    desc: 'The bot asks nothing. It reads every photo as it arrives and saves what it can.',
  },
];

/** How the odometer is captured when a driver sends a fuel bill on WhatsApp. */
export function WhatsAppSettings() {
  // /api/auth/me already carries organization.whatsappSettings; the server
  // treats an unset mode as INTERACTIVE.
  const { organization, ready, refresh } = useFeatureFlags();
  const saved = organization ? organization.whatsappSettings?.odometerMode || 'INTERACTIVE' : null;
  // The choice made on this page; until then the loaded setting is the truth.
  const [chosen, setChosen] = useState(null);
  const mode = chosen ?? saved;
  const [saving, setSaving] = useState(false);

  const change = async (next) => {
    if (next === mode || saving) return;
    const prev = mode;
    setChosen(next);
    setSaving(true);
    try {
      await SettingsService.updateWhatsAppOdometerMode(next);
      toast.success('Odometer setting saved');
      refresh();
    } catch (err) {
      setChosen(prev);
      toast.error(err?.message || 'Could not save the odometer setting.');
    } finally {
      setSaving(false);
    }
  };

  // The capture mode rides on the same /api/auth/me payload; an unset mode
  // is the server default (guided).
  const savedCapture = organization
    ? organization.whatsappSettings?.captureMode || 'GUIDED'
    : null;
  const [chosenCapture, setChosenCapture] = useState(null);
  const captureMode = chosenCapture ?? savedCapture;
  const [savingCapture, setSavingCapture] = useState(false);

  // How the bot reads what the sender sends is the owner's call (plan §8.4):
  // the server refuses the change for anyone else, so the card says so too.
  const userRole = (getUserRole() || '').toUpperCase();
  const canChangeCapture = ['OWNER', 'SUPER_ADMIN'].includes(userRole);

  const changeCapture = async (next) => {
    if (next === captureMode || savingCapture || !canChangeCapture) return;
    const prev = captureMode;
    setChosenCapture(next);
    setSavingCapture(true);
    try {
      await SettingsService.updateWhatsAppCaptureMode(next);
      toast.success('WhatsApp capture setting saved');
      refresh();
    } catch (err) {
      setChosenCapture(prev);
      toast.error(err?.message || 'Could not save the WhatsApp capture setting.');
    } finally {
      setSavingCapture(false);
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
        {mode == null && ready ? (
          <LoadError message="Could not load the odometer setting." onRetry={refresh} />
        ) : mode == null ? (
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

      {organization ? (
        <Card title="How the bot reads messages">
          <div className="stx-options" role="radiogroup" aria-label="How the bot reads messages">
            {CAPTURE_MODES.map((m) => (
              <label
                key={m.key}
                htmlFor={`capture-${m.key}`}
                className={`stx-option${captureMode === m.key ? ' stx-option--on' : ''}`}
                aria-disabled={savingCapture || !canChangeCapture || undefined}
              >
                <input
                  id={`capture-${m.key}`}
                  aria-label={m.label}
                  type="radio"
                  name="capture-mode"
                  value={m.key}
                  checked={captureMode === m.key}
                  disabled={savingCapture || !canChangeCapture}
                  onChange={() => changeCapture(m.key)}
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
          {!canChangeCapture ? (
            <p className="stx-empty-hint">Only the owner can change how the bot reads messages.</p>
          ) : null}
        </Card>
      ) : null}
    </>
  );
}
