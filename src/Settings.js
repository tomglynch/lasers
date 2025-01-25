/**
 * Settings management for the audio visualizer
 */

import { generateRandomColor, hslToHex } from './utils/ColorUtils.js';

const SETTINGS_KEY = 'visualizerSettings';

/**
 * Default settings for the visualizer
 */
export const defaultSettings = {
    // Core settings
    patternMode: 'radial',
    color: '#ff0000',
    colorMode: 'static',
    
    // Auto-shuffle
    autoShuffle: false,
    noiseAutoShuffle: false,
    beatAutoShuffle: false,
    noiseThreshold: 0.1, // Threshold for considering "low noise"
    noiseQuietDuration: 3000, // Duration in ms of low noise needed before ready to shuffle
    
    // Beat detection
    beatSensitivity: 0.12,
    beatIntensity: 2.2,
    beatDecay: 0.97,
    
    // Visual settings
    sensitivity: 50,
    lineCount: 8,
    lineThickness: 2,
    
    // Effects
    particlesEnabled: true,
    particleCount: 50,
    particleSize: 3,
    wavesEnabled: true,
    
    // Color cycling
    colorCycleSpeed: 2,
    colorHue: 0,
    colorSaturation: 100,
    colorLightness: 50,
    
    // Horizontal pattern specific
    horizontalLineCount: 3,
    horizontalLineSpacing: 100,
    waveAmplitude: 50,
    waveSpeed: 2,
    verticalMovement: 'none',
    verticalSpeed: 1,
    verticalRange: 200,
    
    // Oval pattern specific
    ovalCount: 3,
    ovalSize: 50,
    ovalStyle: 'slow',
    ovalMovementSpeed: 2,
    ovalMovementRange: 100,
    ovalHeightOffset: 0,
    ovalWidthRatio: 1,
    ovalSecondaryColor: '#00ff00',
    ovalRotationSpeed: 0.2,
    ovalRotationOffset: 0,
    
    // Bass filter settings
    bassFrequency: 150,
    bassQuality: 1
};

/**
 * Preset configurations
 */
