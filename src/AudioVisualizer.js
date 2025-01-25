/**
 * Main AudioVisualizer class
 */

import { initializeAudio, detectBeat, setupAudioInput } from './utils/AudioUtils.js';
import { updateCycleColor } from './utils/ColorUtils.js';
import { drawRadialLines } from './patterns/RadialPattern.js';
import { drawHorizontalLines } from './patterns/HorizontalPattern.js';
import { drawOvals } from './patterns/OvalPattern.js';
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
            lastBeatTime: 0,
            beatCount: 0
        };
        
        // Noise auto-shuffle state
        this.noiseState = {
            quietStartTime: null,
            readyToShuffle: false,
            lastShuffleTime: 0,
            energyHistory: null
        };
        
        // Visual effects state
        this.particles = [];
        this.waves = [];
        
        // Load settings
        this.settings = loadSettings();
        
        this.setupCanvas();
        this.setupEventListeners();
        this.setupStorageListener();

        // Only initialize settings UI if we're on the settings page
        if (window.location.pathname === '/settings') {
            this.updateUIFromSettings();
            this.populatePresetList();
            this.saveHandler = () => this.saveNewPreset();
        }
        
        this.audioStream = null;
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
        
        // Handle beat counting and beat-based auto-shuffle
        if (beat) {
            console.log("Beat detected in visualizer, current count:", this.beatDetectionData.beatCount);
            this.beatDetectionData.beatCount++;
            
            // Update settings manager with new beat count
            if (window.settingsManager) {
                window.settingsManager.updateBeatCount(this.beatDetectionData.beatCount);
            }
            
            if (this.settings.beatAutoShuffle && this.beatDetectionData.beatCount >= 240) {
                console.log("Reached 240 beats, randomizing settings...");
                this.settings = randomizeSettings();
                this.beatDetectionData.beatCount = 0;
                
                // Update UI if on settings page
                if (window.location.pathname === '/settings') {
                    this.updateUIFromSettings();
                }
                
                // Update settings manager with reset beat count
                if (window.settingsManager) {
                    window.settingsManager.updateBeatCount(0);
                }
            }
        }
        
        // Calculate current energy level
        const currentEnergy = this.dataArray.reduce((sum, value) => sum + value, 0) / this.dataArray.length / 255;
        
        // Handle noise-based auto-shuffle
        if (this.settings.noiseAutoShuffle) {
            const now = performance.now();
            const minShuffleInterval = 5000; // Minimum 5 seconds between shuffles
            
            // Keep a short history of energy levels to detect relative changes
            if (!this.noiseState.energyHistory) {
                this.noiseState.energyHistory = new Array(30).fill(currentEnergy); // About 0.5 seconds of history
            }
            
            // Update energy history
            this.noiseState.energyHistory.push(currentEnergy);
            this.noiseState.energyHistory.shift();
            
            // Calculate average energy over the last ~0.5 seconds
            const avgEnergy = this.noiseState.energyHistory.reduce((a, b) => a + b) / this.noiseState.energyHistory.length;
            
            // Detect when energy drops significantly below average
            if (currentEnergy < avgEnergy * 0.7) { // Energy is 30% below average
                if (!this.noiseState.quietStartTime) {
                    console.log("Detected quieter section, current energy:", currentEnergy, "avg:", avgEnergy);
                    this.noiseState.quietStartTime = now;
                }
                
                // After a short period in the quieter section, get ready to shuffle
                const quietDuration = now - this.noiseState.quietStartTime;
                if (!this.noiseState.readyToShuffle && 
                    quietDuration > 1000) { // Wait 1 second in quieter section
                    console.log("Ready to shuffle when volume increases");
                    this.noiseState.readyToShuffle = true;
                }
            } else if (currentEnergy > avgEnergy * 1.3 && // Energy is 30% above average
                      this.noiseState.readyToShuffle && 
                      now - this.noiseState.lastShuffleTime > minShuffleInterval) {
                // Shuffle when we detect a volume increase
                console.log("Volume increased, shuffling! Current energy:", currentEnergy, "avg:", avgEnergy);
                this.settings = randomizeSettings();
                this.noiseState.readyToShuffle = false;
                this.noiseState.lastShuffleTime = now;
                this.noiseState.quietStartTime = null;
                
                // Update UI if on settings page
                if (window.location.pathname === '/settings') {
                    this.updateUIFromSettings();
                }
            }
        }
        
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
        } else if (this.settings.patternMode === 'oval') {
            drawOvals(this.ctx, dimensions, this.dataArray, this.settings, beat);
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
        
        // if (this.settings.frequencyBarsEnabled) {
        //     drawFrequencyBars(this.ctx, dimensions, this.dataArray, this.settings);
        // }
        
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
    }

    setupStorageListener() {
        // Listen for settings changes from other tabs
        window.addEventListener('storage', (e) => {
            if (e.key === 'visualizerSettings') {
                this.settings = JSON.parse(e.newValue);
                
                // Update UI if we're on the settings page
                if (window.location.pathname === '/settings') {
                    this.updateUIFromSettings();
                }

                // Update bass filter if it exists
                this.updateBassFilter();
            }
        });
    }

    updateUIFromSettings() {
        // Only update UI if we're on the settings page
        if (window.location.pathname === '/settings') {
            // Helper function to update slider value display
            const updateSliderValue = (slider) => {
                const container = slider.closest('.slider-container');
                if (container) {
                    const currentValue = container.querySelector('.current-value');
                    if (currentValue) {
                        currentValue.textContent = slider.value;
                    }
                }
            };

            // Helper function to add slider listener
            const addSliderListener = (elementId, settingKey, parseFunc = parseInt) => {
                const element = document.getElementById(elementId);
                if (element) {
                    element.addEventListener('input', (e) => {
                        this.settings[settingKey] = parseFunc(e.target.value);
                        updateSliderValue(e.target);
                        this.saveSettings();
                    });
                    // Initialize value display
                    updateSliderValue(element);
                }
            };

            // Settings toggle
            const toggleSettings = document.getElementById('toggleSettings');
            if (toggleSettings) {
                toggleSettings.addEventListener('click', () => {
                    const settingsPanel = document.getElementById('settings');
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

            // Add listeners for all sliders
            addSliderListener('sensitivity', 'sensitivity');
            addSliderListener('lineCount', 'lineCount');
            addSliderListener('lineThickness', 'lineThickness');
            addSliderListener('beatSensitivity', 'beatSensitivity', parseFloat);
            addSliderListener('beatIntensity', 'beatIntensity', parseFloat);
            addSliderListener('beatDecay', 'beatDecay', parseFloat);
            addSliderListener('colorCycleSpeed', 'colorCycleSpeed', parseFloat);
            addSliderListener('colorSaturation', 'colorSaturation');
            addSliderListener('colorLightness', 'colorLightness');
            addSliderListener('horizontalLineCount', 'horizontalLineCount');
            addSliderListener('horizontalLineSpacing', 'horizontalLineSpacing');
            addSliderListener('waveAmplitude', 'waveAmplitude');
            addSliderListener('waveSpeed', 'waveSpeed', parseFloat);
            addSliderListener('verticalSpeed', 'verticalSpeed', parseFloat);
            addSliderListener('verticalRange', 'verticalRange');
            addSliderListener('bassFrequency', 'bassFrequency');
            addSliderListener('bassQuality', 'bassQuality', parseFloat);
            addSliderListener('particleSize', 'particleSize');

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

            // Vertical movement select
            const verticalMovement = document.getElementById('verticalMovement');
            if (verticalMovement) {
                verticalMovement.addEventListener('change', (e) => {
                    this.settings.verticalMovement = e.target.value;
                    this.saveSettings();
                });
            }

            // Effect checkboxes
            const particlesEffect = document.getElementById('particlesEffect');
            if (particlesEffect) {
                particlesEffect.addEventListener('change', (e) => {
                    this.settings.particlesEnabled = e.target.checked;
                    this.saveSettings();
                });
            }

            const wavesEffect = document.getElementById('wavesEffect');
            if (wavesEffect) {
                wavesEffect.addEventListener('change', (e) => {
                    this.settings.wavesEnabled = e.target.checked;
                    this.saveSettings();
                });
            }

            const frequencyBars = document.getElementById('frequencyBars');
            if (frequencyBars) {
                frequencyBars.addEventListener('change', (e) => {
                    this.settings.frequencyBarsEnabled = e.target.checked;
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

            // Add listeners for oval pattern controls
            addSliderListener('ovalCount', 'ovalCount');
            addSliderListener('ovalSize', 'ovalSize');
            addSliderListener('ovalMovementSpeed', 'ovalMovementSpeed');
            addSliderListener('ovalMovementRange', 'ovalMovementRange');
            addSliderListener('ovalHeightOffset', 'ovalHeightOffset');
            addSliderListener('ovalWidthRatio', 'ovalWidthRatio', parseFloat);
            addSliderListener('ovalRotationSpeed', 'ovalRotationSpeed', parseFloat);
            
            // Special handling for rotation offset to convert degrees to radians
            const ovalRotationOffset = document.getElementById('ovalRotationOffset');
            if (ovalRotationOffset) {
                ovalRotationOffset.addEventListener('input', (e) => {
                    // Convert degrees to radians
                    this.settings.ovalRotationOffset = (parseFloat(e.target.value) * Math.PI) / 180;
                    const container = e.target.closest('.slider-container');
                    if (container) {
                        const currentValue = container.querySelector('.current-value');
                        if (currentValue) {
                            currentValue.textContent = e.target.value + '°';
                        }
                    }
                    this.saveSettings();
                });
            }

            const ovalStyle = document.getElementById('ovalStyle');
            if (ovalStyle) {
                ovalStyle.addEventListener('change', (e) => {
                    this.settings.ovalStyle = e.target.value;
                    
                    // Update UI for ovalsv2 style
                    const ovalControls = document.getElementById('ovalControls');
                    if (ovalControls) {
                        if (e.target.value === 'ovalsv2') {
                            ovalControls.classList.add('ovalsv2');
                        } else {
                            ovalControls.classList.remove('ovalsv2');
                        }
                    }
                    
                    this.saveSettings();
                });
            }

            // Update UI based on current style
            const ovalControls = document.getElementById('ovalControls');
            if (ovalControls && this.settings.ovalStyle === 'ovalsv2') {
                ovalControls.classList.add('ovalsv2');
            }

            const ovalSecondaryColor = document.getElementById('ovalSecondaryColor');
            if (ovalSecondaryColor) {
                ovalSecondaryColor.addEventListener('input', (e) => {
                    this.settings.ovalSecondaryColor = e.target.value;
                    this.saveSettings();
                });
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
        // Use ranges from test cases (lines 141-144 in Settings.test.js)
        this.settings.lineCount = Math.floor(Math.random() * 13) + 3; // 3-16 range
        this.settings.sensitivity = Math.floor(Math.random() * 40) + 30; // 30-70 range
        this.settings.beatSensitivity = Math.random() * 0.2 + 0.2; // 0.2-0.4 range
        
        // Generate valid 6-digit hex color
        const r = Math.floor(Math.random() * 255).toString(16).padStart(2, '0');
        const g = Math.floor(Math.random() * 255).toString(16).padStart(2, '0');
        const b = Math.floor(Math.random() * 255).toString(16).padStart(2, '0');
        this.settings.color = `#${r}${g}${b}`;
        
        // Use ranges from test cases and presets
        this.settings.colorCycleSpeed = Math.random() * 4.5 + 0.5; // 0.5-5.0 range
        this.settings.colorSaturation = Math.floor(Math.random() * 60) + 40; // 40-100 range
        this.settings.beatIntensity = Math.random() * 1.3 + 1.2; // 1.2-2.5 range
        this.settings.beatDecay = Math.random() * 0.04 + 0.95; // 0.95-0.99 range
        
        // Pattern-specific settings
        this.settings.horizontalLineCount = Math.floor(Math.random() * 6) + 2; // 2-8 range
        this.settings.horizontalLineSpacing = Math.floor(Math.random() * 100) + 50; // 50-150 range
        this.settings.waveAmplitude = Math.floor(Math.random() * 70) + 30; // 30-100 range
        this.settings.waveSpeed = Math.random() * 3 + 1; // 1-4 range
        
        // Random boolean settings
        this.settings.patternMode = Math.random() < 0.5 ? 'radial' : 'horizontal';
        this.settings.colorMode = Math.random() < 0.5 ? 'static' : 'cycle';
        this.settings.verticalMovement = Math.random() < 0.7 ? 'updown' : 'none';
        
        // Save and update UI
        this.updateUIFromSettings();
        this.saveSettings();
    }
} 