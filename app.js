class AudioVisualizer {
    constructor() {
        // Clear any existing settings
        localStorage.clear();
        console.log('Cleared localStorage');

        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.isPlaying = false;
        this.lines = [];
        
        // Add new properties for beat detection
        this.beatDetectionData = {
            threshold: 0.12,
            decay: 0.97,
            peaks: [],
            energy: {
                current: 0,
                previous: 0
            },
            beatCutoff: 0,
            beatTime: 0,
            energyHistory: new Array(8).fill(0)
        };
        
        // Add new properties for visual effects
        this.particles = [];
        this.waves = [];
        
        // Expand settings
        this.settings = {
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
            glowEnabled: false,
            glowIntensity: 20,  // New: control glow strength
            
            // Effects
            particlesEnabled: true,
            particleCount: 50,
            particleSize: 3,
            wavesEnabled: true,
            frequencyBarsEnabled: false, // Changed to false by default
            
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
            
            // Add bass filter settings
            bassFrequency: 150,  // Default value
            bassQuality: 1,      // Default Q value
        };
        
        this.presets = {
            default: {
                patternMode: 'radial',
                color: '#ff0000',
                colorMode: 'static',
                beatSensitivity: 0.3,
                beatIntensity: 1.5,
                beatDecay: 0.98,
                sensitivity: 50,
                lineCount: 8,
                lineThickness: 2,
                glowEnabled: true,
                glowIntensity: 20,
                particlesEnabled: true,
                particleCount: 50,
                particleSize: 3,
                wavesEnabled: true,
                frequencyBarsEnabled: false,
                colorCycleSpeed: 2,
                colorHue: 0,
                colorSaturation: 100,
                colorLightness: 50,
                horizontalLineCount: 3,
                horizontalLineSpacing: 100,
                waveAmplitude: 50,
                waveSpeed: 2,
                verticalMovement: 'none',
                verticalSpeed: 1,
                verticalRange: 200
            },
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
                glowEnabled: false,
                glowIntensity: 10,
                particlesEnabled: false,
                particleCount: 0,
                particleSize: 2,
                wavesEnabled: false,
                frequencyBarsEnabled: false,
                colorCycleSpeed: 1,
                colorHue: 120,
                colorSaturation: 100,
                colorLightness: 50,
                horizontalLineCount: 3,
                horizontalLineSpacing: 100,
                waveAmplitude: 30,
                waveSpeed: 1,
                verticalMovement: 'none',
                verticalSpeed: 1,
                verticalRange: 100
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
                glowEnabled: true,
                glowIntensity: 30,
                particlesEnabled: true,
                particleCount: 100,
                particleSize: 5,
                wavesEnabled: true,
                frequencyBarsEnabled: true,
                colorCycleSpeed: 3,
                colorHue: 240,
                colorSaturation: 100,
                colorLightness: 50,
                horizontalLineCount: 5,
                horizontalLineSpacing: 80,
                waveAmplitude: 100,
                waveSpeed: 3,
                verticalMovement: 'updown',
                verticalSpeed: 2,
                verticalRange: 300
            }
        };
        
        // Load saved settings if they exist
        this.loadSavedSettings();
        
        this.setupCanvas();
        this.setupEventListeners();
        
        // Update UI with loaded settings
        this.updateUIFromSettings();
        
        this.audioStream = null;  // Store the audio stream

        // Just log once at startup
        console.log('AudioVisualizer initialized with settings:', {
            pattern: this.settings.patternMode,
            lineCount: this.settings.lineCount,
            sensitivity: this.settings.sensitivity
        });

        this.lastPatternMode = null;  // Add this line to track pattern changes
    }
    
    setupCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    setupEventListeners() {
        // Audio start
        document.getElementById('startAudio').addEventListener('click', () => {
            this.verifySettings();  // Log settings when audio starts
            this.startAudio();
        });
        
        // Fullscreen
        document.getElementById('fullscreenBtn').addEventListener('click', () => this.toggleFullscreen());
        
        // Settings controls
        document.getElementById('colorPicker').addEventListener('input', (e) => {
            const oldValue = this.settings.color;
            this.settings.color = e.target.value;
            this.logSettingChange('color', oldValue, this.settings.color);
            this.saveSettings();
        });
        
        document.getElementById('sensitivity').addEventListener('input', (e) => {
            const oldValue = this.settings.sensitivity;
            this.settings.sensitivity = parseInt(e.target.value);
            this.logSettingChange('sensitivity', oldValue, this.settings.sensitivity);
            this.updateVisualizationSettings();
            this.saveSettings();
        });
        
        document.getElementById('lineCount').addEventListener('input', (e) => {
            const oldValue = this.settings.lineCount;
            this.settings.lineCount = parseInt(e.target.value);
            this.logSettingChange('lineCount', oldValue, this.settings.lineCount);
            this.updateVisualizationSettings();
            this.saveSettings();
        });
        
        document.getElementById('toggleSettings').addEventListener('click', () => {
            document.getElementById('settings').classList.toggle('hidden');
        });
        
        document.getElementById('glowEffect').addEventListener('change', (e) => {
            const oldValue = this.settings.glowEnabled;
            this.settings.glowEnabled = e.target.checked;
            this.logSettingChange('glowEnabled', oldValue, this.settings.glowEnabled);
            this.saveSettings();
        });
        
        document.getElementById('particlesEffect').addEventListener('change', (e) => {
            this.settings.particlesEnabled = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('particleSize').addEventListener('input', (e) => {
            this.settings.particleSize = parseInt(e.target.value);
            this.saveSettings();
        });
        
        document.getElementById('wavesEffect').addEventListener('change', (e) => {
            this.settings.wavesEnabled = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('frequencyBars').addEventListener('change', (e) => {
            this.settings.frequencyBarsEnabled = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('lineThickness').addEventListener('input', (e) => {
            const oldValue = this.settings.lineThickness;
            this.settings.lineThickness = parseInt(e.target.value);
            this.logSettingChange('lineThickness', oldValue, this.settings.lineThickness);
            this.updateVisualizationSettings();
            this.saveSettings();
        });
        
        document.getElementById('loadPreset').addEventListener('click', () => {
            const presetName = document.getElementById('presetSelect').value;
            this.loadPreset(presetName);
        });
        
        document.getElementById('savePreset').addEventListener('click', () => {
            const name = document.getElementById('newPresetName').value.trim();
            if (name) {
                this.saveCurrentAsPreset(name);
                // Add new preset to select options
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                document.getElementById('presetSelect').appendChild(option);
                document.getElementById('newPresetName').value = '';
                this.saveSettings();
            }
        });
        
        document.getElementById('patternMode').addEventListener('change', (e) => {
            const oldValue = this.settings.patternMode;
            this.settings.patternMode = e.target.value;
            // Log only once when pattern actually changes
            console.log(`Pattern changed: ${oldValue} → ${this.settings.patternMode}`);
            this.saveSettings();
        });
        
        document.getElementById('horizontalLineCount').addEventListener('input', (e) => {
            const oldValue = this.settings.horizontalLineCount;
            this.settings.horizontalLineCount = parseInt(e.target.value);
            this.logSettingChange('horizontalLineCount', oldValue, this.settings.horizontalLineCount);
            this.saveSettings();
        });
        
        document.getElementById('horizontalLineSpacing').addEventListener('input', (e) => {
            const oldValue = this.settings.horizontalLineSpacing;
            this.settings.horizontalLineSpacing = parseInt(e.target.value);
            this.logSettingChange('horizontalLineSpacing', oldValue, this.settings.horizontalLineSpacing);
            this.saveSettings();
        });
        
        document.getElementById('waveAmplitude').addEventListener('input', (e) => {
            const oldValue = this.settings.waveAmplitude;
            this.settings.waveAmplitude = parseInt(e.target.value);
            this.logSettingChange('waveAmplitude', oldValue, this.settings.waveAmplitude);
            this.saveSettings();
        });
        
        document.getElementById('waveSpeed').addEventListener('input', (e) => {
            const oldValue = this.settings.waveSpeed;
            this.settings.waveSpeed = parseFloat(e.target.value);
            this.logSettingChange('waveSpeed', oldValue, this.settings.waveSpeed);
            this.saveSettings();
        });
        
        document.getElementById('colorMode').addEventListener('change', (e) => {
            this.settings.colorMode = e.target.value;
            const cycleControls = document.getElementById('cycleControls');
            if (this.settings.colorMode === 'cycle') {
                cycleControls.classList.add('visible');
                // Initialize hue from current color
                const color = this.settings.color;
                if (color.startsWith('#')) {
                    // Convert hex to HSL and set initial hue
                    const r = parseInt(color.slice(1, 3), 16) / 255;
                    const g = parseInt(color.slice(3, 5), 16) / 255;
                    const b = parseInt(color.slice(5, 7), 16) / 255;
                    const max = Math.max(r, g, b);
                    const min = Math.min(r, g, b);
                    const d = max - min;
                    let h;
                    if (d === 0) h = 0;
                    else if (max === r) h = ((g - b) / d) % 6;
                    else if (max === g) h = (b - r) / d + 2;
                    else if (max === b) h = (r - g) / d + 4;
                    this.settings.colorHue = Math.round(h * 60 + 360) % 360;
                }
            } else {
                cycleControls.classList.remove('visible');
            }
        });
        
        document.getElementById('colorCycleSpeed').addEventListener('input', (e) => {
            this.settings.colorCycleSpeed = parseFloat(e.target.value);
            this.saveSettings();
        });
        
        document.getElementById('colorSaturation').addEventListener('input', (e) => {
            this.settings.colorSaturation = parseInt(e.target.value);
            this.saveSettings();
        });
        
        document.getElementById('colorLightness').addEventListener('input', (e) => {
            this.settings.colorLightness = parseInt(e.target.value);
            this.saveSettings();
        });
        
        document.getElementById('verticalMovement').addEventListener('change', (e) => {
            this.settings.verticalMovement = e.target.value;
            this.saveSettings();
        });
        
        document.getElementById('verticalSpeed').addEventListener('input', (e) => {
            this.settings.verticalSpeed = parseFloat(e.target.value);
            this.saveSettings();
        });
        
        document.getElementById('verticalRange').addEventListener('input', (e) => {
            this.settings.verticalRange = parseInt(e.target.value);
            this.saveSettings();
        });

        document.getElementById('glowIntensity').addEventListener('input', (e) => {
            const oldValue = this.settings.glowIntensity;
            this.settings.glowIntensity = parseInt(e.target.value);
            this.logSettingChange('glowIntensity', oldValue, this.settings.glowIntensity);
            this.saveSettings();
        });

        document.getElementById('randomizeBtn').addEventListener('click', () => {
            this.randomizeSettings();
        });

        document.getElementById('bassFrequency').addEventListener('input', (e) => {
            const oldValue = this.settings.bassFrequency;
            this.settings.bassFrequency = parseInt(e.target.value);
            this.logSettingChange('bassFrequency', oldValue, this.settings.bassFrequency);
            if (this.audioContext) {
                // Recreate audio context to apply new bass filter settings
                this.setupAudioContext(this.audioStream);
            }
            this.saveSettings();
        });
        
        document.getElementById('bassQuality').addEventListener('input', (e) => {
            const oldValue = this.settings.bassQuality;
            this.settings.bassQuality = parseFloat(e.target.value);
            this.logSettingChange('bassQuality', oldValue, this.settings.bassQuality);
            if (this.audioContext) {
                // Recreate audio context to apply new bass filter settings
                this.setupAudioContext(this.audioStream);
            }
            this.saveSettings();
        });
    }
    
    async startAudio() {
        try {
            // Check if we already have a stream
            if (this.audioStream) {
                this.setupAudioContext(this.audioStream);
                return;
            }

            // Check if we have permission
            const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
            
            if (permissionStatus.state === 'granted') {
                // We have permission, get the stream
                this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.setupAudioContext(this.audioStream);
            } else if (permissionStatus.state === 'prompt') {
                // Need to request permission
                this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.setupAudioContext(this.audioStream);
            } else {
                // Permission denied
                console.error('Microphone access denied');
                alert('This app requires microphone access to work.');
            }
        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert('Error accessing microphone. Please ensure you have a microphone connected and have granted permission to use it.');
        }
    }
    
    setupAudioContext(stream) {
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = this.audioContext.createMediaStreamSource(stream);
        
        // Create a low-pass filter for bass frequencies
        const bassFilter = this.audioContext.createBiquadFilter();
        bassFilter.type = 'lowpass';
        bassFilter.frequency.value = this.settings.bassFrequency;
        bassFilter.Q.value = this.settings.bassQuality;
        
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;  // Keep high resolution
        this.analyser.smoothingTimeConstant = 0.5;  // Reduce smoothing for faster response
        
        // Connect the audio nodes
        source.connect(bassFilter);
        bassFilter.connect(this.analyser);
        
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.isPlaying = true;
        this.animate();
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
    
    drawLines(beat) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Update critical parameters including glow
        this.ctx.strokeStyle = this.settings.color;
        this.updateVisualizationSettings();  // This will handle glow properly
        
        this.ctx.lineWidth = this.settings.lineThickness;
        
        for (let i = 0; i < this.settings.lineCount; i++) {
            const angle = (i / this.settings.lineCount) * Math.PI * 2;
            const intensity = this.dataArray[i * 2] / 255;
            
            // Use sensitivity and beat settings
            let length = intensity * (this.canvas.height / 2) * (this.settings.sensitivity / 50);
            if (beat) {
                length *= this.settings.beatIntensity;
            }
            
            const endX = centerX + Math.cos(angle) * length;
            const endY = centerY + Math.sin(angle) * length;
            
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
        }
    }
    
    animate = () => {
        if (!this.isPlaying) return;
        
        // Get audio data
        this.analyser.getByteFrequencyData(this.dataArray);
        const beat = this.detectBeat(this.dataArray);
        
        // Update color if needed
        if (this.settings.colorMode === 'cycle') {
            this.updateColor();
        }
        
        // Clear canvas with fade effect
        const fadeAlpha = beat ? 0.2 : 0.1;
        this.ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw based on pattern mode
        if (this.settings.patternMode === 'horizontal') {
            this.drawHorizontalLines(beat);
        } else {
            this.drawLines(beat);
        }
        
        // Draw additional effects
        if (this.settings.wavesEnabled) this.updateWaves(beat);
        if (this.settings.particlesEnabled) this.updateParticles(beat);
        if (this.settings.frequencyBarsEnabled) this.drawFrequencyBars();
        
        requestAnimationFrame(this.animate);
    }

    // Improve the beat detection method
    detectBeat(data) {
        // Focus on sub-bass and bass frequencies (20Hz - 150Hz)
        // With fftSize of 2048, each bin represents ~21.5Hz
        // So we'll look at bins 1-7 for sub-bass (20-150Hz)
        const subBassEnd = Math.floor(7 * (this.analyser.fftSize / 2048));
        
        // Calculate sub-bass energy
        let subBassSum = 0;
        for (let i = 1; i < subBassEnd; i++) {
            subBassSum += data[i];
        }
        
        const instant = subBassSum / subBassEnd;
        const energy = instant / 255;  // Normalize to 0-1
        
        this.beatDetectionData.energy.previous = this.beatDetectionData.energy.current;
        this.beatDetectionData.energy.current = energy;
        
        const delta = energy - this.beatDetectionData.energy.previous;
        
        // Dynamic threshold based on recent energy levels
        if (!this.beatDetectionData.energyHistory) {
            this.beatDetectionData.energyHistory = new Array(8).fill(0);
        }
        
        // Update energy history
        this.beatDetectionData.energyHistory.push(energy);
        this.beatDetectionData.energyHistory.shift();
        
        // Calculate dynamic threshold
        const avgEnergy = this.beatDetectionData.energyHistory.reduce((a, b) => a + b) / 8;
        const dynamicThreshold = avgEnergy * 1.2;  // 20% above average
        
        // Beat detection with dynamic threshold
        if (energy > dynamicThreshold && delta > 0.02) {  // Require significant increase
            if (Date.now() - this.beatDetectionData.beatTime > 100) {  // Minimum 100ms between beats
                this.beatDetectionData.beatTime = Date.now();
                this.beatDetectionData.beatCutoff = energy * 1.2;
                return true;
            }
        }
        
        this.beatDetectionData.beatCutoff *= this.beatDetectionData.decay;
        this.beatDetectionData.beatCutoff = Math.max(this.beatDetectionData.threshold, this.beatDetectionData.beatCutoff);
        
        return false;
    }

    // Add new method for particle system
    updateParticles(beat) {
        if (!this.settings.particlesEnabled) return;
        
        // Create new particles on beats
        if (beat) {
            for (let i = 0; i < 5; i++) {
                this.particles.push({
                    x: this.canvas.width / 2,
                    y: this.canvas.height / 2,
                    angle: Math.random() * Math.PI * 2,
                    speed: 2 + Math.random() * 4,
                    size: this.settings.particleSize,
                    life: 1.0
                });
            }
        }

        // Update and draw particles
        this.particles = this.particles.filter(particle => {
            particle.x += Math.cos(particle.angle) * particle.speed;
            particle.y += Math.sin(particle.angle) * particle.speed;
            particle.life -= 0.02;

            if (particle.life > 0) {
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(${parseInt(this.settings.color.substr(1,2), 16)}, 
                                         ${parseInt(this.settings.color.substr(3,2), 16)}, 
                                         ${parseInt(this.settings.color.substr(5,2), 16)}, 
                                         ${particle.life})`;
                this.ctx.fill();
                return true;
            }
            return false;
        });
    }

    // Add new method for circular waves
    updateWaves(beat) {
        if (!this.settings.wavesEnabled) return;
        
        if (beat) {
            this.waves.push({
                radius: 0,
                opacity: 1.0
            });
        }

        this.waves = this.waves.filter(wave => {
            wave.radius += 5;
            wave.opacity -= 0.02;

            if (wave.opacity > 0) {
                this.ctx.beginPath();
                this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, wave.radius, 0, Math.PI * 2);
                this.ctx.lineWidth = this.settings.lineThickness;
                this.ctx.strokeStyle = `rgba(${parseInt(this.settings.color.substr(1,2), 16)}, 
                                            ${parseInt(this.settings.color.substr(3,2), 16)}, 
                                            ${parseInt(this.settings.color.substr(5,2), 16)}, 
                                            ${wave.opacity})`;
                this.ctx.stroke();
                return true;
            }
            return false;
        });
    }

    // Add new method for frequency bars
    drawFrequencyBars() {
        if (!this.settings.frequencyBarsEnabled) return;
        
        const barWidth = this.canvas.width / 64;
        const barSpacing = 2;
        const maxHeight = this.canvas.height / 3;

        for (let i = 0; i < 64; i++) {
            const height = (this.dataArray[i] / 255) * maxHeight;
            const x = i * (barWidth + barSpacing);
            const y = this.canvas.height - height;

            this.ctx.fillStyle = this.settings.color;
            this.ctx.fillRect(x, y, barWidth, height);
        }
    }

    // Add new method for horizontal line pattern
    drawHorizontalLines(beat) {
        const centerY = this.canvas.height / 2;
        this.ctx.strokeStyle = this.settings.color;
        this.ctx.lineWidth = this.settings.lineThickness;
        
        // Apply glow if enabled
        if (this.settings.glowEnabled) {
            this.ctx.shadowBlur = this.settings.glowIntensity;
            this.ctx.shadowColor = this.settings.color;
        } else {
            this.ctx.shadowBlur = 0;
        }
        
        // Time-based offset for wave movement
        const timeOffset = performance.now() / 1000;
        const waveOffset = timeOffset * this.settings.waveSpeed;
        
        // Calculate vertical offset for up/down movement
        let verticalOffset = 0;
        if (this.settings.verticalMovement === 'updown') {
            verticalOffset = Math.sin(timeOffset * this.settings.verticalSpeed) * this.settings.verticalRange;
        }
        
        // Draw each horizontal line
        for (let i = 0; i < this.settings.horizontalLineCount; i++) {
            const baseY = centerY + 
                         (i - (this.settings.horizontalLineCount - 1) / 2) * this.settings.horizontalLineSpacing + 
                         verticalOffset;
            
            this.ctx.beginPath();
            
            // Draw the wavy line
            for (let x = 0; x < this.canvas.width; x += 2) {
                const freqIndex = Math.floor((x / this.canvas.width) * 32);
                const frequency = this.dataArray[freqIndex] / 255.0;
                
                // Apply beat effect to wave amplitude
                let currentAmplitude = this.settings.waveAmplitude;
                if (beat) {
                    currentAmplitude *= this.settings.beatIntensity;
                }
                
                const wave = Math.sin(x / 50 + waveOffset + i * Math.PI) * currentAmplitude;
                const y = baseY + wave * frequency * (this.settings.sensitivity / 50);
                
                if (x === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            
            this.ctx.stroke();
        }
    }

    // Add new methods for preset handling
    loadPreset(presetName) {
        const preset = this.presets[presetName];
        if (!preset) return;
        
        // Update settings
        Object.assign(this.settings, preset);
        
        // Update UI
        this.updateUIFromSettings();
        
        // Save the current settings
        this.saveSettings();
    }

    saveCurrentAsPreset(presetName) {
        this.presets[presetName] = {...this.settings};
        this.saveSettings();
    }

    // Add new method for color cycling
    updateColor() {
        if (this.settings.colorMode === 'cycle') {
            this.settings.colorHue = (this.settings.colorHue + this.settings.colorCycleSpeed * 0.1) % 360;
            this.settings.color = `hsl(${this.settings.colorHue}, ${this.settings.colorSaturation}%, ${this.settings.colorLightness}%)`;
            // Update the color picker to reflect the current color
            document.getElementById('colorPicker').value = this.hslToHex(
                this.settings.colorHue,
                this.settings.colorSaturation,
                this.settings.colorLightness
            );
        }
    }

    // Add helper method to convert HSL to Hex
    hslToHex(h, s, l) {
        l /= 100;
        const a = s * Math.min(l, 1 - l) / 100;
        const f = n => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    }

    // Add new methods for settings persistence
    saveSettings() {
        localStorage.setItem('audioVisualizerSettings', JSON.stringify(this.settings));
        localStorage.setItem('audioVisualizerPresets', JSON.stringify(this.presets));
    }

    loadSavedSettings() {
        const savedSettings = localStorage.getItem('audioVisualizerSettings');
        const savedPresets = localStorage.getItem('audioVisualizerPresets');
        
        if (savedSettings) {
            this.settings = {...this.settings, ...JSON.parse(savedSettings)};
        }
        
        if (savedPresets) {
            const loadedPresets = JSON.parse(savedPresets);
            // Merge with default presets, allowing custom presets to override defaults
            this.presets = {...this.presets, ...loadedPresets};
        }
    }

    updateUIFromSettings() {
        // Update all UI elements to match current settings
        document.getElementById('colorPicker').value = this.settings.color;
        document.getElementById('sensitivity').value = this.settings.sensitivity;
        document.getElementById('lineCount').value = this.settings.lineCount;
        document.getElementById('beatSensitivity').value = this.settings.beatSensitivity;
        document.getElementById('glowEffect').checked = this.settings.glowEnabled;
        document.getElementById('particlesEffect').checked = this.settings.particlesEnabled;
        document.getElementById('particleSize').value = this.settings.particleSize;
        document.getElementById('wavesEffect').checked = this.settings.wavesEnabled;
        document.getElementById('frequencyBars').checked = this.settings.frequencyBarsEnabled;
        document.getElementById('lineThickness').value = this.settings.lineThickness;
        document.getElementById('patternMode').value = this.settings.patternMode;
        document.getElementById('colorMode').value = this.settings.colorMode;
        document.getElementById('colorCycleSpeed').value = this.settings.colorCycleSpeed;
        document.getElementById('colorSaturation').value = this.settings.colorSaturation;
        document.getElementById('colorLightness').value = this.settings.colorLightness;
        document.getElementById('horizontalLineCount').value = this.settings.horizontalLineCount;
        document.getElementById('horizontalLineSpacing').value = this.settings.horizontalLineSpacing;
        document.getElementById('waveAmplitude').value = this.settings.waveAmplitude;
        document.getElementById('waveSpeed').value = this.settings.waveSpeed;
        document.getElementById('verticalMovement').value = this.settings.verticalMovement;
        document.getElementById('verticalSpeed').value = this.settings.verticalSpeed;
        document.getElementById('verticalRange').value = this.settings.verticalRange;
        document.getElementById('glowIntensity').value = this.settings.glowIntensity;
        document.getElementById('bassFrequency').value = this.settings.bassFrequency;
        document.getElementById('bassQuality').value = this.settings.bassQuality;

        // Update visibility of control sections
        if (this.settings.patternMode === 'horizontal') {
            document.getElementById('horizontalControls').classList.add('visible');
        }
        if (this.settings.colorMode === 'cycle') {
            document.getElementById('cycleControls').classList.add('visible');
        }

        // Update preset select with custom presets
        const presetSelect = document.getElementById('presetSelect');
        // Clear existing options first
        while (presetSelect.options.length > 3) { // Keep default, minimal, maximal
            presetSelect.remove(3);
        }
        // Add custom presets
        Object.keys(this.presets).forEach(presetName => {
            if (!['default', 'minimal', 'maximal'].includes(presetName)) {
                const option = document.createElement('option');
                option.value = presetName;
                option.textContent = presetName;
                presetSelect.appendChild(option);
            }
        });

        // Force update visualization settings to apply glow state
        this.updateVisualizationSettings();
    }

    // Add a new method to track settings changes
    logSettingChange(settingName, oldValue, newValue) {
        console.log(`Setting changed - ${settingName}:`, {
            from: oldValue,
            to: newValue
        });
    }

    // Add this method to the class
    verifySettings() {
        console.log('Current Settings:', {
            pattern: this.settings.patternMode,
            color: this.settings.color,
            lineCount: this.settings.lineCount,
            horizontalLineCount: this.settings.horizontalLineCount,
            glowEnabled: this.settings.glowEnabled,
            glowIntensity: this.settings.glowIntensity
        });
    }

    // Add this method to the class
    updateVisualizationSettings() {
        if (this.ctx) {
            this.ctx.lineWidth = this.settings.lineThickness;
            // Explicitly set shadow properties based on glow state
            if (this.settings.glowEnabled) {
                this.ctx.shadowBlur = this.settings.glowIntensity;
                this.ctx.shadowColor = this.settings.color;
            } else {
                this.ctx.shadowBlur = 0;
                this.ctx.shadowColor = 'transparent';
            }
        }
        // Only log significant changes
    }

    // Add this method to the AudioVisualizer class
    randomizeSettings() {
        // Helper function to get random number in range
        const random = (min, max, decimal = false) => {
            const val = Math.random() * (max - min) + min;
            return decimal ? val : Math.floor(val);
        };

        // Helper function to random bool with probability
        const randomBool = (probability = 0.5) => Math.random() < probability;

        // Randomize settings
        this.settings = {
            ...this.settings,
            // Pattern
            patternMode: randomBool() ? 'radial' : 'horizontal',
            
            // Colors
            colorMode: randomBool() ? 'static' : 'cycle',
            colorHue: random(0, 360),
            colorSaturation: random(70, 100),
            colorLightness: random(40, 60),
            colorCycleSpeed: random(0.5, 5, true),
            
            // Lines
            lineCount: random(3, 16),
            lineThickness: random(1, 5),
            sensitivity: random(30, 70),
            
            // Effects
            glowEnabled: randomBool(0.7),
            glowIntensity: random(10, 40),
            particlesEnabled: randomBool(0.6),
            particleSize: random(2, 6),
            wavesEnabled: randomBool(0.6),
            frequencyBarsEnabled: randomBool(0.3),
            
            // Beat Detection
            beatSensitivity: random(0.2, 0.4, true),
            beatIntensity: random(1.2, 2.5, true),
            beatDecay: random(0.95, 0.99, true),
            
            // Horizontal specific
            horizontalLineCount: random(2, 8),
            horizontalLineSpacing: random(50, 150),
            waveAmplitude: random(30, 100),
            waveSpeed: random(1, 4, true),
            verticalMovement: randomBool(0.7) ? 'updown' : 'none',
            verticalSpeed: random(0.5, 3, true),
            verticalRange: random(100, 300),
            
            // Add bass filter settings
            bassFrequency: random(100, 200),  // Random frequency between 100 and 200 Hz
            bassQuality: random(0.5, 2),      // Random Q value between 0.5 and 2
        };

        // Set color based on mode
        if (this.settings.colorMode === 'static') {
            this.settings.color = `hsl(${this.settings.colorHue}, ${this.settings.colorSaturation}%, ${this.settings.colorLightness}%)`;
        }

        // Update UI to reflect new settings
        this.updateUIFromSettings();
        this.saveSettings();
        
        console.log('Settings randomized!');
    }
}

// Change the initialization at the bottom of the file from:
window.addEventListener('load', () => {
    new AudioVisualizer();
});

// To:
window.addEventListener('DOMContentLoaded', () => {
    // First verify all elements exist
    const requiredElements = [
        'canvas',
        'startAudio',
        'fullscreenBtn',
        'colorPicker',
        'sensitivity',
        'lineCount',
        'toggleSettings',
        'glowEffect',
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

    // If all elements exist, initialize the visualizer
    new AudioVisualizer();
}); 