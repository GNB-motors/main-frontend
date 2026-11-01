import React from 'react';
import SlotUpload from './SlotUpload';

const DocumentSlots = ({ uid, formData, fixedDocs, ocrScanning, handleDocDrop, removeDoc }) => (
  <div style={{ marginTop: 8 }}>
    {/* eslint-disable-next-line jsx-a11y/label-has-associated-control -- caption over the upload slots, not a field label; each slot's file input carries its own aria-label */}
    <label
      style={{
        display: 'block',
        marginBottom: 12,
        color: '#5D5D5E',
        fontSize: 14,
        fontWeight: 600,
      }}
    >
      Upload Documents
    </label>
    <div className="mileage-slots-row">
      <SlotUpload
        docType="fuel"
        title="FUEL RECEIPT"
        label="fuel slip"
        inputId={`${uid}-drop-fuel`}
        doc={fixedDocs.fuel}
        isScanning={ocrScanning.fuel}
        onDrop={handleDocDrop}
        onRemove={removeDoc}
      />
      {formData.fillingType === 'FULL_TANK' && (
        <SlotUpload
          docType="odometer"
          title="ODOMETER AT REFUELLING"
          label="odometer image"
          inputId={`${uid}-drop-odometer`}
          doc={fixedDocs.odometer}
          isScanning={ocrScanning.odometer}
          onDrop={handleDocDrop}
          onRemove={removeDoc}
        />
      )}
    </div>
  </div>
);

export default DocumentSlots;
