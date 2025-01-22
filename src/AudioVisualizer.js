/**
 * Main AudioVisualizer class
 */

import { initializeAudio, detectBeat, setupAudioInput } from './utils/AudioUtils.js';
import { updateCycleColor } from './utils/ColorUtils.js';
import { drawRadialLines } from './patterns/RadialPattern.js';
import { drawHorizontalLines } from './patterns/HorizontalPattern.js';
import { createParticles, updateParticles } from './effects/ParticleEffect.js';
import { createWave, updateWaves } from './effects/WaveEffect.js';
import { drawFrequencyBars } from './effects/FrequencyBars.js';
import {
    defaultSettings,
    loadSettings,
    saveSettings,
    loadPreset,
    savePreset,
    randomizeSettings,
    presets
} from './Settings.js';

export class AudioVisualizer {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.isPlaying = false;
        this.lines = [];
        
        // Beat detection data
        this.beatDetectionData = {
            energy: {
                current: 0,
                previous: 0,
                history: new Array(8).fill(0.1)
            },
            threshold: 0.3,
            lastBeatTime: 0
        };
        
        // Visual effects state
        this.particles = [];
        this.waves = [];
        
        // Load settings
        this.settings = loadSettings();
        
        this.setupCanvas();
        this.setupEventListeners();
        this.updateUIFromSettings();
        
        // Populate preset list
        this.populatePresetList();
        
        this.audioStream = null;

