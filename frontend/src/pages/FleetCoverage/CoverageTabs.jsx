export default function CoverageTabs({
  activeTab,
  setActiveTab,
  onlyEdgeFiltered,
  onlyMasterFiltered,
}) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-200">
      <button
        type="button"
        className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-colors ${
          activeTab === 'edge'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-slate-500 hover:text-slate-800'
        }`}
        onClick={() => setActiveTab('edge')}
      >
        <span>On FleetEdge, not in fleet</span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-bold ${
            activeTab === 'edge' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {onlyEdgeFiltered.length}
        </span>
      </button>
      <button
        type="button"
        className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-colors ${
          activeTab === 'master'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-slate-500 hover:text-slate-800'
        }`}
        onClick={() => setActiveTab('master')}
      >
        <span>In fleet master, not on FleetEdge</span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-bold ${
            activeTab === 'master' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {onlyMasterFiltered.length}
        </span>
      </button>
    </div>
  );
}
