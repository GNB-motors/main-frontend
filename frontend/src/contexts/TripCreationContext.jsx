/**
 * TripCreationContext
 * 
 * Provides step name context across the trip creation flow
 * to make it available to the Navbar without prop drilling
 */
/* eslint-disable react-refresh/only-export-components -- context provider and hook companion exports */

import React, { createContext, useContext, useState } from 'react';

const TripCreationContext = createContext();

export const TripCreationProvider = ({ children }) => {
  const [stepName, setStepName] = useState('');

  return (
    <TripCreationContext.Provider value={{ stepName, setStepName }}>
      {children}
    </TripCreationContext.Provider>
  );
};

export const useTripCreationContext = () => {
  const context = useContext(TripCreationContext);
  if (!context) {
    return { stepName: '', setStepName: () => {} };
  }
  return context;
};
