// Shared by Live tracking review markers and their map key.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44"><path d="M18 42S3 27 3 18a15 15 0 1 1 30 0c0 9-15 24-15 24Z" fill="#7c3aed" stroke="white" stroke-width="2"/><path d="M14 14a4 4 0 0 1 8 0c0 3-4 3-4 6" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"/><circle cx="18" cy="25" r="1.5" fill="white"/></svg>`;

export const reviewPlaceIconUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
