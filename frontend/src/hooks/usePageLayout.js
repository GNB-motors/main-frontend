/**
 * usePageLayout Hook
 * 
 * Manages page-wide layout properties like padding
 * Use in components that need custom full-width layouts
 */

import { useEffect } from 'react';

export const useFullPageLayout = () => {
  useEffect(() => {
    const pageContentEl = document.querySelector('.page-content');
    if (pageContentEl) {
      pageContentEl.classList.add('no-padding');
    }
    return () => {
      if (pageContentEl) {
        pageContentEl.classList.remove('no-padding');
      }
    };
  }, []);
};
