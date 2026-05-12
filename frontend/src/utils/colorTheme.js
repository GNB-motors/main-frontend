/**
 * colorTheme.js
 * Central colour theming utility.
 *
 * KEY DESIGN:
 * applyThemeToRoot() writes every CSS custom property that any part of the
 * app may reference onto document.documentElement (:root).
 * This includes:
 *   --primary-color / --primary-light / --primary-dark  (our own tokens)
 *   --color-primary-100/500/600                          (used by Reports slider, etc.)
 *   --primary / --primary-foreground                     (Shadcn UI tokens — drives
 *                                                         Calendar, Button, etc.)
 *
 * Shadcn uses oklch() for --primary. We convert hex → oklch approximately
 * so the calendar, badges and Shadcn buttons all pick up the user's colour.
 */

/** Read stored colour, fall back to indigo */
export const getPrimaryColor = () =>
    localStorage.getItem('primaryThemeColor') || '#4f46e5';

/** 50% opacity version for light backgrounds */
export const getLightColor = (color) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, 0.12)`;
};

/** Darker shade (subtract 40 from each channel) */
export const getDarkColor = (color) => {
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 40);
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 40);
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 40);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

/**
 * Approximate hex → oklch conversion so Shadcn's --primary token
 * (which Tailwind reads as oklch) also reflects the user's colour.
 * This is not mathematically perfect but is perceptually close enough
 * for UI theming purposes.
 */
const hexToOklch = (hex) => {
    const h = hex.replace('#', '');
    const r = parseInt(h.substr(0, 2), 16) / 255;
    const g = parseInt(h.substr(2, 2), 16) / 255;
    const b = parseInt(h.substr(4, 2), 16) / 255;

    // sRGB → linear
    const toLinear = (c) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    const lr = toLinear(r), lg = toLinear(g), lb = toLinear(b);

    // linear RGB → XYZ (D65)
    const x = 0.4124 * lr + 0.3576 * lg + 0.1805 * lb;
    const y = 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
    const z = 0.0193 * lr + 0.1192 * lg + 0.9505 * lb;

    // XYZ → OKLab
    const l_ = Math.cbrt(0.8189 * x + 0.3618 * y - 0.1288 * z);
    const m_ = Math.cbrt(0.0329 * x + 0.9293 * y + 0.0361 * z);
    const s_ = Math.cbrt(0.0482 * x + 0.2643 * y + 0.6337 * z);
    const L = 0.2104 * l_ + 0.7936 * m_ - 0.0040 * s_;
    const a = 1.9780 * l_ - 2.4285 * m_ + 0.4505 * s_;
    const bk = 0.0259 * l_ + 0.7827 * m_ - 0.8086 * s_;

    // OKLab → OKLch
    const C = Math.sqrt(a * a + bk * bk);
    const H = (Math.atan2(bk, a) * 180) / Math.PI;
    const hue = H < 0 ? H + 360 : H;

    return `oklch(${L.toFixed(4)} ${C.toFixed(4)} ${hue.toFixed(2)})`;
};

/**
 * Write every primary colour token to :root so ALL components —
 * our custom CSS, Tailwind, Shadcn — pick up the user's theme colour.
 */
export const applyThemeToRoot = () => {
    const primary = getPrimaryColor();
    const light   = getLightColor(primary);
    const dark    = getDarkColor(primary);
    const oklch   = hexToOklch(primary);

    const root = document.documentElement;

    // Our own tokens (used by most CSS files)
    root.style.setProperty('--primary-color',   primary);
    root.style.setProperty('--primary-light',   light);
    root.style.setProperty('--primary-dark',    dark);

    // Used by Reports slider, BulkUpload, etc.
    root.style.setProperty('--color-primary-500', primary);
    root.style.setProperty('--color-primary-600', dark);
    root.style.setProperty('--color-primary-100', light);

    // Shadcn's own token — drives Calendar, Button component, Badge, etc.
    // Tailwind maps bg-primary → var(--primary)
    root.style.setProperty('--primary', oklch);
};

/** Legacy: returns object for style={} props (kept for backward compat) */
export const getThemeCSS = () => ({
    '--primary-color': getPrimaryColor(),
    '--primary-light': getLightColor(getPrimaryColor()),
    '--primary-dark':  getDarkColor(getPrimaryColor()),
});

/** Apply to a specific DOM element (legacy helper) */
export const applyThemeToElement = (element) => {
    if (!element) return;
    Object.entries(getThemeCSS()).forEach(([k, v]) => element.style.setProperty(k, v));
};