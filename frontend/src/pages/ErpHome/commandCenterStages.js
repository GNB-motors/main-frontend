export const STAGES = [
  { k: 'do', l: 'DOs open', verb: 'Place vehicle', col: 'DO' },
  { k: 'cn', l: 'Pending CN', verb: 'Generate CN', drawer: 'cn' },
  { k: 'dispatch', l: 'Awaiting dispatch', verb: 'Pay advance' },
  { k: 'close', l: 'Pending close', verb: 'Close trip', drawer: 'close' },
  { k: 'pod', l: 'Pending POD', verb: 'Record POD', drawer: 'pod' },
  { k: 'unload', l: 'Pending unload', verb: 'Mark unloaded', drawer: 'unloading' },
  { k: 'bill', l: 'Pending bill', verb: 'Create bill' },
];
export const stageOf = (k) => STAGES.find((s) => s.k === k);