const presets = {
    default: { ...defaultSettings },
    minimal: {
        patternMode: 'horizontal',
        color: '#00ff00',
        colorMode: 'static',
        beatSensitivity: 0.2,
        beatIntensity: 1.2,
        beatDecay: 0.95,
        sensitivity: 30,
        lineCount: 4,
        lineThickness: 1,
        particlesEnabled: false,
        wavesEnabled: false,
        frequencyBarsEnabled: false,
        colorCycleSpeed: 1,
        colorSaturation: 100,
        horizontalLineCount: 3,
        horizontalLineSpacing: 100,
        waveAmplitude: 30,
        waveSpeed: 1,
        verticalMovement: 'none',
        ovalCount: 1,
        ovalSize: 30,
    },
    maximal: {
        patternMode: 'radial',
        color: '#0000ff',
        colorMode: 'cycle',
        beatSensitivity: 0.4,
        beatIntensity: 2.0,
        beatDecay: 0.99,
        sensitivity: 70,
        lineCount: 16,
        lineThickness: 3,
        particlesEnabled: true,
        wavesEnabled: true,
        frequencyBarsEnabled: true,
        colorCycleSpeed: 3,
        colorSaturation: 100,
        horizontalLineCount: 5,
        horizontalLineSpacing: 80,
        waveAmplitude: 100,
        waveSpeed: 3,
        verticalMovement: 'updown',
        ovalCount: 4,
        ovalSize: 80,
    },
    neon: {
        patternMode: 'radial',
        color: '#00ff99',
        colorMode: 'cycle',
        beatSensitivity: 0.35,
        beatIntensity: 1.8,
        beatDecay: 0.98,
        sensitivity: 65,
        lineCount: 12,
        lineThickness: 2,
        particlesEnabled: true,
        wavesEnabled: true,
        frequencyBarsEnabled: false,
        colorCycleSpeed: 4,
        colorSaturation: 100,
        horizontalLineCount: 4,
        horizontalLineSpacing: 90,
        waveAmplitude: 80,
        waveSpeed: 2,
        verticalMovement: 'wave',
        ovalCount: 3,
        ovalSize: 60,
        ovalStyle: 'double',
        ovalMovementSpeed: 2,
        ovalMovementRange: 120,
        ovalHeightOffset: -30,
        ovalWidthRatio: 2.5,
        ovalSecondaryColor: '#ff00ff',
    },
    matrix: {
        patternMode: 'horizontal',
        color: '#00ff00',
        colorMode: 'static',
        beatSensitivity: 0.3,
        beatIntensity: 1.5,
        beatDecay: 0.97,
        sensitivity: 60,
        lineCount: 20,
        lineThickness: 1,
        particlesEnabled: false,
        wavesEnabled: false,
        frequencyBarsEnabled: true,
        colorCycleSpeed: 0,
        colorSaturation: 100,
        horizontalLineCount: 8,
        horizontalLineSpacing: 60,
        waveAmplitude: 40,
        waveSpeed: 1,
        verticalMovement: 'down',
        ovalCount: 2,
        ovalSize: 40,
    },
    sunset: {
        patternMode: 'horizontal',
        color: '#ff6b35',
        colorMode: 'cycle',
        beatSensitivity: 0.25,
        beatIntensity: 1.4,
        beatDecay: 0.96,
        sensitivity: 55,
        lineCount: 10,
        lineThickness: 2,
        particlesEnabled: true,
        wavesEnabled: true,
        frequencyBarsEnabled: false,
        colorCycleSpeed: 1,
        colorSaturation: 90,
        horizontalLineCount: 6,
        horizontalLineSpacing: 120,
        waveAmplitude: 90,
        waveSpeed: 1,
        verticalMovement: 'wave',
        ovalCount: 2,
        ovalSize: 40,
    },
    ocean: {
        patternMode: 'horizontal',
        color: '#0077be',
        colorMode: 'cycle',
        beatSensitivity: 0.2,
        beatIntensity: 1.3,
        beatDecay: 0.95,
        sensitivity: 50,
        lineCount: 8,
        lineThickness: 3,
        particlesEnabled: false,
        wavesEnabled: true,
        frequencyBarsEnabled: false,
        colorCycleSpeed: 2,
        colorSaturation: 80,
        horizontalLineCount: 5,
        horizontalLineSpacing: 150,
        waveAmplitude: 120,
        waveSpeed: 1.5,
        verticalMovement: 'wave',
        ovalCount: 2,
        ovalSize: 40,
    },
    fire: {
        patternMode: 'radial',
        color: '#ff4500',
        colorMode: 'cycle',
        beatSensitivity: 0.4,
        beatIntensity: 2.2,
        beatDecay: 0.98,
        sensitivity: 75,
        lineCount: 14,
        lineThickness: 2,
        particlesEnabled: true,
        wavesEnabled: true,
        frequencyBarsEnabled: true,
        colorCycleSpeed: 5,
        colorSaturation: 100,
        horizontalLineCount: 4,
        horizontalLineSpacing: 70,
        waveAmplitude: 60,
        waveSpeed: 4,
        verticalMovement: 'up',
        ovalCount: 2,
        ovalSize: 40,
    },
    rainbow: {
        patternMode: 'radial',
        color: '#ff0000',
        colorMode: 'cycle',
        beatSensitivity: 0.3,
        beatIntensity: 1.6,
        beatDecay: 0.97,
        sensitivity: 65,
        lineCount: 12,
        lineThickness: 2,
        particlesEnabled: true,
        wavesEnabled: true,
        frequencyBarsEnabled: false,
        colorCycleSpeed: 6,
        colorSaturation: 100,
        horizontalLineCount: 6,
        horizontalLineSpacing: 100,
        waveAmplitude: 70,
        waveSpeed: 2,
        verticalMovement: 'none',
        ovalCount: 2,
        ovalSize: 40,
    },
    cosmic: {
        patternMode: 'radial',
        color: '#9400d3',
        colorMode: 'cycle',
        beatSensitivity: 0.35,
        beatIntensity: 1.9,
        beatDecay: 0.98,
        sensitivity: 70,
        lineCount: 16,
        lineThickness: 2,
        particlesEnabled: true,
        wavesEnabled: true,
        frequencyBarsEnabled: false,
        colorCycleSpeed: 3,
        colorSaturation: 90,
        horizontalLineCount: 5,
        horizontalLineSpacing: 110,
        waveAmplitude: 85,
        waveSpeed: 2.5,
        verticalMovement: 'wave',
        ovalCount: 4,
        ovalSize: 70,
        ovalStyle: 'wave',
        ovalMovementSpeed: 3,
        ovalMovementRange: 150,
        ovalHeightOffset: 0,
        ovalWidthRatio: 1,
        ovalSecondaryColor: '#ff00ff',
    },
    retro: {
        patternMode: 'horizontal',
        color: '#ff00ff',
        colorMode: 'cycle',
        beatSensitivity: 0.3,
        beatIntensity: 1.7,
        beatDecay: 0.96,
        sensitivity: 60,
        lineCount: 10,
        lineThickness: 2,
        particlesEnabled: false,
        wavesEnabled: true,
        frequencyBarsEnabled: true,
        colorCycleSpeed: 4,
        colorSaturation: 95,
        horizontalLineCount: 7,
        horizontalLineSpacing: 80,
        waveAmplitude: 50,
        waveSpeed: 3,
        verticalMovement: 'up',
        ovalCount: 2,
        ovalSize: 40,
    },
    zen: {
        patternMode: 'radial',
        color: '#7ac5cd',
        colorMode: 'static',
        beatSensitivity: 0.15,
        beatIntensity: 1.1,
        beatDecay: 0.94,
        sensitivity: 45,
        lineCount: 8,
        lineThickness: 1,
        particlesEnabled: false,
        wavesEnabled: true,
        frequencyBarsEnabled: false,
        colorCycleSpeed: 1,
        colorSaturation: 70,
        horizontalLineCount: 4,
        horizontalLineSpacing: 140,
        waveAmplitude: 40,
        waveSpeed: 1,
        verticalMovement: 'none',
        ovalCount: 2,
        ovalSize: 40,
    }
};

