import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import useMutation from '../../hooks/useMutation';
import { OCRService } from '../../pages/Trip/services';
import validateImageFile from './validateImageFile';

export default function useFuelDocuments(onOcr) {
  const [fixedDocs, setFixedDocs] = useState({ fuel: null, odometer: null });
  const current = useRef({ fuel: null, odometer: null });
  const applyOcr = useRef(onOcr);
  applyOcr.current = onOcr;
  const fuelScan = useMutation((file, options) => OCRService.scan(file, 'FUEL_RECEIPT', options));
  const odoScan = useMutation((file, options) => OCRService.scan(file, 'ODOMETER', options));

  useEffect(
    () => () => {
      for (const doc of Object.values(current.current)) {
        if (doc) URL.revokeObjectURL(doc.preview);
      }
      current.current = {};
    },
    [],
  );

  const removeDoc = (type) => {
    (type === 'fuel' ? fuelScan : odoScan).reset();
    if (current.current[type]) URL.revokeObjectURL(current.current[type].preview);
    current.current[type] = null;
    setFixedDocs((prev) => ({ ...prev, [type]: null }));
  };

  const handleDocDrop = async (type, files) => {
    const file = files[0];
    if (!file) return;
    if (!validateImageFile(file)) return toast.error('Valid image required (JPG, PNG, WEBP).');
    removeDoc(type);
    const doc = { file, preview: URL.createObjectURL(file), ocrStatus: 'scanning' };
    current.current[type] = doc;
    setFixedDocs((prev) => ({ ...prev, [type]: doc }));
    const result = await (type === 'fuel' ? fuelScan : odoScan).mutate(file);
    // Removed/replaced photos and unmounted forms must never apply a late OCR result.
    if (current.current[type] !== doc) return;
    const next = {
      ...doc,
      ocrStatus: result?.success ? 'success' : 'error',
      ocrData: result?.data,
    };
    current.current[type] = next;
    setFixedDocs((prev) => ({ ...prev, [type]: next }));
    if (result?.success) applyOcr.current(result.data || {}, type);
    else toast.warning('Could not read this photo. Please enter the details manually.');
  };

  return {
    fixedDocs,
    handleDocDrop,
    removeDoc,
    ocrScanning: { fuel: fuelScan.loading, odometer: odoScan.loading },
  };
}
