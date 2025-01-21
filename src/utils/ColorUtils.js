/**
 * Color utility functions for the audio visualizer
 */
export class ColorUtils {
    /**
     * Converts HSL color values to hexadecimal color string
     * @param {number} h - Hue value (0-360)
     * @param {number} s - Saturation value (0-100)
     * @param {number} l - Lightness value (0-100)
     * @returns {string} Hexadecimal color string (e.g., '#ff0000')
     */
    static hslToHex(h, s, l) {
        l /= 100;
        const a = s * Math.min(l, 1 - l) / 100;
        const f = n => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    }

    /**
     * Creates a color string with opacity
     * @param {string} hexColor - Hexadecimal color string
     * @param {number} opacity - Opacity value (0-1)
     * @returns {string} RGBA color string
     */
    static colorWithOpacity(hexColor, opacity) {
        const r = parseInt(hexColor.substr(1,2), 16);
        const g = parseInt(hexColor.substr(3,2), 16);
        const b = parseInt(hexColor.substr(5,2), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
} 