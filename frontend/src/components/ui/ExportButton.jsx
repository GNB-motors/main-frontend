import { useEffect, useRef, useState } from 'react';
import { Download, FileSpreadsheet, FileText, Loader2, ChevronDown } from 'lucide-react';
import { toast } from 'react-toastify';
import exportTable from '../../lib/exportTable';
import NewButton from './NewButton/NewButton';

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
 *
 * `compact` renders the trigger as a small pill matching DataTable's own
 * toolbar (`.dt-tool`) for pages that mount this inside the table instead of
 * a separate filter row.
 */
export default function ExportButton({
  rows = [],
  columns = [],
  filename = 'export',
  fetchAll = null,
  meta = {},
  disabled = false,
  newButtonStyle = false,
  compact = false,
  buttonClass = '',
  align = 'right',
}) {
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
      toast.success(
        `Exported ${result.rows} row${result.rows === 1 ? '' : 's'} to ${format.toUpperCase()}`,
      );
    } catch (err) {
      toast.error(`Export failed: ${err?.message || 'unknown error'}`);
    } finally {
      setPending(false);
    }
  };

  const icon = pending ? (
    <Loader2 size={15} className="xbtn-spin" aria-hidden="true" />
  ) : (
    <Download size={15} aria-hidden="true" />
  );
  const label = pending ? 'Exporting…' : 'Export';

  return (
    <div
      className={`xbtn ${open ? 'is-open' : ''} ${align === 'left' ? 'xbtn--left' : ''}`}
      ref={rootRef}
    >
      {compact ? (
        <button
          type="button"
          className="dt-tool"
          disabled={disabled || pending}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {icon}
          {label}
        </button>
      ) : newButtonStyle ? (
        <NewButton
          type="button"
          variant="secondary"
          text={label}
          prependIcon={icon}
          appendIcon={<ChevronDown size={14} className="xbtn-chevron" aria-hidden="true" />}
          appendGap={4}
          disabled={disabled || pending}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        />
      ) : (
        <button
          type="button"
          className={buttonClass || 'pshell-btn'}
          disabled={disabled || pending}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {icon}
          <span>{label}</span>
          <ChevronDown size={14} className="xbtn-chevron" aria-hidden="true" />
        </button>
      )}
      {open && (
        <div
          className={`xbtn-menu ${align === 'left' ? 'is-left' : ''}`}
          role="menu"
          aria-label="Export format"
        >
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
