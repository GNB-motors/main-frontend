import { useEffect, useState } from 'react';

export default function PhotoBatchStatus({ file, busy, error }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!URL.createObjectURL) return undefined;
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return (
    <div className="flex min-w-0 items-center gap-3 rounded border p-2 text-sm">
      {url && (
        <img
          src={url}
          alt={`Preview of ${file.name}`}
          className="h-12 w-12 shrink-0 rounded object-cover"
        />
      )}
      <div className="min-w-0">
        <p className="break-all">{file.name}</p>
        <p role="status" className="text-xs text-muted-foreground">
          {busy
            ? 'Uploading and reading...'
            : error
              ? 'This batch failed. Choose the photos again to retry.'
              : 'Photos read'}
        </p>
      </div>
    </div>
  );
}
