import { useEffect, useRef, useState } from 'react';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import exportTable from '../../lib/exportTable';

/**
 * ExportButton — the one export affordance for every fleet table.
 *
 * Excel (.xlsx) is the default; CSV is the secondary choice. `xlsx` is
 * loaded with a dynamic import inside the handler — never a top-level
 * import — so the 424 KB library stays out of the entry chunk.
 *
 * If `fetchAll` is provided it is awaited first, so the file carries every
 * filtered row, not just the current page. The success toast names the
 * exact row count; failure surfaces as a toast, never a silent miss.
 *
 *   <ExportButton
 *     rows={pageRows}
 *     columns={columns}
 *     filename="fleet-alerts"
 *     fetchAll={async () => (await fetchAllFiltered()).items}
 *     meta={{ filters: activeFilterMeta }}
 *   />
 */
export default function ExportButton({ rows = [], columns = [], filename = 'export', fetchAll = null, meta = {}, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const run = async (format) => {
    setOpen(false);
    if (pending) return;
    setPending(true);
    try {
      const allRows = fetchAll ? await fetchAll() : rows;
      const safeRows = Array.isArray(allRows) ? allRows : [];
      const result = await exportTable({ rows: safeRows, columns, filename, format, meta });
      toast.success(`Exported ${result.rows} row${result.rows === 1 ? '' : 's'} to ${format.toUpperCase()}`);
    } catch (err) {
      toast.error(`Export failed: ${err?.message || 'unknown error'}`);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="xbtn" ref={rootRef}>
      <button
        type="button"
        className="pshell-btn"
        disabled={disabled || pending}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {pending ? <Loader2 size={14} className="xbtn-spin" aria-hidden="true" /> : <Download size={14} aria-hidden="true" />}
        {pending ? 'Exporting…' : 'Export'}
      </button>
      {open && (
        <div className="xbtn-menu" role="menu" aria-label="Export format">
          <button type="button" role="menuitem" className="xbtn-item" onClick={() => run('xlsx')}>
            <FileSpreadsheet size={14} aria-hidden="true" />
            <span>
              <strong>Excel (.xlsx)</strong>
              <small>Formatted — dates, ₹ columns, frozen header</small>
            </span>
          </button>
          <button type="button" role="menuitem" className="xbtn-item" onClick={() => run('csv')}>
            <FileText size={14} aria-hidden="true" />
            <span>
              <strong>CSV (.csv)</strong>
              <small>Plain text — opens anywhere</small>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
