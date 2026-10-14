import { AlertTriangle, Clock } from 'lucide-react';

const AgeingFlag = ({ trip }) => {
  if (trip.ageingFlag) {
    return (
      <span className="trippipe-flag">
        <AlertTriangle size={11} /> {trip.ageingDays}d
      </span>
    );
  }
  if (trip.ageingDays >= 30) {
    return (
      <span className="trippipe-flag warn">
        <Clock size={11} /> {trip.ageingDays}d
      </span>
    );
  }
  return null;
};

export default AgeingFlag;