/**
 * Load settings from localStorage or use defaults
 */
export function loadSettings() {
    try {
        const savedSettings = localStorage.getItem(SETTINGS_KEY);
        if (savedSettings) {
            return { ...defaultSettings, ...JSON.parse(savedSettings) };
        }
    } catch (e) {
        console.error('Error loading settings:', e);
    }
    return { ...defaultSettings };
}

/**
 * Save settings to localStorage
 */
export function saveSettings(settings) {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        // Dispatch a custom event to notify other tabs
        window.dispatchEvent(new StorageEvent('storage', {
            key: SETTINGS_KEY,
            newValue: JSON.stringify(settings),
            url: window.location.href
        }));
    } catch (e) {
        console.error('Error saving settings:', e);
    }
}

/**
 * Load a preset configuration
 */
export function loadPreset(presetName) {
    const preset = presets[presetName] || defaultSettings;
    saveSettings(preset); // Save the preset so it's immediately available to other tabs
    return { ...preset };
}

/**
 * Save a new preset
 */
export function savePreset(name, settings) {
    try {
        const savedPresets = JSON.parse(localStorage.getItem('presets') || '{}');
        savedPresets[name] = settings;
        localStorage.setItem('presets', JSON.stringify(savedPresets));
    } catch (e) {
        console.error('Error saving preset:', e);
    }
}

/**
 * Generate random settings
 */
export function randomizeSettings() {
    const settings = { ...defaultSettings };
    
    // Randomize core settings
    settings.patternMode = Math.random() < 0.33 ? 'radial' : (Math.random() < 0.5 ? 'horizontal' : 'oval');
    const randomColor = generateRandomColor();
    settings.color = hslToHex(randomColor.hue, randomColor.saturation, randomColor.lightness);
    settings.colorMode = Math.random() < 0.5 ? 'static' : 'cycle';
    settings.colorHue = randomColor.hue;
    settings.colorSaturation = randomColor.saturation;
    settings.colorLightness = randomColor.lightness;
    
    // Randomize visual settings within reasonable ranges
    settings.sensitivity = Math.floor(Math.random() * 40) + 30; // 30-70
    settings.lineCount = Math.floor(Math.random() * 13) + 3; // 3-16
    settings.lineThickness = Math.floor(Math.random() * 2) + 1; // 1-3
    
    // Randomize visual effects
    settings.particlesEnabled = Math.random() < 0.7; // 70% chance of being enabled
    settings.particleSize = Math.floor(Math.random() * 6) + 2; // 2-8
    settings.wavesEnabled = Math.random() < 0.7; // 70% chance of being enabled
    
    // Randomize oval settings
    settings.ovalCount = Math.floor(Math.random() * 3) + 2; // 2-4
    settings.ovalSize = Math.floor(Math.random() * 70) + 30; // 30-100
    settings.ovalStyle = ['slow', 'wave', 'double', 'ovalsv2'][Math.floor(Math.random() * 4)];
    settings.ovalMovementSpeed = Math.random() * 2.5 + 0.5; // 0.5-3.0
    settings.ovalMovementRange = Math.floor(Math.random() * 100) + 50; // 50-150
    settings.ovalHeightOffset = Math.floor(Math.random() * 60) - 30; // -30 to +30
    settings.ovalWidthRatio = Math.random() * 3 + 1; // 1-4
    settings.ovalRotationSpeed = (Math.random() * 2 - 1) * 2; // -2 to +2
    settings.ovalRotationOffset = Math.random() * Math.PI * 2; // 0 to 2π
    
    // Generate a second random color for oval secondary color
    const secondaryColor = generateRandomColor();
    settings.ovalSecondaryColor = hslToHex(secondaryColor.hue, secondaryColor.saturation, secondaryColor.lightness);
    
    // Save the randomized settings
    saveSettings(settings);
    return settings;
}

export { presets };
