const StatusKpiCard = (props) => {
  const { icon: Icon, label, value, colorClass } = props;
  return (
    <div className={`fc-kpi-card fc-kpi-${colorClass}`}>
      <div className="fc-kpi-icon-wrap">
        <Icon size={20} />
      </div>
      <div className="fc-kpi-content">
        <span className="fc-kpi-label">{label}</span>
        <span className="fc-kpi-value">{value ?? '0'}</span>
      </div>
    </div>
  );
};

export default StatusKpiCard;
