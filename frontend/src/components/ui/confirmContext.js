import { createContext, useContext } from 'react';

/**
 * confirmContext — shared by ConfirmDialog.jsx (host) and its consumers.
 * Lives in its own module so component files keep a single export
 * (react-refresh/only-export-components).
 */
const ConfirmContext = createContext(null);

export function useConfirm() {
  return useContext(ConfirmContext);
}

export default ConfirmContext;
