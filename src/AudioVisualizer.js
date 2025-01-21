import { ColorUtils } from './utils/ColorUtils';

export class AudioVisualizer {
    constructor() {
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
            
            // Add bass filter settings
            bassFrequency: 150,
            bassQuality: 1,
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
            }
        };
        
        // Load saved settings if they exist
        this.loadSavedSettings();
        
        this.setupCanvas();
        this.setupEventListeners();
        
        // Update UI with loaded settings
        this.updateUIFromSettings();
        
        this.audioStream = null;  // Store the audio stream
        this.lastPatternMode = null;  // Track pattern changes
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
        document.getElementById('startAudio')?.addEventListener('click', () => {
            this.startAudio();
        });
        
        // Fullscreen
        document.getElementById('fullscreenBtn')?.addEventListener('click', () => this.toggleFullscreen());
        
        // Settings controls
        document.getElementById('colorPicker')?.addEventListener('input', (e) => {
            this.settings.color = e.target.value;
            this.saveSettings();
        });
        
        document.getElementById('sensitivity')?.addEventListener('input', (e) => {
            this.settings.sensitivity = parseInt(e.target.value);
            this.saveSettings();
        });
        
        document.getElementById('lineCount')?.addEventListener('input', (e) => {
            this.settings.lineCount = parseInt(e.target.value);
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
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.5;
        
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
        
        this.ctx.strokeStyle = this.settings.color;
        this.updateVisualizationSettings();
        
        this.ctx.lineWidth = this.settings.lineThickness;
        
        for (let i = 0; i < this.settings.lineCount; i++) {
            const angle = (i / this.settings.lineCount) * Math.PI * 2;
            const intensity = this.dataArray[i * 2] / 255;
            
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

    drawHorizontalLines(beat) {
        const centerY = this.canvas.height / 2;
        this.ctx.strokeStyle = this.settings.color;
        this.ctx.lineWidth = this.settings.lineThickness;
        
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
                this.ctx.fillStyle = ColorUtils.colorWithOpacity(this.settings.color, particle.life);
                this.ctx.fill();
                return true;
            }
            return false;
        });
    }

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
                this.ctx.strokeStyle = ColorUtils.colorWithOpacity(this.settings.color, wave.opacity);
                this.ctx.stroke();
                return true;
            }
            return false;
        });
    }

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

    updateColor() {
        if (this.settings.colorMode === 'cycle') {
            this.settings.colorHue = (this.settings.colorHue + this.settings.colorCycleSpeed * 0.1) % 360;
            this.settings.color = ColorUtils.hslToHex(
                this.settings.colorHue,
                this.settings.colorSaturation,
                this.settings.colorLightness
            );
            // Update the color picker to reflect the current color
            const colorPicker = document.getElementById('colorPicker');
            if (colorPicker) {
                colorPicker.value = this.settings.color;
            }
        }
    }

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
        const elements = {
            'colorPicker': this.settings.color,
            'sensitivity': this.settings.sensitivity,
            'lineCount': this.settings.lineCount,
            'beatSensitivity': this.settings.beatSensitivity,
            'particlesEffect': this.settings.particlesEnabled,
            'particleSize': this.settings.particleSize,
            'wavesEffect': this.settings.wavesEnabled,
            'frequencyBars': this.settings.frequencyBarsEnabled,
            'lineThickness': this.settings.lineThickness,
            'patternMode': this.settings.patternMode,
            'colorMode': this.settings.colorMode,
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
            'bassQuality': this.settings.bassQuality
        };

        for (const [id, value] of Object.entries(elements)) {
            const element = document.getElementById(id);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = value;
                } else {
                    element.value = value;
                }
            }
        }

        // Update visibility of control sections
        const horizontalControls = document.getElementById('horizontalControls');
        if (horizontalControls) {
            if (this.settings.patternMode === 'horizontal') {
                horizontalControls.classList.add('visible');
            } else {
                horizontalControls.classList.remove('visible');
            }
        }

        const cycleControls = document.getElementById('cycleControls');
        if (cycleControls) {
            if (this.settings.colorMode === 'cycle') {
                cycleControls.classList.add('visible');
            } else {
                cycleControls.classList.remove('visible');
            }
        }

        // Update preset select with custom presets
        const presetSelect = document.getElementById('presetSelect');
        if (presetSelect) {
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
        }
    }

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

    updateVisualizationSettings() {
        if (this.ctx) {
            this.ctx.lineWidth = this.settings.lineThickness;
            // Always ensure glow is off
            this.ctx.shadowBlur = 0;
            this.ctx.shadowColor = 'transparent';
        }
    }
} 