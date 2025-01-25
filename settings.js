import {
    defaultSettings,
    loadSettings,
    saveSettings,
    loadPreset,
    savePreset,
    randomizeSettings
} from './src/Settings.js';

export class SettingsManager {
    constructor() {
        this.settings = loadSettings();
        this.setupEventListeners();
        this.updateUIFromSettings();
        this.autoShuffleInterval = null;
        this.countdownInterval = null;
        this.lastShuffleTime = Date.now();
        this.beatCount = 0; // Add beat count tracking
        
        // Only initialize settings UI if we're on the settings page
        if (window.location.pathname === '/settings') {
            this.updateUIFromSettings();
            this.populatePresetList();
            this.saveHandler = () => this.saveNewPreset();
            
            // Initialize auto-shuffle if enabled
            if (this.settings.autoShuffle) {
                this.startAutoShuffle();
            }
            
            // Start countdown updates
            this.startCountdownUpdates();
        }
    }

    // Add method to update beat count
    updateBeatCount(count) {
        this.beatCount = count;
        if (this.settings.beatAutoShuffle) {
            const beatElement = document.getElementById('beatCountdown');
            if (beatElement) {
                const remaining = Math.max(0, 120 - this.beatCount);
                beatElement.textContent = `(${remaining})`;
            }
        }
    }

