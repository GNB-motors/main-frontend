// Every map must use the same loader options when pages share a session.
export const googleMapsLoaderOptions = {
  googleMapsApiKey: (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').replace(/['"]/g, '').trim(),
  libraries: ['places', 'drawing', 'geometry'],
  language: 'en',
  region: 'IN',
};
