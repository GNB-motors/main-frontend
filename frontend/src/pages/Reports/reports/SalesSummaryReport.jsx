import React from 'react';
import { Box } from '@mui/material';

// --- SALES SUMMARY REPORT (Empty State) ---
const SalesSummaryReport = () => {
    return (
        <Box>
            <div className="report-header">
                <h3>Sales Summary</h3>
            </div>
            <div className="report-content report-content-empty">
                <div className="empty-state">
                    <div className="empty-message">
                        <h4>Sales summary not available</h4>
                    </div>
                    {/* You can add graphic elements here if needed, or keep it simple */}
                </div>
            </div>
        </Box>
    );
};

export default SalesSummaryReport;