    startCountdownUpdates() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        
        this.countdownInterval = setInterval(() => {
            // Update time-based countdown
            if (this.settings.autoShuffle) {
                const timeElement = document.getElementById('timeCountdown');
                if (timeElement) {
                    const elapsed = Date.now() - this.lastShuffleTime;
                    const remaining = Math.max(0, 30 - Math.floor(elapsed / 1000));
                    timeElement.textContent = `(${remaining}s)`;
                }
            }
        }, 1000); // Update every second
    }

    startAutoShuffle() {
        if (this.autoShuffleInterval) {
            clearInterval(this.autoShuffleInterval);
        }
        this.lastShuffleTime = Date.now();
        this.autoShuffleInterval = setInterval(() => {
            this.settings = randomizeSettings();
            this.updateUIFromSettings();
            this.lastShuffleTime = Date.now();
        }, 30000); // 30 seconds
    }

    stopAutoShuffle() {
        if (this.autoShuffleInterval) {
            clearInterval(this.autoShuffleInterval);
            this.autoShuffleInterval = null;
        }
        // Clear the countdown display
        const timeElement = document.getElementById('timeCountdown');
        if (timeElement) {
            timeElement.textContent = '';
        }
    }

    setupEventListeners() {
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
        addSliderListener('ovalCount', 'ovalCount');
        addSliderListener('ovalSize', 'ovalSize');
        addSliderListener('ovalMovementSpeed', 'ovalMovementSpeed', parseFloat);
        addSliderListener('ovalMovementRange', 'ovalMovementRange');
        addSliderListener('ovalHeightOffset', 'ovalHeightOffset');
        addSliderListener('ovalWidthRatio', 'ovalWidthRatio', parseFloat);
        addSliderListener('ovalRotationSpeed', 'ovalRotationSpeed', parseFloat);

        // Special handling for rotation offset to convert degrees to radians
        const ovalRotationOffset = document.getElementById('ovalRotationOffset');
        if (ovalRotationOffset) {
            ovalRotationOffset.addEventListener('input', (e) => {
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

        // Add these to the setupEventListeners method
        const addCheckboxListener = (elementId, settingKey) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.addEventListener('change', (e) => {
                    this.settings[settingKey] = e.target.checked;
                    this.saveSettings();
                });
            }
        };

        // Add checkbox listeners
        addCheckboxListener('particlesEffect', 'particlesEnabled');
        addCheckboxListener('wavesEffect', 'wavesEnabled');

        // Vertical movement select
        const verticalMovement = document.getElementById('verticalMovement');
        if (verticalMovement) {
            verticalMovement.addEventListener('change', (e) => {
                this.settings.verticalMovement = e.target.value;
                this.saveSettings();
            });
        }

        // Oval style select
        const ovalStyle = document.getElementById('ovalStyle');
        if (ovalStyle) {
            ovalStyle.addEventListener('change', (e) => {
                this.settings.ovalStyle = e.target.value;
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

        // Secondary color
        const ovalSecondaryColor = document.getElementById('ovalSecondaryColor');
        if (ovalSecondaryColor) {
            ovalSecondaryColor.addEventListener('input', (e) => {
                this.settings.ovalSecondaryColor = e.target.value;
                this.saveSettings();
            });
        }

        // Preset controls
        const loadPresetBtn = document.getElementById('loadPreset');
        if (loadPresetBtn) {
            loadPresetBtn.addEventListener('click', () => {
                const presetSelect = document.getElementById('presetSelect');
                if (presetSelect) {
                    this.settings = loadPreset(presetSelect.value);
                    this.updateUIFromSettings();
                    this.saveSettings();
                }
            });
        }

        // Save preset
        const savePresetBtn = document.getElementById('savePreset');
        if (savePresetBtn) {
            savePresetBtn.addEventListener('click', () => {
                const presetNameInput = document.getElementById('newPresetName');
                if (presetNameInput && presetNameInput.value.trim()) {
                    savePreset(presetNameInput.value.trim(), this.settings);
                    presetNameInput.value = '';
                    alert('Preset saved!');
                } else {
                    alert('Please enter a preset name');
                }
            });
        }

        // Add auto-shuffle checkbox listener
        const autoShuffleCheckbox = document.getElementById('autoShuffle');
        if (autoShuffleCheckbox) {
            autoShuffleCheckbox.addEventListener('change', (e) => {
                this.settings.autoShuffle = e.target.checked;
                if (e.target.checked) {
                    this.startAutoShuffle();
                } else {
                    this.stopAutoShuffle();
                }
                this.saveSettings();
            });
        }

        // Add noise auto-shuffle checkbox listener
        const noiseAutoShuffleCheckbox = document.getElementById('noiseAutoShuffle');
        if (noiseAutoShuffleCheckbox) {
            noiseAutoShuffleCheckbox.addEventListener('change', (e) => {
                this.settings.noiseAutoShuffle = e.target.checked;
                this.saveSettings();
            });
        }

        // Add beat auto-shuffle checkbox listener
        const beatAutoShuffleCheckbox = document.getElementById('beatAutoShuffle');
        if (beatAutoShuffleCheckbox) {
            beatAutoShuffleCheckbox.addEventListener('change', (e) => {
                this.settings.beatAutoShuffle = e.target.checked;
                if (e.target.checked) {
                    // Reset beat count when enabling
                    this.beatCount = 0;
                }
                // Clear the countdown display if disabled
                if (!e.target.checked) {
                    const beatElement = document.getElementById('beatCountdown');
                    if (beatElement) {
                        beatElement.textContent = '';
                    }
                }
                this.saveSettings();
            });
        }

        // Add randomize button listener
        const randomizeBtn = document.getElementById('randomizeBtn');
        if (randomizeBtn) {
            randomizeBtn.addEventListener('click', () => {
                this.settings = randomizeSettings();
                this.updateUIFromSettings();
            });
        }
    }

    updateUIFromSettings() {
        // Update pattern mode visibility
        const horizontalControls = document.getElementById('horizontalControls');
        const ovalControls = document.getElementById('ovalControls');
        
        if (horizontalControls) {
            horizontalControls.classList.toggle('visible', this.settings.patternMode === 'horizontal');
        }
        
        if (ovalControls) {
            ovalControls.classList.toggle('visible', this.settings.patternMode === 'oval');
            if (this.settings.ovalStyle === 'ovalsv2') {
                ovalControls.classList.add('ovalsv2');
            } else {
                ovalControls.classList.remove('ovalsv2');
            }
        }

        // Update color mode visibility
        const cycleControls = document.getElementById('cycleControls');
        if (cycleControls) {
            cycleControls.classList.toggle('visible', this.settings.colorMode === 'cycle');
        }

        // Update auto-shuffle checkboxes and countdowns
        const autoShuffleCheckbox = document.getElementById('autoShuffle');
        if (autoShuffleCheckbox) {
            autoShuffleCheckbox.checked = this.settings.autoShuffle;
            if (!this.settings.autoShuffle) {
                const timeElement = document.getElementById('timeCountdown');
                if (timeElement) {
                    timeElement.textContent = '';
                }
            }
        }

        const noiseAutoShuffleCheckbox = document.getElementById('noiseAutoShuffle');
        if (noiseAutoShuffleCheckbox) {
            noiseAutoShuffleCheckbox.checked = this.settings.noiseAutoShuffle;
        }

        const beatAutoShuffleCheckbox = document.getElementById('beatAutoShuffle');
        if (beatAutoShuffleCheckbox) {
            beatAutoShuffleCheckbox.checked = this.settings.beatAutoShuffle;
            if (!this.settings.beatAutoShuffle) {
                const beatElement = document.getElementById('beatCountdown');
                if (beatElement) {
                    beatElement.textContent = '';
                }
            }
        }

        // Update all input values
        const elements = {
            'sensitivity': this.settings.sensitivity,
            'lineCount': this.settings.lineCount,
            'lineThickness': this.settings.lineThickness,
            'beatSensitivity': this.settings.beatSensitivity,
            'beatIntensity': this.settings.beatIntensity,
            'beatDecay': this.settings.beatDecay,
            'patternMode': this.settings.patternMode,
            'colorMode': this.settings.colorMode,
            'colorPicker': this.settings.color,
            'colorCycleSpeed': this.settings.colorCycleSpeed,
            'colorSaturation': this.settings.colorSaturation,
            'colorLightness': this.settings.colorLightness,
            'horizontalLineCount': this.settings.horizontalLineCount,
            'horizontalLineSpacing': this.settings.horizontalLineSpacing,
            'waveAmplitude': this.settings.waveAmplitude,
            'waveSpeed': this.settings.waveSpeed,
            'verticalMovement': this.settings.verticalMovement,
            'verticalSpeed': this.settings.verticalSpeed,
            'verticalRange': this.settings.verticalRange,
            'bassFrequency': this.settings.bassFrequency,
            'bassQuality': this.settings.bassQuality,
            'particleSize': this.settings.particleSize,
            'ovalCount': this.settings.ovalCount,
            'ovalSize': this.settings.ovalSize,
            'ovalStyle': this.settings.ovalStyle,
            'ovalMovementSpeed': this.settings.ovalMovementSpeed,
            'ovalMovementRange': this.settings.ovalMovementRange,
            'ovalHeightOffset': this.settings.ovalHeightOffset,
            'ovalWidthRatio': this.settings.ovalWidthRatio,
            'ovalRotationSpeed': this.settings.ovalRotationSpeed,
            'ovalRotationOffset': (this.settings.ovalRotationOffset * 180) / Math.PI,
            'ovalSecondaryColor': this.settings.ovalSecondaryColor
        };

        // Update checkbox states
        const updateCheckboxes = () => {
            const checkboxes = {
                'particlesEffect': this.settings.particlesEnabled,
                'wavesEffect': this.settings.wavesEnabled
            };

            for (const [id, value] of Object.entries(checkboxes)) {
                const element = document.getElementById(id);
                if (element) {
                    element.checked = value;
                }
            }
        };

        // Update all elements
        for (const [id, value] of Object.entries(elements)) {
            const element = document.getElementById(id);
            if (element) {
                if (element.type === 'range' || element.type === 'number') {
                    element.value = value;
                    const container = element.closest('.slider-container');
                    if (container) {
                        const currentValue = container.querySelector('.current-value');
                        if (currentValue) {
                            currentValue.textContent = id === 'ovalRotationOffset' ? value + '°' : value;
                        }
                    }
                } else if (element.type === 'color') {
                    element.value = value;
                } else if (element.tagName === 'SELECT') {
                    element.value = value;
                }
            }
        }

        // Update checkboxes
        updateCheckboxes();
    }

    saveSettings() {
        saveSettings(this.settings);
    }
}

// Initialize settings manager when the page loads
window.addEventListener('load', () => {
    new SettingsManager();
}); 