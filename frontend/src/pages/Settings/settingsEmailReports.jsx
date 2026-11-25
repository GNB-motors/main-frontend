import { useState } from 'react';
import { toast } from 'react-toastify';
import useApi from '../../hooks/useApi';
import { SettingsService } from './SettingsService';
import { Card, LoadError, SectionHead, Skeleton } from './settingsAtoms';
import { parseRecipients, MAX_RECIPIENTS } from '../../components/ui/recipients';

/**
 * Scheduled report e-mails: the fuel report (Excel attached) every day and/or
 * every Monday. An owner changes it; a manager reads it.
 *
 * The controls are guidance for the UI — the backend is what decides who may
 * read and who may write these settings.
 */
export function EmailReportSettings({ canEdit }) {
  const { data, error, refetch } = useApi(
    (signal) => SettingsService.getEmailReportSettings({ signal }),
    [],
  );
  const [saved, setSaved] = useState(null);
  const [draftRecipients, setDraftRecipients] = useState(null);
  const [saving, setSaving] = useState(false);

  const settings = saved || data;
  const recipients = settings?.recipients || [];
  const defaultRecipients = settings?.defaultRecipients || [];
  const recipientsText = draftRecipients ?? recipients.join(', ');

  const save = async (patch) => {
    setSaving(true);
    try {
      const res = await SettingsService.updateEmailReportSettings(patch);
      // The answer is merged with the patch, so a backend that answers with
      // only the changed key still leaves the form in the state that was saved.
      setSaved({ ...(settings || {}), ...(res || {}), ...patch });
      setDraftRecipients(null);
      toast.success('Email reports saved');
    } catch (err) {
      toast.error(err?.message || 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  const saveRecipients = async (e) => {
    e.preventDefault();
    const { valid, invalid } = parseRecipients(recipientsText);
    if (invalid.length) {
      toast.error(`Not an email address: ${invalid.join(', ')}`);
      return;
    }
    if (valid.length > MAX_RECIPIENTS) {
      toast.error(`At most ${MAX_RECIPIENTS} addresses.`);
      return;
    }
    // An empty list is allowed: the backend then mails the company owner(s).
    await save({ recipients: valid });
  };

  return (
    <>
      <SectionHead
        id="stx-sec-email-reports"
        title="Email reports"
        desc="The fuel report as an Excel file, emailed at 08:00 IST."
      />
      {!settings && error ? (
        <Card title="Scheduled emails">
          <LoadError message="Could not load the email report settings." onRetry={refetch} />
        </Card>
      ) : !settings ? (
        <Card title="Scheduled emails">
          <Skeleton rows={3} />
        </Card>
      ) : (
        <>
          {!settings.serverEnabled || !settings.emailConfigured ? (
            <p className="stx-hint">
              <span className="stx-badge">Off on the server</span>
              Scheduled emails are switched off for this organisation right now. Your choices are
              saved and start once the backend switches them on.
            </p>
          ) : null}

          <Card title="Scheduled emails">
            <label className="stx-toggle">
              <input
                type="checkbox"
                aria-label="Daily fuel report"
                checked={Boolean(settings.daily)}
                disabled={!canEdit || saving}
                onChange={(e) => save({ daily: e.target.checked })}
              />
              <span>
                <strong>Daily fuel report</strong>
                <small>Every day at {settings.sendTimeIst || '08:00'} IST — yesterday&apos;s fills.</small>
              </span>
            </label>
            <label className="stx-toggle">
              <input
                type="checkbox"
                aria-label="Weekly fuel report"
                checked={Boolean(settings.weekly)}
                disabled={!canEdit || saving}
                onChange={(e) => save({ weekly: e.target.checked })}
              />
              <span>
                <strong>Weekly fuel report</strong>
                <small>
                  Every {settings.weeklyDay || 'Monday'} at {settings.sendTimeIst || '08:00'} IST — the
                  last 7 days.
                </small>
              </span>
            </label>
          </Card>

          <Card title="Who gets them">
            {canEdit ? (
              <form className="stx-inline-form" onSubmit={saveRecipients}>
                <label htmlFor="er-recipients" className="stx-label">
                  Emails
                </label>
                <input
                  id="er-recipients"
                  aria-label="Recipients"
                  className="stx-input"
                  value={recipientsText}
                  onChange={(e) => setDraftRecipients(e.target.value)}
                  placeholder={defaultRecipients.join(', ') || 'owner@company.com'}
                  disabled={saving}
                />
                <button type="submit" className="stx-btn stx-btn--primary" disabled={saving}>
                  Save
                </button>
              </form>
            ) : (
              <p className="stx-readonly">
                {recipients.length ? recipients.join(', ') : 'The company owner(s).'} Ask an owner to
                change it.
              </p>
            )}
            {!recipients.length ? (
              <p className="stx-hint">
                <span className="stx-badge">Default</span>
                Empty means the company owner{defaultRecipients.length > 1 ? 's' : ''}:{' '}
                {defaultRecipients.join(', ') || 'no owner email on file'}.
              </p>
            ) : null}
          </Card>
        </>
      )}
    </>
  );
}
