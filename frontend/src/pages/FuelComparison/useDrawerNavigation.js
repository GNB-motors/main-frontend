import { useMemo } from 'react';

/** Position of the open record in the loaded page and prev/next handlers for the audit drawer. */
const useDrawerNavigation = (records, activeDrawerTask, setActiveDrawerTask) => {
  // Drawer Next / Prev Navigation
  const currentDrawerIndex = useMemo(() => {
    if (!activeDrawerTask) return -1;
    return records.findIndex((r) => r._id === activeDrawerTask._id);
  }, [activeDrawerTask, records]);

  const handlePrevDrawer = () => {
    if (currentDrawerIndex > 0) {
      setActiveDrawerTask(records[currentDrawerIndex - 1]);
    }
  };

  const handleNextDrawer = () => {
    if (currentDrawerIndex >= 0 && currentDrawerIndex < records.length - 1) {
      setActiveDrawerTask(records[currentDrawerIndex + 1]);
    }
  };

  return { currentDrawerIndex, handlePrevDrawer, handleNextDrawer };
};

export default useDrawerNavigation;
