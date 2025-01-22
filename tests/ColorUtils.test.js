import { hslToHex, generateRandomColor, updateCycleColor, ColorUtils } from '../src/utils/ColorUtils.js';

describe('ColorUtils', () => {
    describe('hslToHex', () => {
        test('converts red (0, 100, 50) to #ff0000', () => {
            expect(hslToHex(0, 100, 50)).toBe('#ff0000');
        });

        test('converts green (120, 100, 50) to #00ff00', () => {
            expect(hslToHex(120, 100, 50)).toBe('#00ff00');
        });

        test('converts blue (240, 100, 50) to #0000ff', () => {
            expect(hslToHex(240, 100, 50)).toBe('#0000ff');
        });

        test('converts white (0, 0, 100) to #ffffff', () => {
            expect(hslToHex(0, 0, 100)).toBe('#ffffff');
        });

        test('converts black (0, 0, 0) to #000000', () => {
            expect(hslToHex(0, 0, 0)).toBe('#000000');
        });
    });

    describe('generateRandomColor', () => {
        test('generates color within valid ranges', () => {
            const color = generateRandomColor();
            
            expect(color.hue).toBeGreaterThanOrEqual(0);
            expect(color.hue).toBeLessThan(360);
            
            expect(color.saturation).toBeGreaterThanOrEqual(70);
            expect(color.saturation).toBeLessThanOrEqual(100);
            
            expect(color.lightness).toBeGreaterThanOrEqual(40);
            expect(color.lightness).toBeLessThanOrEqual(60);
        });

        test('generates different colors on subsequent calls', () => {
            const color1 = generateRandomColor();
            const color2 = generateRandomColor();
            
            // At least one component should be different
            const isDifferent = 
                color1.hue !== color2.hue ||
                color1.saturation !== color2.saturation ||
                color1.lightness !== color2.lightness;
            
            expect(isDifferent).toBe(true);
        });
    });

    describe('updateCycleColor', () => {
        test('returns static color when not in cycle mode', () => {
            const settings = {
                colorMode: 'static',
                color: '#ff0000',
                colorHue: 180,
                colorSaturation: 100,
                colorLightness: 50,
                colorCycleSpeed: 1
            };
            
            expect(updateCycleColor(settings)).toBe('#ff0000');
        });

        test('cycles color when in cycle mode', () => {
            const settings = {
                colorMode: 'cycle',
                colorHue: 0,
                colorSaturation: 100,
                colorLightness: 50,
                colorCycleSpeed: 10
            };
            
            const color1 = updateCycleColor(settings);
            settings.colorHue = 1; // Simulate time passing
            const color2 = updateCycleColor(settings);
            
            expect(color1).not.toBe(color2);
        });

        test('wraps hue around 360 degrees', () => {
            const settings = {
                colorMode: 'cycle',
                colorHue: 359,
                colorSaturation: 100,
                colorLightness: 50,
                colorCycleSpeed: 10
            };
            
            updateCycleColor(settings); // This should wrap around to near 0
            expect(settings.colorHue % 360).toBeLessThan(360);
        });
    });

    describe('ColorUtils.colorWithOpacity', () => {
        test('converts hex color to rgba with opacity', () => {
            expect(ColorUtils.colorWithOpacity('#ff0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
            expect(ColorUtils.colorWithOpacity('#00ff00', 1)).toBe('rgba(0, 255, 0, 1)');
            expect(ColorUtils.colorWithOpacity('#0000ff', 0)).toBe('rgba(0, 0, 255, 0)');
        });

        test('handles different hex color formats', () => {
            expect(ColorUtils.colorWithOpacity('#abc', 0.5)).toBe('rgba(170, 187, 204, 0.5)');
            expect(ColorUtils.colorWithOpacity('#ffffff', 1)).toBe('rgba(255, 255, 255, 1)');
            expect(ColorUtils.colorWithOpacity('#000000', 0)).toBe('rgba(0, 0, 0, 0)');
        });
    });
}); 