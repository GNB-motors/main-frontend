import { useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { Upload, FileSpreadsheet, Info } from 'lucide-react';
import useApi from '../../hooks/useApi';
import useMutation from '../../hooks/useMutation';
import SapService from '../../services/SapService';
import PageShell from '../../components/ui/PageShell';
import { Button } from '../../components/ui/button';
import SapRequestState from './SapRequestState';
import SapSettingsForm from './SapSettingsForm';
import SapImportPreview from './SapImportPreview';
import { canEditSap, sheetCsv } from './sapModel';
import { entriesToApply, initialChoices } from './sapImportModel';
import { getUserRole } from '../../utils/session';
import './Sap.css';

/**
 * SAP settings, and the sheet import. A sheet never becomes SAP by itself: it is read into
 * proposed route SAPs, the person checks the places and values, and only what they apply is saved.
 */
export default function SapSettings() {
  const q = useApi((signal) => SapService.settings({ signal }), []);
  const canEdit = canEditSap(getUserRole());
  // { preview, choices } once a sheet has been read; null before.
  const [draft, setDraft] = useState(null);
  const [reading, setReading] = useState(false);
  const [fileName, setFileName] = useState('');
  const sequence = useRef(0);
  const fileInput = useRef(null);
  const preview = useMutation(SapService.importPreview);
  const apply = useMutation(SapService.importApply);
  const busy = reading || preview.loading || apply.loading;

  const propose = async (body) => {
    try {
      const result = await preview.mutate(body);
      setDraft({ preview: result, choices: initialChoices(result.proposals) });
    } catch (err) {
      setDraft(null);
      toast.error(err?.message || 'Could not read the sheet');
    }
  };
  const choose = async (file) => {
    const seq = ++sequence.current;
    setDraft(null);
    setFileName(file?.name || '');
    if (!file) return;
    setReading(true);
    try {
      const csv = await sheetCsv(file);
      if (csv.length > 900000)
        throw new Error('The sheet is too large. Choose a CSV under 900,000 characters.');
      if (seq === sequence.current) await propose({ csv });
    } catch (err) {
      toast.error(err?.message || 'Could not read sheet');
    } finally {
      if (seq === sequence.current) setReading(false);
    }
  };
  const entries = draft ? entriesToApply(draft.preview.proposals, draft.choices) : [];
  const save = async () => {
    if (!entries.length || busy) return;
    try {
      const res = await apply.mutate({ entries });
      toast.success(
        `${res.created} route SAPs saved${res.unchanged ? `, ${res.unchanged} already set` : ''} — trips refresh shortly`,
      );
      setDraft(null);
      setFileName('');
      if (fileInput.current) fileInput.current.value = '';
    } catch (err) {
      toast.error(err?.message || 'Could not save the route SAPs');
    }
  };
  const change = (ref, patch) =>
    setDraft((d) => ({ ...d, choices: { ...d.choices, [ref]: { ...d.choices[ref], ...patch } } }));

  return (
    <PageShell
      className="sap-panel sap-page"
      title="SAP settings"
      subtitle="How trips are compared with their route's SAP, and importing SAP from a sheet."
    >
      <div className="sap-settings-grid">
        <SapRequestState query={q}>
          {q.data && (
            <SapSettingsForm
              key={JSON.stringify(q.data)}
              settings={q.data}
              canEdit={canEdit}
              onSaved={q.refetch}
            />
          )}
        </SapRequestState>
        {canEdit && (
          <section className="sap-card">
            <div className="sap-card-heading">
              <FileSpreadsheet aria-hidden="true" />
              <div>
                <h2>Import SAP from a sheet</h2>
                <p>
                  Each sheet lane becomes a proposed route SAP. Check its places and values, then
                  save the ones you want.
                </p>
              </div>
            </div>
            <label className="sap-upload-zone">
              <Upload size={26} aria-hidden="true" />
              <strong>{fileName || 'Choose a CSV or Excel file'}</strong>
              <span>Headers: FROM, TO, SAP · CSV or XLSX (first sheet)</span>
              <input
                type="file"
                aria-label="Sheet file"
                ref={fileInput}
                accept=".csv,.xlsx"
                disabled={busy}
                onChange={(e) => choose(e.target.files?.[0])}
              />
            </label>
            <Button
              variant="outline"
              type="button"
              disabled={busy}
              onClick={() => propose({ fromStoredSheet: true })}
            >
              Use the lane sheet already uploaded
            </Button>
            {busy && !draft && (
              <p role="status" className="sap-muted">
                Reading the sheet…
              </p>
            )}
            {draft && (
              <>
                <SapImportPreview
                  preview={draft.preview}
                  choices={draft.choices}
                  onChange={change}
                />
                <div className="sap-notice">
                  <Info size={16} aria-hidden="true" />
                  <span>
                    Saving replaces the SAP of each selected route. Earlier values stay in its
                    history.
                  </span>
                </div>
                <div className="sap-card-footer">
                  <Button type="button" disabled={busy || !entries.length} onClick={save}>
                    {apply.loading ? 'Saving…' : `Save ${entries.length} route SAPs`}
                  </Button>
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </PageShell>
  );
}