        // Define saveHandler as a class property
        this.saveHandler = () => this.saveNewPreset();
    }
    
    setupCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    async startAudio() {
        try {
            if (!this.audioStream) {
                this.audioStream = await setupAudioInput();
            }
            
            const audio = await initializeAudio(this.audioStream, this.settings);
            this.audioContext = audio.context;
            this.analyser = audio.analyser;
            this.dataArray = audio.dataArray;
            
            this.isPlaying = true;
            this.animate();
            
        } catch (err) {
            console.error('Error starting audio:', err);
            alert('Error accessing microphone. Please ensure you have a microphone connected and have granted permission to use it.');
        }
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
    
    animate = () => {
        if (!this.isPlaying) return;
        
        // Get audio data
        this.analyser.getByteFrequencyData(this.dataArray);
        const beat = detectBeat(this.dataArray, this.beatDetectionData, this.settings);
        
        // Update color if needed
        if (this.settings.colorMode === 'cycle') {
            this.settings.color = updateCycleColor(this.settings);
        }
        
        // Clear canvas with fade effect
        const fadeAlpha = beat ? 0.2 : 0.1;
        this.ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const dimensions = {
            width: this.canvas.width,
            height: this.canvas.height
        };
        
        // Draw based on pattern mode
        if (this.settings.patternMode === 'horizontal') {
            drawHorizontalLines(this.ctx, dimensions, this.dataArray, this.settings, beat);
        } else {
            drawRadialLines(this.ctx, dimensions, this.dataArray, this.settings, beat);
        }
        
        // Draw additional effects
        if (this.settings.wavesEnabled) {
            if (beat) this.waves.push(createWave());
            this.waves = updateWaves(this.ctx, this.waves, dimensions, this.settings);
        }
        
        if (this.settings.particlesEnabled) {
            if (beat) this.particles.push(...createParticles(dimensions, this.settings));
            this.particles = updateParticles(this.ctx, this.particles, this.settings);
        }
        
        if (this.settings.frequencyBarsEnabled) {
            drawFrequencyBars(this.ctx, dimensions, this.dataArray, this.settings);
        }
        
        requestAnimationFrame(this.animate);
    }

    setupEventListeners() {
        // Start audio button
        const startAudioBtn = document.getElementById('startAudio');
        if (startAudioBtn) {
            startAudioBtn.addEventListener('click', () => this.startAudio());
        }

        // Fullscreen button
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen();
                } else {
                    document.exitFullscreen();
                }
            });
        }

        // Settings toggle
        const toggleSettings = document.getElementById('toggleSettings');
        if (toggleSettings) {
            toggleSettings.addEventListener('click', () => {
                const settingsPanel = document.getElementById('settingsPanel');
                if (settingsPanel) {
                    settingsPanel.classList.toggle('visible');
                }
            });
        }

        // Color picker
        const colorPicker = document.getElementById('colorPicker');
        if (colorPicker) {
            colorPicker.addEventListener('input', (e) => {
                this.settings.color = e.target.value;
                this.saveSettings();
            });
        }

        // Sensitivity slider
        const sensitivity = document.getElementById('sensitivity');
        if (sensitivity) {
            sensitivity.addEventListener('input', (e) => {
                this.settings.sensitivity = parseInt(e.target.value);
                this.saveSettings();
            });
        }

        // Line count slider
        const lineCount = document.getElementById('lineCount');
        if (lineCount) {
            lineCount.addEventListener('input', (e) => {
                this.settings.lineCount = parseInt(e.target.value);
                this.saveSettings();
            });
        }

        // Beat sensitivity slider
        const beatSensitivity = document.getElementById('beatSensitivity');
        if (beatSensitivity) {
            beatSensitivity.addEventListener('input', (e) => {
                this.settings.beatSensitivity = parseFloat(e.target.value);
                this.saveSettings();
            });
        }

        // Pattern mode select
        const patternMode = document.getElementById('patternMode');
        if (patternMode) {
            patternMode.addEventListener('change', (e) => {
                this.settings.patternMode = e.target.value;
                this.updateUIFromSettings();
                this.saveSettings();
            });
        }

        // Color mode select
        const colorMode = document.getElementById('colorMode');
        if (colorMode) {
            colorMode.addEventListener('change', (e) => {
                this.settings.colorMode = e.target.value;
                this.updateUIFromSettings();
                this.saveSettings();
            });
        }

        // Color cycle speed slider
        const colorCycleSpeed = document.getElementById('colorCycleSpeed');
        if (colorCycleSpeed) {
            colorCycleSpeed.addEventListener('input', (e) => {
                this.settings.colorCycleSpeed = parseInt(e.target.value);
                this.saveSettings();
            });
        }

        // Horizontal line count slider
        const horizontalLineCount = document.getElementById('horizontalLineCount');
        if (horizontalLineCount) {
            horizontalLineCount.addEventListener('input', (e) => {
                this.settings.horizontalLineCount = parseInt(e.target.value);
                this.saveSettings();
            });
        }

        // Horizontal line spacing slider
        const horizontalLineSpacing = document.getElementById('horizontalLineSpacing');
        if (horizontalLineSpacing) {
            horizontalLineSpacing.addEventListener('input', (e) => {
                this.settings.horizontalLineSpacing = parseInt(e.target.value);
                this.saveSettings();
            });
        }

        // Wave amplitude slider
        const waveAmplitude = document.getElementById('waveAmplitude');
        if (waveAmplitude) {
            waveAmplitude.addEventListener('input', (e) => {
                this.settings.waveAmplitude = parseInt(e.target.value);
                this.saveSettings();
            });
        }

        // Wave speed slider
        const waveSpeed = document.getElementById('waveSpeed');
        if (waveSpeed) {
            waveSpeed.addEventListener('input', (e) => {
                this.settings.waveSpeed = parseInt(e.target.value);
                this.saveSettings();
            });
        }

        // Vertical movement select
        const verticalMovement = document.getElementById('verticalMovement');
        if (verticalMovement) {
            verticalMovement.addEventListener('change', (e) => {
                this.settings.verticalMovement = e.target.value;
                this.saveSettings();
            });
        }

        // Bass frequency slider
        const bassFrequency = document.getElementById('bassFrequency');
        if (bassFrequency) {
            bassFrequency.addEventListener('input', (e) => {
                this.settings.bassFrequency = parseInt(e.target.value);
                this.updateBassFilter();
                this.saveSettings();
            });
        }

        // Bass quality slider
        const bassQuality = document.getElementById('bassQuality');
        if (bassQuality) {
            bassQuality.addEventListener('input', (e) => {
                this.settings.bassQuality = parseFloat(e.target.value);
                this.updateBassFilter();
                this.saveSettings();
            });
        }

        // Randomize button
        const randomizeBtn = document.getElementById('randomizeBtn');
        if (randomizeBtn) {
            randomizeBtn.addEventListener('click', () => {
                this.randomizeSettings();
            });
        }

        // Save preset button
        const savePresetBtn = document.getElementById('savePreset');
        if (savePresetBtn) {
            savePresetBtn.removeEventListener('click', this.saveHandler);
            savePresetBtn.addEventListener('click', this.saveHandler, { once: true });
        }

        // Load preset button
        const loadPresetBtn = document.getElementById('loadPreset');
        if (loadPresetBtn) {
            loadPresetBtn.addEventListener('click', () => {
                this.loadSelectedPreset();
            });
        }

        // Preset select
        const presetSelect = document.getElementById('presetSelect');
        if (presetSelect) {
            presetSelect.addEventListener('change', () => {
                this.loadSelectedPreset();
            });
        }
    }

    updateUIFromSettings() {
        // Update pattern mode visibility
        const horizontalControls = document.getElementById('horizontalControls');
        if (horizontalControls) {
            if (this.settings.patternMode === 'horizontal') {
                horizontalControls.classList.add('visible');
            } else {
                horizontalControls.classList.remove('visible');
            }
        }

        // Update color mode visibility
        const cycleControls = document.getElementById('cycleControls');
        if (cycleControls) {
            if (this.settings.colorMode === 'cycle') {
                cycleControls.classList.add('visible');
            } else {
                cycleControls.classList.remove('visible');
            }
        }

        // Update input values
        const elements = {
            'sensitivity': this.settings.sensitivity,
            'lineCount': this.settings.lineCount,
            'beatSensitivity': this.settings.beatSensitivity,
            'patternMode': this.settings.patternMode,
            'colorMode': this.settings.colorMode,
            'colorPicker': this.settings.color,
            'horizontalLineCount': this.settings.horizontalLineCount,
            'horizontalLineSpacing': this.settings.horizontalLineSpacing,
            'waveAmplitude': this.settings.waveAmplitude,
            'waveSpeed': this.settings.waveSpeed,
            'verticalMovement': this.settings.verticalMovement,
            'colorCycleSpeed': this.settings.colorCycleSpeed,
            'colorSaturation': this.settings.colorSaturation,
            'bassFrequency': this.settings.bassFrequency,
            'bassQuality': this.settings.bassQuality
        };

        for (const [id, value] of Object.entries(elements)) {
            const element = document.getElementById(id);
            if (element) {
                if (element.type === 'range' || element.type === 'number') {
                    element.value = value;
                } else if (element.type === 'color') {
                    element.value = value;
                } else if (element.tagName === 'SELECT') {
                    element.value = value;
                }
            }
        }
    }

    drawLines(beat) {
        drawRadialLines(this.ctx, {
            width: this.canvas.width,
            height: this.canvas.height
        }, this.dataArray, this.settings, beat);
    }

    drawHorizontalLines(beat) {
        drawHorizontalLines(this.ctx, {
            width: this.canvas.width,
            height: this.canvas.height
        }, this.dataArray, this.settings, beat);
    }

    saveSettings() {
        saveSettings(this.settings);
    }

    loadSavedSettings() {
        this.settings = loadSettings();
        this.updateUIFromSettings();
    }

    detectBeat(audioData) {
        return detectBeat(audioData, this.beatDetectionData, this.settings);
    }

    loadPreset(presetName) {
        this.settings = loadPreset(presetName);
        this.updateUIFromSettings();
    }

    saveCurrentAsPreset(presetName) {
        savePreset(presetName, this.settings);
    }

    updateParticles(beat) {
        if (beat && this.settings.particlesEnabled) {
            this.particles.push(...createParticles({
                width: this.canvas.width,
                height: this.canvas.height
            }, this.settings));
        }
        this.particles = updateParticles(this.ctx, this.particles, this.settings);
    }

    updateWaves(beat) {
        if (beat && this.settings.wavesEnabled) {
            this.waves.push(createWave());
        }
        this.waves = updateWaves(this.ctx, this.waves, {
            width: this.canvas.width,
            height: this.canvas.height
        }, this.settings);
    }

    drawFrequencyBars() {
        if (this.settings.frequencyBarsEnabled) {
            drawFrequencyBars(this.ctx, {
                width: this.canvas.width,
                height: this.canvas.height
            }, this.dataArray, this.settings);
        }
    }

    get presets() {
        return presets;
    }

    toggleSettings() {
        const settingsPanel = document.getElementById('settingsPanel');
        if (settingsPanel) {
            settingsPanel.classList.toggle('hidden');
        }
    }

    populatePresetList() {
        const presetSelect = document.getElementById('presetSelect');
        if (presetSelect) {
            // Clear existing options
            presetSelect.innerHTML = '';
            
            // Add built-in presets
            const builtInPresets = [
                'default',
                'minimal',
                'maximal',
                'neon',
                'matrix',
                'sunset',
                'ocean',
                'fire',
                'rainbow',
                'cosmic',
                'retro',
                'zen'
            ];
            
            builtInPresets.forEach(presetName => {
                const option = document.createElement('option');
                option.value = presetName;
                option.textContent = presetName === 'default' ? 'Default' :
                                   presetName === 'neon' ? 'Neon Pulse' :
                                   presetName === 'matrix' ? 'Matrix' :
                                   presetName === 'sunset' ? 'Sunset Waves' :
                                   presetName === 'ocean' ? 'Ocean Deep' :
                                   presetName === 'fire' ? 'Fire Dance' :
                                   presetName === 'rainbow' ? 'Rainbow Flow' :
                                   presetName === 'cosmic' ? 'Cosmic Rays' :
                                   presetName === 'retro' ? 'Retro Wave' :
                                   presetName === 'zen' ? 'Zen Garden' :
                                   presetName.charAt(0).toUpperCase() + presetName.slice(1);
                presetSelect.appendChild(option);
            });
            
            // Load and add custom presets from localStorage
            const savedPresets = JSON.parse(localStorage.getItem('presets') || '{}');
            Object.keys(savedPresets).forEach(presetName => {
                const option = document.createElement('option');
                option.value = presetName;
                option.textContent = presetName;
                presetSelect.appendChild(option);
            });
        }
    }

    saveNewPreset() {
        const presetNameInput = document.getElementById('newPresetName');
        console.log('Input element:', presetNameInput);
        console.log('Input value:', presetNameInput?.value);
        
        if (!presetNameInput) {
            console.error('Could not find preset name input element');
            return;
        }
        
        const presetName = presetNameInput.value?.trim();
        console.log('Trimmed preset name:', presetName);
        
        if (!presetName) {
            alert('Please enter a name for the preset');
            return;
        }
        
        // Get existing presets from localStorage
        const savedPresets = JSON.parse(localStorage.getItem('presets') || '{}');
        
        // Add new preset
        savedPresets[presetName] = { ...this.settings };
        
        // Save back to localStorage
        localStorage.setItem('presets', JSON.stringify(savedPresets));
        
        // Add just the new option to the select dropdown
        const presetSelect = document.getElementById('presetSelect');
        if (presetSelect) {
            const option = document.createElement('option');
            option.value = presetName;
            option.textContent = presetName;
            presetSelect.appendChild(option);
            presetSelect.value = presetName;
        }
        
        // Clear the input field
        presetNameInput.value = '';
    }

    loadSelectedPreset() {
        const presetSelect = document.getElementById('presetSelect');
        if (presetSelect) {
            const selectedPreset = presetSelect.value;
            
            // Check if it's a built-in preset
            if (this.presets[selectedPreset]) {
                this.settings = { ...this.settings, ...this.presets[selectedPreset] };
            } else {
                // Load custom preset from localStorage
                const savedPresets = JSON.parse(localStorage.getItem('presets') || '{}');
                if (savedPresets[selectedPreset]) {
                    this.settings = { ...this.settings, ...savedPresets[selectedPreset] };
                }
            }
            
            // Update UI and save settings
            this.updateUIFromSettings();
            this.saveSettings();
            
            // Update bass filter if it exists
            this.updateBassFilter();
        }
    }

    updateBassFilter() {
        if (this.bassFilter) {
            this.bassFilter.frequency.value = this.settings.bassFrequency;
            this.bassFilter.Q.value = this.settings.bassQuality;
        }
    }

    randomizeSettings() {
        // Randomize various settings
        this.settings.lineCount = Math.floor(Math.random() * 150) + 50;
        this.settings.sensitivity = Math.floor(Math.random() * 75) + 25;
        this.settings.beatSensitivity = Math.random() * 1.5 + 0.5;
        
        // Generate valid 6-digit hex color
        const r = Math.floor(Math.random() * 255).toString(16).padStart(2, '0');
        const g = Math.floor(Math.random() * 255).toString(16).padStart(2, '0');
        const b = Math.floor(Math.random() * 255).toString(16).padStart(2, '0');
        this.settings.color = `#${r}${g}${b}`;
        
        this.settings.colorCycleSpeed = Math.floor(Math.random() * 100);
        this.settings.colorSaturation = Math.floor(Math.random() * 100);
        
        // Save and update UI
        this.updateUIFromSettings();
        this.saveSettings();
    }
}

// Initialize on DOM content loaded
window.addEventListener('DOMContentLoaded', () => {
    // Verify all required elements exist
    const requiredElements = [
        'canvas',
        'startAudio',
        'fullscreenBtn',
        'colorPicker',
        'sensitivity',
        'lineCount',
        'toggleSettings',
        'particlesEffect',
        'particleSize',
        'wavesEffect',
        'frequencyBars',
        'lineThickness',
        'patternMode',
        'horizontalControls',
        'colorMode',
        'cycleControls',
        'colorCycleSpeed',
        'colorSaturation',
        'colorLightness',
        'horizontalLineCount',
        'horizontalLineSpacing',
        'waveAmplitude',
        'waveSpeed',
        'verticalMovement',
        'verticalSpeed',
        'verticalRange',
        'settings',
        'presetSelect',
        'loadPreset',
        'newPresetName',
        'savePreset',
        'bassFrequency',
        'bassQuality'
    ];

    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    
    if (missingElements.length > 0) {
        console.error('Missing HTML elements:', missingElements);
        return;
    }

    // Initialize visualizer
    const visualizer = new AudioVisualizer();
    setTimeout(() => visualizer.startAudio(), 100);
}); 