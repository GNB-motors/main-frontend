export default function CardHead({ title, action }) {
  return (
    <div className="v360-card-head">
      <p className="v360-card-title">{title}</p>
      {action}
    </div>
  );
}
