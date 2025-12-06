/**
 * Color utility functions for theme-aware Kanban board colors
 */

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        }
        : null;
}

/**
 * Convert RGB to hex
 */
function rgbToHex(r: number, g: number, b: number): string {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Lighten a hex color for light mode (pastel effect)
 */
export function lightenColor(hex: string, amount: number = 0.8): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;

    const { r, g, b } = rgb;

    // Blend with white for pastel effect
    const newR = Math.round(r + (255 - r) * amount);
    const newG = Math.round(g + (255 - g) * amount);
    const newB = Math.round(b + (255 - b) * amount);

    return rgbToHex(newR, newG, newB);
}

/**
 * Darken and desaturate a color for dark mode columns (subtle, not overwhelming)
 */
export function adjustColorForDark(hex: string): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;

    let { r, g, b } = rgb;

    // Significantly reduce brightness and saturation for dark mode
    // This creates a subtle tint rather than a vivid background
    const factor = 0.3; // Much darker
    r = Math.round(r * factor);
    g = Math.round(g * factor);
    b = Math.round(b * factor);

    return rgbToHex(r, g, b);
}

/**
 * Get background color for Kanban column based on theme
 */
export function getColumnBackgroundColor(statusColor: string, isDark: boolean): string {
    if (isDark) {
        // Use very muted color for dark mode - subtle tint that doesn't clash with cards
        return adjustColorForDark(statusColor);
    } else {
        // Use lightened color for light mode - soft pastels
        return lightenColor(statusColor, 0.85);
    }
}

/**
 * Get text color for Kanban column based on background
 */
export function getColumnTextColor(statusColor: string, isDark: boolean): string {
    if (isDark) {
        return '#ffffff'; // White text on dark backgrounds
    } else {
        // Check if color is light or dark
        const rgb = hexToRgb(statusColor);
        if (!rgb) return '#000000';

        // Calculate relative luminance
        const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

        // Use dark text on light backgrounds
        return luminance > 0.7 ? '#1f2937' : '#000000';
    }
}

/**
 * Get card background for colored columns
 */
export function getCardBackgroundOnColumn(isDark: boolean): string {
    if (isDark) {
        return 'rgba(0, 0, 0, 0.3)'; // Semi-transparent dark
    } else {
        return 'rgba(255, 255, 255, 0.9)'; // Semi-transparent white
    }
}
