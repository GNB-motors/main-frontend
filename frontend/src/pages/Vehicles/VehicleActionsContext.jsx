import React, { createContext, useContext, useState } from 'react';

// Create the Context
const VehicleActionsContext = createContext(null);

// Provider Component
export const VehicleActionsProvider = ({ children }) => {
    const [onAddVehicle, setOnAddVehicle] = useState(null);

    const value = {
        onAddVehicle,
        setOnAddVehicle
    };

    return (
        <VehicleActionsContext.Provider value={value}>
            {children}
        </VehicleActionsContext.Provider>
    );
};

// Custom hook for easy consumption
export const useVehicleActions = () => {
    const context = useContext(VehicleActionsContext);
    if (context === null) {
        // Return default values if not in provider (for other pages)
        return {
            onAddVehicle: null,
            setOnAddVehicle: () => {}
        };
    }
    return context;
};

