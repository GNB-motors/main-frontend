import { classifyIssuePriority, isRecordResolved } from '../serviceIntelligenceLogic';

export const countFilterPills = (rows, activeTab) => {
  if (activeTab === 'REPAIR') {
    let p0 = 0;
    let p1 = 0;
    let p2 = 0;
    let p3 = 0;
    let open = 0;
    let resolved = 0;
    rows.forEach((r) => {
      const p = classifyIssuePriority(r);
      if (p.code === 'P0') p0 += 1;
      else if (p.code === 'P1') p1 += 1;
      else if (p.code === 'P2') p2 += 1;
      else if (p.code === 'P3') p3 += 1;

      if (isRecordResolved(r)) resolved += 1;
      else open += 1;
    });
    return { all: rows.length, p0, p1, p2, p3, open, resolved };
  }
  if (activeTab === 'SERVICE') {
    let periodic = 0;
    let oil = 0;
    let brake = 0;
    let electrical = 0;
    rows.forEach((r) => {
      const t =
        `${r.type || ''} ${r.serviceType || ''} ${r.maintenanceType || ''} ${r.notes || ''}`.toLowerCase();
      if (
        t.includes('periodic') ||
        t.includes('scheduled') ||
        t.includes('general') ||
        t.includes('routine')
      )
        periodic += 1;
      else if (t.includes('oil') || t.includes('lube') || t.includes('filter')) oil += 1;
      else if (
        t.includes('brake') ||
        t.includes('clutch') ||
        t.includes('suspension') ||
        t.includes('steering')
      )
        brake += 1;
      else if (
        t.includes('electric') ||
        t.includes('battery') ||
        t.includes('light') ||
        t.includes('wiring')
      )
        electrical += 1;
    });
    return { all: rows.length, periodic, oil, brake, electrical };
  }
  return {};
};

export const filterDisplayedRows = (rows, activeTab, activePriorityFilter, activeServiceFilter) => {
  if (activeTab === 'REPAIR') {
    if (activePriorityFilter === 'ALL') return rows;
    if (activePriorityFilter === 'OPEN') return rows.filter((r) => !isRecordResolved(r));
    if (activePriorityFilter === 'RESOLVED') return rows.filter((r) => isRecordResolved(r));
    return rows.filter((r) => classifyIssuePriority(r).code === activePriorityFilter);
  }
  if (activeTab === 'SERVICE') {
    if (activeServiceFilter === 'ALL') return rows;
    if (activeServiceFilter === 'PERIODIC') {
      return rows.filter((r) => {
        const t =
          `${r.type || ''} ${r.serviceType || ''} ${r.maintenanceType || ''} ${r.notes || ''}`.toLowerCase();
        return (
          t.includes('periodic') ||
          t.includes('scheduled') ||
          t.includes('general') ||
          t.includes('routine')
        );
      });
    }
    if (activeServiceFilter === 'OIL') {
      return rows.filter((r) => {
        const t =
          `${r.type || ''} ${r.serviceType || ''} ${r.maintenanceType || ''} ${r.notes || ''}`.toLowerCase();
        return t.includes('oil') || t.includes('lube') || t.includes('filter');
      });
    }
    if (activeServiceFilter === 'BRAKE') {
      return rows.filter((r) => {
        const t =
          `${r.type || ''} ${r.serviceType || ''} ${r.maintenanceType || ''} ${r.notes || ''}`.toLowerCase();
        return (
          t.includes('brake') ||
          t.includes('clutch') ||
          t.includes('suspension') ||
          t.includes('steering')
        );
      });
    }
    if (activeServiceFilter === 'ELECTRICAL') {
      return rows.filter((r) => {
        const t =
          `${r.type || ''} ${r.serviceType || ''} ${r.maintenanceType || ''} ${r.notes || ''}`.toLowerCase();
        return (
          t.includes('electric') ||
          t.includes('battery') ||
          t.includes('light') ||
          t.includes('wiring')
        );
      });
    }
  }
  return rows;
};
