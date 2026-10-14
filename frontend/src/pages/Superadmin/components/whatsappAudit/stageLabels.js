import {
  AlertCircle,
  AlertTriangle,
  Bot,
  Clock,
  FileText,
  ImageIcon,
  Send,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';

const STAGE_LABELS = {
  IDENTITY_AUTH: { label: 'Identity / Auth', color: '#dc2626', icon: ShieldAlert },
  OCR_EXTRACTION: { label: 'OCR & Receipt Parsing', color: '#ea580c', icon: ImageIcon },
  VEHICLE_RESOLUTION: { label: 'Vehicle Resolution', color: '#d97706', icon: Bot },
  MEDIA_VALIDATION: { label: 'Media Format / Size', color: '#b45309', icon: FileText },
  RATE_LIMIT: { label: 'Rate Limiting', color: '#7c3aed', icon: AlertTriangle },
  FEATURE_FLAG: { label: 'Feature Flag Disabled', color: '#6366f1', icon: SlidersHorizontal },
  OUTBOUND_DELIVERY: { label: 'Outbound Meta Send', color: '#e11d48', icon: Send },
  WORKER_LOCK: { label: 'Lock Contention', color: '#475569', icon: Clock },
  SYSTEM_ERROR: { label: 'System Exception', color: '#991b1b', icon: AlertCircle },
};

export default STAGE_LABELS;
