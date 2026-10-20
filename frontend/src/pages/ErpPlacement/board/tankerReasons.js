import { BOARD_STATE_LABEL } from './boardState';

const reasons = (t) => {
  const list = [];
  if (t.boardState === 'RETURNING') {
    list.push({
      ok: true,
      text: `Unloaded — still running home on ${t.returningFromTrip || 'the previous trip'}`,
    });
  } else if (t.boardState === 'NEXT_PLANNED') {
    list.push({
      ok: false,
      text: `Already queued on ${t.plannedTripNumber || 'another trip'}`,
    });
  } else {
    list.push({
      ok: t.isAvailable,
      text: t.isAvailable ? 'No active trip' : BOARD_STATE_LABEL[t.boardState] || t.boardState,
    });
  }
  if (t.isCompatible !== null) {
    list.push({
      ok: t.isCompatible,
      text: t.isCompatible
        ? t.requiresCleaning
          ? `Compatible after cleaning (last carried ${t.previousMaterial || 'nothing'})`
          : 'Material compatible'
        : t.incompatibleReason || 'Material not compatible',
    });
  }
  return list;
};

export default reasons;
