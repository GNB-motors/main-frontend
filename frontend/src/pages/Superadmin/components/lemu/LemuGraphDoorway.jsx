import React, { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Boxes, ArrowRight } from 'lucide-react';
import './LemuGraphDoorway.css';

/* Doorway for the Graph tab on the LEMU page.

   The graph moved to its own full-page route (/superadmin/graph) — this
   placeholder says so and links through, carrying every search param the
   graph understands (layer, q, hops, mode, gview, node) so old
   ?tab=graph&layer=infra bookmarks degrade into an equivalent deep link
   instead of a dead end. */
const LemuGraphDoorway = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const openGraph = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('tab'); // the graph page owns the whole route; tab is meaningless there
    const qs = next.toString();
    navigate(`/superadmin/graph${qs ? `?${qs}` : ''}`);
  }, [navigate, searchParams]);

  return (
    <div className="lemu-graph-doorway">
      <div className="lemu-graph-doorway__icon"><Boxes size={26} /></div>
      <h3 className="lemu-graph-doorway__title">The graph moved</h3>
      <p className="lemu-graph-doorway__body">
        The knowledge graph now lives on its own full-page view — it needs the
        whole screen. Your current filters and selections travel with you.
      </p>
      <button type="button" className="lemu-graph-doorway__btn" onClick={openGraph}>
        Open the full graph
        <ArrowRight size={14} />
      </button>
    </div>
  );
};

export default LemuGraphDoorway;
