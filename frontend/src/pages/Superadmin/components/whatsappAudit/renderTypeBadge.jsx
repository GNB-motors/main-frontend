import { FileText, ImageIcon, MapPin, MessageSquare, MousePointerClick } from 'lucide-react';

// Render message type badge
const renderTypeBadge = (type) => {
  switch (type) {
    case 'image':
      return (
        <span className="wa-badge wa-badge--neutral">
          <ImageIcon size={12} /> Photo
        </span>
      );
    case 'document':
      return (
        <span className="wa-badge wa-badge--neutral">
          <FileText size={12} /> Document
        </span>
      );
    case 'interactive':
      return (
        <span className="wa-badge wa-badge--neutral">
          <MousePointerClick size={12} /> Interactive
        </span>
      );
    case 'location':
      return (
        <span className="wa-badge wa-badge--neutral">
          <MapPin size={12} /> Location
        </span>
      );
    default:
      return (
        <span className="wa-badge wa-badge--neutral">
          <MessageSquare size={12} /> Text
        </span>
      );
  }
};

export default renderTypeBadge;
