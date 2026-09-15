import apiClient from '../utils/axiosConfig';

/**
 * Company logo upload/removal.
 *
 * Both onboarding and the profile page go through here so there is a single
 * definition of the endpoint, the field name and the client-side guards. The
 * limits mirror the server (app/modules/admin/admin.controller.js) — the server
 * is authoritative, this just fails fast before spending an upload.
 */
export const LOGO_ACCEPT = 'image/png,image/jpeg,image/webp,image/svg+xml';
export const LOGO_MAX_BYTES = 2 * 1024 * 1024;

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];

/** Throws a human-readable Error when the file is not a usable logo. */
export const validateLogoFile = (file) => {
  if (!file) throw new Error('Choose an image first.');
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Logo must be a PNG, JPEG, WEBP or SVG image.');
  }
  if (file.size > LOGO_MAX_BYTES) {
    throw new Error('Logo must be 2MB or smaller.');
  }
};

const unwrap = (res) => res.data?.data ?? res.data ?? null;

export const OrganizationLogoService = {
  /** Upload or replace. Returns the updated organization. */
  upload: async (orgId, file) => {
    validateLogoFile(file);
    const form = new FormData();
    form.append('file', file);
    // Content-Type is deliberately not set: the browser must add the multipart
    // boundary itself, and forcing the header strips it.
    const res = await apiClient.post(`/api/admin/organizations/${orgId}/logo`, form);
    return unwrap(res);
  },

  /** Remove the logo. Returns the updated organization. */
  remove: async (orgId) => {
    const res = await apiClient.delete(`/api/admin/organizations/${orgId}/logo`);
    return unwrap(res);
  },
};

export default OrganizationLogoService;
