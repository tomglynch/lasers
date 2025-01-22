import {
    defaultSettings,
    presets,
    loadSettings,
    saveSettings,
    loadPreset,
    savePreset,
    randomizeSettings
} from '../src/Settings.js';

describe('Settings', () => {
    let mockStorage;

    beforeEach(() => {
        mockStorage = {};
        const localStorageMock = {
            getItem: jest.fn(key => mockStorage[key]),
            setItem: jest.fn((key, value) => {
                mockStorage[key] = value;
            }),
            clear: jest.fn(() => {
                mockStorage = {};
            })
        };
        
        Object.defineProperty(global, 'localStorage', {
            value: localStorageMock,
            writable: true
        });
    });

    describe('Default Settings', () => {
        test('should have all required properties', () => {
            expect(defaultSettings).toHaveProperty('patternMode', 'radial');
            expect(defaultSettings).toHaveProperty('color', '#ff0000');
            expect(defaultSettings).toHaveProperty('colorMode', 'static');
            expect(defaultSettings).toHaveProperty('beatSensitivity');
            expect(defaultSettings).toHaveProperty('lineCount');
            expect(defaultSettings).toHaveProperty('particlesEnabled');
        });
    });

    describe('Presets', () => {
        test('should have default preset matching defaultSettings', () => {
            expect(presets.default).toEqual(defaultSettings);
        });

        test('should have minimal preset with reduced effects', () => {
            expect(presets.minimal.particlesEnabled).toBe(false);
            expect(presets.minimal.wavesEnabled).toBe(false);
            expect(presets.minimal.lineCount).toBeLessThan(defaultSettings.lineCount);
        });

        test('should have maximal preset with enhanced effects', () => {
            expect(presets.maximal.particlesEnabled).toBe(true);
            expect(presets.maximal.wavesEnabled).toBe(true);
            expect(presets.maximal.lineCount).toBeGreaterThan(defaultSettings.lineCount);
        });
    });

    describe('Settings Loading and Saving', () => {
        test('should load default settings when no saved settings exist', () => {
            const settings = loadSettings();
            expect(settings).toEqual(defaultSettings);
        });

        test('should merge saved settings with defaults', () => {
            const savedSettings = {
                color: '#00ff00',
                lineCount: 12
            };
            mockStorage['audioVisualizerSettings'] = JSON.stringify(savedSettings);
            
            const settings = loadSettings();
            expect(settings.color).toBe('#00ff00');
            expect(settings.lineCount).toBe(12);
            expect(settings.patternMode).toBe(defaultSettings.patternMode);
        });

        test('should save settings to localStorage', () => {
            const settings = {
                ...defaultSettings,
                color: '#0000ff',
                lineCount: 16
            };
            
            saveSettings(settings);
            
            expect(mockStorage['audioVisualizerSettings']).toBe(JSON.stringify(settings));
        });

        test('should save presets along with settings', () => {
            const settings = { ...defaultSettings };
            saveSettings(settings);
            
            expect(mockStorage['audioVisualizerPresets']).toBe(JSON.stringify(presets));
        });
    });

    describe('Preset Management', () => {
        test('should load existing preset', () => {
            const minimalSettings = loadPreset('minimal');
            expect(minimalSettings).toEqual(presets.minimal);
        });

        test('should return default settings for non-existent preset', () => {
            const settings = loadPreset('nonexistent');
            expect(settings).toEqual(defaultSettings);
        });

        test('should save new preset', () => {
            const customSettings = {
                ...defaultSettings,
                color: '#ff00ff',
                lineCount: 20
            };
            
            savePreset('custom', customSettings);
            
            expect(presets.custom).toEqual(customSettings);
            expect(mockStorage['audioVisualizerPresets']).toBeDefined();
        });

        test('should override existing preset', () => {
            const newSettings = {
                ...defaultSettings,
                color: '#00ffff'
            };
            
            savePreset('minimal', newSettings);
            expect(presets.minimal).toEqual(newSettings);
        });
    });

    describe('Settings Randomization', () => {
        test('should generate valid random settings', () => {
            const settings = randomizeSettings();
            
            expect(settings.patternMode).toMatch(/^(radial|horizontal)$/);
            expect(settings.colorMode).toMatch(/^(static|cycle)$/);
            expect(settings.lineCount).toBeGreaterThanOrEqual(3);
            expect(settings.lineCount).toBeLessThanOrEqual(16);
            expect(settings.sensitivity).toBeGreaterThanOrEqual(30);
            expect(settings.sensitivity).toBeLessThanOrEqual(70);
        });

        test('should generate different settings on subsequent calls', () => {
            const settings1 = randomizeSettings();
            const settings2 = randomizeSettings();
            
            const isDifferent = 
                settings1.color !== settings2.color ||
                settings1.lineCount !== settings2.lineCount ||
                settings1.patternMode !== settings2.patternMode;
            
            expect(isDifferent).toBe(true);
        });

        test('should maintain required properties', () => {
            const settings = randomizeSettings();
            
            // Check all required properties exist
            Object.keys(defaultSettings).forEach(key => {
                expect(settings).toHaveProperty(key);
            });
        });

        test('should generate values within valid ranges', () => {
            const settings = randomizeSettings();
            
            expect(settings.colorCycleSpeed).toBeGreaterThanOrEqual(0.5);
            expect(settings.colorCycleSpeed).toBeLessThanOrEqual(5);
            
            expect(settings.beatSensitivity).toBeGreaterThanOrEqual(0.2);
            expect(settings.beatSensitivity).toBeLessThanOrEqual(0.4);
            
            expect(settings.beatDecay).toBeGreaterThanOrEqual(0.95);
            expect(settings.beatDecay).toBeLessThanOrEqual(0.99);
            
            expect(settings.horizontalLineCount).toBeGreaterThanOrEqual(2);
            expect(settings.horizontalLineCount).toBeLessThanOrEqual(8);
        });
    });
}); 