import { useRef, useState } from 'react';
import { toast } from 'react-toastify';
import useApi from '../../hooks/useApi';
import useMutation from '../../hooks/useMutation';
import SapService from '../../services/SapService';
import SapRequestState from './SapRequestState';
import { canEditSap, sheetCsv } from './sapModel';
import { getUserRole } from '../../utils/session';
import { Upload, FileSpreadsheet, Info } from 'lucide-react';
import PageShell from '../../components/ui/PageShell';
import { Button } from '../../components/ui/button';
import SapSettingsForm from './SapSettingsForm';
import SapImportPreview from './SapImportPreview';
import './Sap.css';
export default function SapSettings() {
  const q = useApi((signal) => SapService.settings({ signal }), []);
  const canEdit = canEditSap(getUserRole());
  const [csv, setCsv] = useState(null);
  const [preview, setPreview] = useState(null);
  const [reading, setReading] = useState(false);
  const [fileName, setFileName] = useState('');
  const sequence = useRef(0);
  const fileInput = useRef(null);
  const m = useMutation(SapService.importSheet);
  const busy = reading || m.loading;
  const choose = async (file) => {
    const seq = ++sequence.current;
    setCsv(null);
    setPreview(null);
    setFileName(file?.name || '');
    if (!file) return;
    setReading(true);
    try {
      const text = await sheetCsv(file);
      if (text.length > 900000)
        throw new Error('The sheet is too large. Choose a CSV under 900,000 characters.');
      if (seq === sequence.current) setCsv(text);
    } catch (err) {
      toast.error(err?.message || 'Could not read sheet');
    } finally {
      if (seq === sequence.current) setReading(false);
    }
  };
  const upload = async (dryRun) => {
    if (!canEdit || busy || !csv || (!dryRun && !preview)) return;
    try {
      const result = await m.mutate({ csv, dryRun });
      if (dryRun) setPreview(result);
      else {
        toast.success('SAP updated — trips refresh shortly');
        setCsv(null);
        setPreview(null);
        setFileName('');
        if (fileInput.current) fileInput.current.value = '';
      }
    } catch (err) {
      setPreview(null);
      toast.error(err?.message || 'Could not import sheet');
    }
  };
  return (
    <PageShell
      className="sap-panel sap-page"
      title="SAP settings"
      subtitle="Manage your distance reference, comparison rules and sheet imports."
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
                <h2>Upload SAP sheet</h2>
                <p>Choose a sheet, review the changes, then apply the import.</p>
              </div>
            </div>
            <label className="sap-upload-zone">
              <Upload size={26} aria-hidden="true" />
              <strong>{fileName || 'Choose a CSV or Excel file'}</strong>
              <span>Headers: FROM, TO, SAP · CSV or XLSX</span>
              <input
                type="file"
                aria-label="Sheet file"
                ref={fileInput}
                accept=".csv,.xlsx"
                disabled={busy}
                onChange={(e) => choose(e.target.files?.[0])}
              />
            </label>
            <p className="sap-muted">
              Only the first worksheet is imported. Upload a new file to replace the current
              preview.
            </p>
            {reading && (
              <p role="status" className="sap-muted">
                Reading your sheet…
              </p>
            )}
            {preview && (
              <>
                <SapImportPreview result={preview} />
                <div className="sap-notice sap-notice--warning">
                  <Info size={16} aria-hidden="true" />
                  <span>
                    Confirming applies this sheet, including replaced lanes and lanes removed from
                    the sheet. Review the counts above before importing.
                  </span>
                </div>
              </>
            )}
            <div className="sap-card-footer">
              <Button
                variant="outline"
                type="button"
                disabled={busy || !csv}
                onClick={() => upload(true)}
              >
                {busy ? 'Working…' : preview ? 'Refresh preview' : 'Preview import'}
              </Button>
              {preview && (
                <Button type="button" disabled={busy || !csv} onClick={() => upload(false)}>
                  Confirm import
                </Button>
              )}
            </div>
          </section>
        )}
      </div>
    </PageShell>
  );
}
