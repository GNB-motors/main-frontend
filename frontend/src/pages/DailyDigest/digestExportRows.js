export function buildDigestExportRows({ actions, money, morningBrief, upcoming }) {
  return [
    ...actions.map((a) => ({
      section: 'Needs Attention',
      vehicle: a.title,
      detail: a.desc,
      amount: a.amt ? a.amt.replace(/[₹,]/g, '') : '',
    })),
    ...(money?.idlingTop5 || []).map((r) => ({
      section: 'Idling',
      vehicle: r.registrationNumber,
      detail: `${r.idleMinutes} min`,
      amount: r.idleCostInr,
    })),
    ...(morningBrief?.sections || []).flatMap((sec) =>
      (sec.vehicles || []).map((v) => ({
        section: `Morning brief · ${sec.label}`,
        vehicle: v.registrationNumber,
        detail: v.durationMin ? `${v.durationMin} min` : v.excessL ? `${v.excessL} L` : '',
        amount: v.rupees,
      })),
    ),
    ...upcoming.map((u) => ({
      section: 'Upcoming',
      vehicle: u.registrationNumber,
      detail: u.kind,
      amount: '',
    })),
  ];
}
