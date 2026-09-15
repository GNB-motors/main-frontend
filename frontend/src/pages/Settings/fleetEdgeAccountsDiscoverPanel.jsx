import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { discoverVehicles } from '../Profile/FleetEdgeAccountService';
import { getToken } from '../../utils/session.js';

export default function DiscoverPanel({ account, onClose }) {
  const [candidates, setCandidates] = useState(null);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const discover = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const list = await discoverVehicles(token, account._id);
      setCandidates(list);
      setSelected([]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Discover failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    discover();
  }, []);

  const toggle = (reg) =>
    setSelected((s) => (s.includes(reg) ? s.filter((r) => r !== reg) : [...s, reg]));

  const assign = async () => {
    if (!selected.length) return;
    setAssigning(true);
    try {
      // For /assign we need vehicleIds, but candidates are registrations.
      // Use a note to operator: they'll need to map regs to vehicle IDs.
      // For now, surface the list — OWNER can confirm via the vehicles page.
      toast.info(
        `Select vehicles on the Vehicles page and use reassign to tag them to this account. (${selected.length} registrations copied to clipboard)`,
      );
      navigator.clipboard?.writeText(selected.join(', '));
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Vehicles found in FleetEdge for this account that are not yet tagged in this org:
      </p>
      {loading && <p className="text-sm text-slate-400">Fetching from FleetEdge…</p>}
      {candidates !== null &&
        !loading &&
        (candidates.length === 0 ? (
          <p className="text-sm text-slate-400">All vehicles are already tagged.</p>
        ) : (
          <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200">
            {candidates.map((reg) => (
              <label
                key={reg}
                className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-2.5 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(reg)}
                  onChange={() => toggle(reg)}
                  className="h-4 w-4 rounded"
                />
                <span className="text-sm font-mono text-slate-700">{reg}</span>
              </label>
            ))}
          </div>
        ))}
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Close
        </button>
        {candidates?.length > 0 && (
          <button
            onClick={assign}
            disabled={!selected.length || assigning}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Copy selected regs
          </button>
        )}
      </div>
    </div>
  );
}
