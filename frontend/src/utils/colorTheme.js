/**
 * Color theming utilities based on profile color
 */

/**
 * Get the primary color from localStorage
 * @returns {string} - The primary color or default blue
 */
export const getPrimaryColor = () => {
    const primaryThemeColor = localStorage.getItem('primaryThemeColor');
    console.log('Primary theme color:', primaryThemeColor);
    return primaryThemeColor || '#3B82F6'; // Default blue
};

/**
 * Get a lighter version of the primary color (50% opacity)
 * @param {string} color - The base color
 * @returns {string} - The lighter color with 50% opacity
 */
export const getLightColor = (color) => {
    // Convert hex to RGB and add alpha
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, 0.5)`;
};

/**
 * Get a darker version of the primary color
 * @param {string} color - The base color
 * @returns {string} - The darker color
 */
export const getDarkColor = (color) => {
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 40);
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 40);
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 40);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

/**
 * Get CSS custom properties for theming
 * @returns {Object} - CSS custom properties object
 */
export const getThemeCSS = () => {
    const primaryColor = getPrimaryColor();
    const lightColor = getLightColor(primaryColor);
    const darkColor = getDarkColor(primaryColor);
    
    const theme = {
        '--primary-color': primaryColor,
        '--primary-light': lightColor,
        '--primary-dark': darkColor,
    };
    
    console.log('Theme CSS generated:', theme);
    return theme;
};

/**
 * Apply theme colors to a DOM element
 * @param {HTMLElement} element - The element to apply colors to
 */
export const applyThemeToElement = (element) => {
    if (!element) return;
    
    const theme = getThemeCSS();
    Object.entries(theme).forEach(([property, value]) => {
        element.style.setProperty(property, value);
    });
};
