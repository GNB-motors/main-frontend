import apiClient from '../utils/axiosConfig';
import { getOrgId } from '../utils/session';

// Share catalog requests, including between embedded reports; retry failed reads.
const catalogs = new Map();
export function getManufacturerCatalog() {
  const key = getOrgId() || '';
  let entry = catalogs.get(key);
  if (!entry || Date.now() - entry.at > 300000) {
    const promise = apiClient
      .get('/api/vehicles/metadata')
      .then((res) => {
        const options = res.data?.data?.manufacturers;
        if (!Array.isArray(options) || !options.length) throw new Error('Missing manufacturers');
        return options;
      })
      .catch((error) => {
        catalogs.delete(key);
        throw error;
      });
    entry = { at: Date.now(), promise };
    catalogs.set(key, entry);
  }
  return entry.promise;
}
