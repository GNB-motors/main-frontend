import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Plus, Menu } from 'lucide-react';
import { getPrimaryColor, getThemeCSS } from '../utils/colorTheme';
import './Navbar.css';

const Navbar = ({ toggleSidebar }) => {
    const location = useLocation();
    const [themeColors, setThemeColors] = useState(getThemeCSS());
    
    // Update theme colors when component mounts or profile color changes
    useEffect(() => {
        const updateTheme = () => {
            const newTheme = getThemeCSS();
            console.log('Navbar theme colors:', newTheme);
            setThemeColors(newTheme);
        };
        
        updateTheme();
        
        // Listen for storage changes (when profile color is updated)
        window.addEventListener('storage', updateTheme);
        
        return () => {
            window.removeEventListener('storage', updateTheme);
        };
    }, []);
    
    const getPageTitle = () => {
        const path = location.pathname.split('/').pop().replace('-', ' ');
        if (!path) return 'Overview'; // Default title for base path
        return path.charAt(0).toUpperCase() + path.slice(1);
    };

    console.log('Navbar rendering with themeColors:', themeColors);
    
    return (
        <header className="navbar" style={themeColors}>
            <div className="navbar-left">
                <button className="menu-toggle" onClick={toggleSidebar}><Menu /></button>
                <h2>{getPageTitle()}</h2>
            </div>
            <div className="navbar-right">
                {/* <Link 
                    to="/request-report" 
                    className="btn btn-primary"
                    style={{
                        backgroundColor: themeColors['--primary-color'] || '#3B82F6',
                        color: 'white',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: '600',
                        marginBottom: '10px',
                    }}
                >
                    <Plus size={16} />
                    <span>Request New Report</span>
                </Link> */}
            </div>
        </header>
    );
};

export default Navbar;