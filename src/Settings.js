/**
 * Settings management for the audio visualizer
 */

import { generateRandomColor, hslToHex } from './utils/ColorUtils.js';

/**
 * Default settings for the visualizer
 */
export const defaultSettings = {
    // Core settings
    patternMode: 'radial',
    color: '#ff0000',
    colorMode: 'static',
    
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
    frequencyBarsEnabled: false,
    
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
    
    // Bass filter settings
    bassFrequency: 150,
    bassQuality: 1
};

/**
 * Preset configurations
 */
export const presets = {
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
        verticalMovement: 'none'
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
        verticalMovement: 'updown'
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
        verticalMovement: 'wave'
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
        verticalMovement: 'down'
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
        verticalMovement: 'wave'
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
        verticalMovement: 'wave'
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
        verticalMovement: 'up'
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
        verticalMovement: 'none'
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
        verticalMovement: 'wave'
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
        verticalMovement: 'up'
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
        verticalMovement: 'none'
    }
};

/**
 * Load settings from localStorage
 * @returns {Object} Loaded settings
 */
export function loadSettings() {
    const savedSettings = localStorage.getItem('audioVisualizerSettings');
    const savedPresets = localStorage.getItem('audioVisualizerPresets');
    
    let settings = { ...defaultSettings };
    
    if (savedSettings) {
        settings = { ...settings, ...JSON.parse(savedSettings) };
    }
    
    if (savedPresets) {
        Object.assign(presets, JSON.parse(savedPresets));
    }
    
    return settings;
}

/**
 * Save settings to localStorage
 * @param {Object} settings - Current settings
 */
export function saveSettings(settings) {
    localStorage.setItem('audioVisualizerSettings', JSON.stringify(settings));
    localStorage.setItem('audioVisualizerPresets', JSON.stringify(presets));
}

/**
 * Load a preset configuration
 * @param {string} presetName - Name of the preset to load
 * @returns {Object} Preset settings
 */
export function loadPreset(presetName) {
    return presets[presetName] ? { ...presets[presetName] } : { ...defaultSettings };
}

/**
 * Save current settings as a new preset
 * @param {string} presetName - Name for the new preset
 * @param {Object} settings - Current settings to save
 */
export function savePreset(presetName, settings) {
    presets[presetName] = { ...settings };
    saveSettings(settings);
}

/**
 * Generate random settings
 * @returns {Object} Randomized settings
 */
export function randomizeSettings() {
    const random = (min, max, decimal = false) => {
        const val = Math.random() * (max - min) + min;
        return decimal ? val : Math.floor(val);
    };
    
    const randomBool = (probability = 0.5) => Math.random() < probability;
    
    const color = generateRandomColor();
    
    return {
        ...defaultSettings,
        patternMode: randomBool() ? 'radial' : 'horizontal',
        colorMode: randomBool() ? 'static' : 'cycle',
        colorHue: color.hue,
        colorSaturation: color.saturation,
        colorLightness: color.lightness,
        color: hslToHex(color.hue, color.saturation, color.lightness),
        colorCycleSpeed: random(0.5, 5, true),
        lineCount: random(3, 16),
        lineThickness: random(1, 5),
        sensitivity: random(30, 70),
        particlesEnabled: randomBool(0.6),
        particleSize: random(2, 6),
        wavesEnabled: randomBool(0.6),
        frequencyBarsEnabled: randomBool(0.3),
        beatSensitivity: random(0.2, 0.4, true),
        beatIntensity: random(1.2, 2.5, true),
        beatDecay: random(0.95, 0.99, true),
        horizontalLineCount: random(2, 8),
        horizontalLineSpacing: random(50, 150),
        waveAmplitude: random(30, 100),
        waveSpeed: random(1, 4, true),
        verticalMovement: randomBool(0.7) ? 'updown' : 'none',
        verticalSpeed: random(0.5, 3, true),
        verticalRange: random(100, 300),
        bassFrequency: random(100, 200),
        bassQuality: random(0.5, 2)
    };
}
