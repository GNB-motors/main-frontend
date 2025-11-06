// src/components/ReportsSidebar.jsx

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
    BarChart3,
    User,
    TrendingUp,
    FileText, // <-- Icon for Trip Report
    Calendar,
    Truck,
    Gift,
    Clock,
    Percent,
    Receipt,
    ChevronUp,
    ChevronDown,
    AlertTriangle
} from 'lucide-react';
import './ReportsSidebar.css';
import { getThemeCSS } from '../utils/colorTheme';

const ReportsSidebar = ({
  isOpen,
  isMainSidebarCollapsed,
  selectedReport,
  setSelectedReport
}) => {

    const [expandedCategories, setExpandedCategories] = useState({
        sales: true,
        fleet: true,
    });
    const [themeColors, setThemeColors] = useState(getThemeCSS());

    useEffect(() => {
        setThemeColors(getThemeCSS());
    }, []);

    const toggleCategory = (category) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    const reportCategories = [
        // {
        //     id: 'sales',
        //     name: 'SALES',
        //     icon: BarChart3,
        //     reports: [
        //         { id: 'salesSummary', name: 'Sales Summary' }
        //     ]
        // },
        {
            id: 'fleet',
            name: 'FLEET REPORTS',
            icon: Truck,
            reports: [
                { id: 'driver', name: 'Driver Report', icon: User },
                { id: 'vehicle', name: 'Vehicle Report', icon: Truck },
                // --- MODIFIED ENTRY ---
                { id: 'trip', name: 'Trip Report', icon: FileText }, // Changed id, name, icon
                { id: 'projected', name: 'Projected Savings', icon: TrendingUp },
                { id: 'outliers', name: 'Outlier Instances', icon: AlertTriangle }
            ]
        }
    ];

    if (!isOpen) return null;

    // Render the sidebar using a portal to document.body to escape any parent transforms/filters
    const sidebarContent = (
        <aside className="reports-sidebar" style={themeColors}>
            <div className="reports-sidebar-content">
                {reportCategories.map(category => (
                    <div key={category.id} className="report-category">
                        <button
                            className="category-header"
                            onClick={() => toggleCategory(category.id)}
                        >
                            <category.icon size={16} />
                            <span>{category.name}</span>
                            {expandedCategories[category.id] ?
                                <ChevronUp size={16} /> :
                                <ChevronDown size={16} />
                            }
                        </button>

                        {expandedCategories[category.id] && (
                            <div className="report-list">
                                {category.reports.map(report => (
                                    <button
                                        key={report.id}
                                        className={`report-item ${selectedReport === report.id ? 'active' : ''}`}
                                        onClick={() => setSelectedReport(report.id)}
                                    >
                                        {report.icon && <report.icon size={16} />}
                                        <span>{report.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </aside>
    );

    // Use portal to render at body level, escaping any parent containing blocks
    return ReactDOM.createPortal(sidebarContent, document.body);
};

export default ReportsSidebar;