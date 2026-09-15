import React, { useEffect, useRef, useState } from 'react';
import { Upload, Trash2, Loader2, ImageIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  OrganizationLogoService,
  validateLogoFile,
  LOGO_ACCEPT,
} from '../services/OrganizationLogoService.js';
import './CompanyLogoUploader.css';

/**
 * Upload / replace / remove the company logo.
 *
 * Used by both onboarding and the profile page. The preview is a local object
 * URL so the user sees the result immediately rather than waiting on S3 to
 * become readable; `onChange` hands the updated organization back so the caller
 * can refresh the app-wide context and repaint the sidebar.
 */
const CompanyLogoUploader = ({ orgId, logoUrl, onChange, compact = false }) => {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  // Revoke the object URL when it is replaced or the component unmounts,
  // otherwise each pick leaks a blob for the lifetime of the tab.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const shown = preview || logoUrl || null;

  const pick = () => inputRef.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file after a failure
    if (!file) return;

    try {
      validateLogoFile(file);
    } catch (err) {
      toast.error(err.message);
      return;
    }

    if (!orgId) {
      toast.error('Organization not loaded yet. Try again in a moment.');
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return localUrl;
    });
    setBusy(true);
    try {
      const org = await OrganizationLogoService.upload(orgId, file);
      toast.success('Logo updated');
      onChange?.(org);
    } catch (err) {
      setPreview((old) => {
        if (old) URL.revokeObjectURL(old);
        return null;
      });
      toast.error(err?.response?.data?.message || err.message || 'Could not upload the logo');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (!orgId) return;
    setBusy(true);
    try {
      const org = await OrganizationLogoService.remove(orgId);
      setPreview((old) => {
        if (old) URL.revokeObjectURL(old);
        return null;
      });
      toast.success('Logo removed');
      onChange?.(org);
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Could not remove the logo');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`logo-uploader ${compact ? 'compact' : ''}`}>
      <div className="logo-uploader-preview" aria-live="polite">
        {shown ? (
          <img src={shown} alt="Company logo" />
        ) : (
          <span className="logo-uploader-placeholder">
            <ImageIcon size={compact ? 20 : 26} />
            <span>No logo</span>
          </span>
        )}
        {busy && (
          <span className="logo-uploader-busy">
            <Loader2 size={18} className="logo-uploader-spin" />
          </span>
        )}
      </div>

      <div className="logo-uploader-side">
        <div className="logo-uploader-actions">
          <button type="button" className="logo-uploader-btn primary" onClick={pick} disabled={busy}>
            <Upload size={14} />
            {shown ? 'Replace' : 'Upload logo'}
          </button>
          {shown && (
            <button
              type="button"
              className="logo-uploader-btn ghost"
              onClick={handleRemove}
              disabled={busy}
            >
              <Trash2 size={14} />
              Remove
            </button>
          )}
        </div>
        <p className="logo-uploader-hint">PNG, JPEG, WEBP or SVG · up to 2MB</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={LOGO_ACCEPT}
        onChange={handleFile}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default CompanyLogoUploader;
