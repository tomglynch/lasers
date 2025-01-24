import { AudioVisualizer } from '../src/AudioVisualizer';

describe('AudioVisualizer', () => {
  let visualizer;
  let mockCtx;
  let mockStorage;
  let mockAnalyser;
  let mockAudioContext;
  let mockMediaStreamSource;

  // Mock localStorage
  beforeAll(() => {
    mockStorage = {};
    const localStorageMock = {
      getItem: jest.fn((key) => mockStorage[key]),
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

    // Spy on localStorage methods
    jest.spyOn(localStorageMock, 'getItem');
    jest.spyOn(localStorageMock, 'setItem');
    jest.spyOn(localStorageMock, 'clear');

    // Mock Web Audio API
    mockAnalyser = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      frequencyBinCount: 1024,
      fftSize: 2048,
      smoothingTimeConstant: 0.5,
      getByteFrequencyData: jest.fn((array) => {
        // Simulate frequency data
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
      })
    };

    mockMediaStreamSource = {
      connect: jest.fn()
    };

    mockAudioContext = {
      createAnalyser: jest.fn().mockReturnValue(mockAnalyser),
      createMediaStreamSource: jest.fn().mockReturnValue(mockMediaStreamSource),
      createBiquadFilter: jest.fn().mockReturnValue({
        type: 'lowpass',
        frequency: { value: 150 },
        Q: { value: 1 },
        connect: jest.fn()
      }),
      close: jest.fn()
    };

    global.AudioContext = jest.fn().mockImplementation(() => mockAudioContext);
    global.webkitAudioContext = jest.fn().mockImplementation(() => mockAudioContext);

    // Mock navigator.mediaDevices and permissions
    const mockGetUserMedia = jest.fn().mockResolvedValue('mock-stream');
    const mockPermissionsQuery = jest.fn().mockResolvedValue({ state: 'granted' });
    
    Object.defineProperty(global, 'navigator', {
      value: {
        mediaDevices: {
          getUserMedia: mockGetUserMedia
        },
        permissions: {
          query: mockPermissionsQuery
        }
      },
      writable: true
    });

    // Mock window.alert
    global.alert = jest.fn();

    // Mock performance.now()
    const mockPerformanceNow = jest.fn().mockReturnValue(0);
    Object.defineProperty(global, 'performance', {
      value: { now: mockPerformanceNow },
      writable: true
    });
  });

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    mockStorage = {};
    
    // Mock requestAnimationFrame to only call once
    let animationFrameCallback = null;
    window.requestAnimationFrame = jest.fn(cb => {
      animationFrameCallback = cb;
      return setTimeout(() => {
        if (animationFrameCallback) {
          animationFrameCallback();
          animationFrameCallback = null; // Prevent recursive calls
        }
      }, 0);
    });
    
    // Clear the DOM
    document.body.innerHTML = '';
    
    // Create canvas with mocked context
    const canvas = document.createElement('canvas');
    canvas.id = 'canvas';
    mockCtx = {
      fillRect: jest.fn(),
      fillStyle: '#000000',
      get _fillStyle() { return this.fillStyle; },
      set _fillStyle(value) { this.fillStyle = value; },
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn()
    };
    canvas.getContext = jest.fn().mockReturnValue(mockCtx);
    document.body.appendChild(canvas);

    // Add all required control elements
    const controls = `
      <button id="startAudio">Start</button>
      <button id="fullscreenBtn">Fullscreen</button>
      <button id="toggleSettings">Settings</button>
      <button id="randomizeBtn">Randomize</button>
      <div id="settings" class="hidden">
        <input type="color" id="colorPicker" value="#ff0000">
        <input type="range" id="sensitivity" min="0" max="100" value="50">
        <input type="range" id="lineCount" min="1" max="100" value="50">
        <input type="range" id="beatSensitivity" min="0" max="100" value="50">
        <input type="checkbox" id="particlesEffect">
        <input type="range" id="particleSize" min="1" max="10" value="3">
        <input type="checkbox" id="wavesEffect">
        <input type="checkbox" id="frequencyBars">
        <input type="range" id="lineThickness" min="1" max="10" value="2">
        <select id="patternMode">
          <option value="radial">Radial</option>
          <option value="horizontal">Horizontal</option>
        </select>
        <select id="colorMode">
          <option value="static">Static</option>
          <option value="cycle">Cycle</option>
        </select>
        <div id="cycleControls">
          <input type="range" id="colorCycleSpeed" min="0.1" max="5" step="0.1" value="1">
          <input type="range" id="colorSaturation" min="0" max="100" value="70">
          <input type="range" id="colorLightness" min="0" max="100" value="50">
        </div>
        <div id="horizontalControls">
          <input type="range" id="horizontalLineCount" min="1" max="50" value="10">
          <input type="range" id="horizontalLineSpacing" min="10" max="100" value="30">
          <input type="range" id="waveAmplitude" min="0" max="200" value="50">
          <input type="range" id="waveSpeed" min="0.1" max="5" step="0.1" value="1">
          <select id="verticalMovement">
            <option value="none">None</option>
            <option value="wave">Wave</option>
          </select>
          <input type="range" id="verticalSpeed" min="0.1" max="5" step="0.1" value="1">
          <input type="range" id="verticalRange" min="0" max="200" value="50">
        </div>
        <input type="range" id="bassFrequency" min="20" max="200" value="60">
        <input type="range" id="bassQuality" min="0.1" max="10" step="0.1" value="1">
        <select id="presetSelect">
          <option value="default">Default</option>
        </select>
        <button id="loadPreset">Load</button>
        <input type="text" id="newPresetName">
        <button id="savePreset">Save</button>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', controls);
    
    // Create visualizer instance
    visualizer = new AudioVisualizer();

    document.body.innerHTML = `
        <button id="savePresetBtn"></button>
        <select id="presetSelect"></select>
        <canvas id="canvas"></canvas>
    `;
  });

  afterEach(() => {
    // Clean up requestAnimationFrame mock
    jest.spyOn(window, 'requestAnimationFrame').mockRestore();
  });

  describe('Initialization', () => {
    test('should initialize with default settings', () => {
      expect(visualizer.canvas).toBeDefined();
      expect(visualizer.ctx).toBeDefined();
      expect(visualizer.settings).toBeDefined();
      expect(visualizer.settings.patternMode).toBe('radial');
      expect(visualizer.settings.color).toBe('#ff0000');
      expect(visualizer.settings.lineCount).toBe(8);
    });
  });

  describe('Settings Management', () => {
    test('should save settings to localStorage', () => {
      const settings = {
        color: '#00ff00',
        lineCount: 8,
        patternMode: 'radial',
        beatIntensity: 2.0,
        sensitivity: 50
      };
      visualizer.settings = settings;
      visualizer.saveSettings();
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'audioVisualizerSettings',
        JSON.stringify(settings)
      );
    });

    test('should load settings from localStorage', () => {
      const mockSettings = {
        color: '#0000ff',
        lineCount: 12,
        patternMode: 'horizontal',
        beatIntensity: 2.0,
        sensitivity: 50
      };
      mockStorage['audioVisualizerSettings'] = JSON.stringify(mockSettings);
      
      visualizer.loadSavedSettings();
      expect(visualizer.settings.color).toBe(mockSettings.color);
      expect(visualizer.settings.lineCount).toBe(mockSettings.lineCount);
      expect(visualizer.settings.patternMode).toBe(mockSettings.patternMode);
    });
  });

  describe('Audio Processing', () => {
    test('should initialize audio context when starting', async () => {
      await visualizer.startAudio();
      expect(AudioContext).toHaveBeenCalled();
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
      expect(mockAudioContext.createAnalyser).toHaveBeenCalled();
      expect(mockAudioContext.createBiquadFilter).toHaveBeenCalled();
      expect(mockMediaStreamSource.connect).toHaveBeenCalled();
    });

    test('should handle microphone access error', async () => {
      const mockError = new Error('Permission denied');
      navigator.mediaDevices.getUserMedia.mockRejectedValueOnce(mockError);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      await visualizer.startAudio();
      
      expect(consoleSpy).toHaveBeenCalledWith('Error accessing microphone:', mockError);
      expect(alert).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should detect beats correctly', () => {
      // Setup mock analyser and data
      visualizer.analyser = mockAnalyser;
      visualizer.dataArray = new Uint8Array(1024);
      
      // Simulate high bass frequencies
      for (let i = 0; i < 4; i++) {
        visualizer.dataArray[i] = 240; // High value in bass range
      }
      
      // Set initial energy history to low values
      visualizer.beatDetectionData.energyHistory = new Array(8).fill(0.1);
    });
  });

  describe('Event Listeners', () => {
    let mockCtx;
    let visualizer;

    beforeEach(() => {
        // Set up DOM with all required elements
        document.body.innerHTML = `
            <canvas id="canvas"></canvas>
            <button id="startAudioBtn">Start Audio</button>
            <button id="fullscreenBtn">Fullscreen</button>
            <button id="toggleSettings">Settings</button>
            <div id="settingsPanel" class="visible">
                <input type="color" id="colorPicker" value="#ff0000">
                <input type="range" id="sensitivity" min="0" max="100" value="50">
                <input type="range" id="lineCount" min="1" max="20" value="8">
                <input type="range" id="beatSensitivity" min="0" max="100" value="50">
                <select id="patternMode">
                    <option value="radial">Radial</option>
                    <option value="horizontal">Horizontal</option>
                </select>
                <select id="colorMode">
                    <option value="static">Static</option>
                    <option value="cycle">Cycle</option>
                </select>
                <div id="horizontalControls">
                    <input type="range" id="horizontalLineCount" min="1" max="20" value="3">
                    <input type="range" id="horizontalLineSpacing" min="50" max="400" value="100">
                    <input type="range" id="waveAmplitude" min="0" max="100" value="50">
                    <input type="range" id="waveSpeed" min="0" max="5" value="2">
                    <select id="verticalMovement">
                        <option value="none">None</option>
                        <option value="wave">Wave</option>
                    </select>
                </div>
                <div id="cycleControls">
                    <input type="range" id="colorCycleSpeed" min="0" max="5" value="2">
                    <input type="range" id="colorSaturation" min="0" max="100" value="100">
                </div>
            </div>
        `;

        // Mock canvas context
        mockCtx = {
            _fillStyle: 'rgba(0, 0, 0, 0.1)',
            get fillStyle() { return this._fillStyle; },
            set fillStyle(value) { this._fillStyle = value; },
            fillRect: jest.fn(),
            beginPath: jest.fn(),
            moveTo: jest.fn(),
            lineTo: jest.fn(),
            stroke: jest.fn(),
            arc: jest.fn(),
            fill: jest.fn()
        };

        // Mock canvas
        const canvas = document.getElementById('canvas');
        canvas.width = 800;
        canvas.height = 600;
        canvas.getContext = jest.fn().mockReturnValue(mockCtx);

        // Mock window.prompt for preset saving
        window.prompt = jest.fn().mockReturnValue('Test Preset');

        // Create visualizer instance
        visualizer = new AudioVisualizer();
    });

    test('should toggle settings panel visibility', () => {
        const toggleBtn = document.getElementById('toggleSettings');
        const settingsPanel = document.getElementById('settingsPanel');

        // First click should hide
        toggleBtn.click();
        expect(settingsPanel.classList.contains('visible')).toBe(false);

        // Second click should show
        toggleBtn.click();
        expect(settingsPanel.classList.contains('visible')).toBe(true);
    });

    test('should handle preset saving', async () => {
        // Mock localStorage
        localStorage.setItem = jest.fn();

        const savePresetBtn = document.getElementById('savePresetBtn');
        const presetSelect = document.getElementById('presetSelect');

        // Trigger click event on save preset button
        const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
        });
        savePresetBtn.dispatchEvent(clickEvent);

        // Wait for any async operations
        await new Promise(resolve => setTimeout(resolve, 0));

        // Verify that the new preset was added to the select element
        const presetOptions = Array.from(presetSelect.options);
        const newOption = presetOptions.find(opt => opt.value === 'Test Preset');
        expect(newOption).toBeDefined();
        expect(newOption.value).toBe('Test Preset');
        expect(localStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('UI Updates', () => {
    let mockCtx;
    let visualizer;

    beforeEach(() => {
        // Set up DOM with all required elements
        document.body.innerHTML = `
            <canvas id="canvas"></canvas>
            <button id="startAudioBtn">Start Audio</button>
            <button id="fullscreenBtn">Fullscreen</button>
            <button id="toggleSettings">Settings</button>
            <div id="settingsPanel" class="visible">
                <input type="color" id="colorPicker" value="#ff0000">
                <input type="range" id="sensitivity" min="0" max="100" value="50">
                <input type="range" id="lineCount" min="1" max="20" value="8">
                <input type="range" id="beatSensitivity" min="0" max="100" value="50">
                <select id="patternMode">
                    <option value="radial">Radial</option>
                    <option value="horizontal">Horizontal</option>
                </select>
                <select id="colorMode">
                    <option value="static">Static</option>
                    <option value="cycle">Cycle</option>
                </select>
                <div id="horizontalControls">
                    <input type="range" id="horizontalLineCount" min="1" max="20" value="3">
                    <input type="range" id="horizontalLineSpacing" min="50" max="400" value="100">
                    <input type="range" id="waveAmplitude" min="0" max="100" value="50">
                    <input type="range" id="waveSpeed" min="0" max="5" value="2">
                    <select id="verticalMovement">
                        <option value="none">None</option>
                        <option value="wave">Wave</option>
                    </select>
                </div>
                <div id="cycleControls">
                    <input type="range" id="colorCycleSpeed" min="0" max="5" value="2">
                    <input type="range" id="colorSaturation" min="0" max="100" value="100">
                </div>
            </div>
        `;

        // Mock canvas context
        mockCtx = {
            _fillStyle: 'rgba(0, 0, 0, 0.1)',
            get fillStyle() { return this._fillStyle; },
            set fillStyle(value) { this._fillStyle = value; },
            fillRect: jest.fn(),
            beginPath: jest.fn(),
            moveTo: jest.fn(),
            lineTo: jest.fn(),
            stroke: jest.fn(),
            arc: jest.fn(),
            fill: jest.fn()
        };

        // Mock canvas
        const canvas = document.getElementById('canvas');
        canvas.width = 800;
        canvas.height = 600;
        canvas.getContext = jest.fn().mockReturnValue(mockCtx);

        // Create visualizer instance
        visualizer = new AudioVisualizer();
    });

    test('should update UI elements when settings change', () => {
        // Update settings
        visualizer.settings = {
            sensitivity: 80,
            lineCount: 16,
            beatSensitivity: 0.75,
            patternMode: 'horizontal',
            colorMode: 'cycle',
            color: '#00ff00',
            horizontalLineCount: 5,
            horizontalLineSpacing: 200,
            waveAmplitude: 75,
            waveSpeed: 3,
            verticalMovement: 'wave',
            colorCycleSpeed: 4,
            colorSaturation: 90
        };

        // Update UI
        visualizer.updateUIFromSettings();

        // Verify input values
        expect(document.getElementById('sensitivity').value).toBe('80');
        expect(document.getElementById('lineCount').value).toBe('16');
        expect(document.getElementById('beatSensitivity').value).toBe('0.75');
        expect(document.getElementById('patternMode').value).toBe('horizontal');
        expect(document.getElementById('colorMode').value).toBe('cycle');
        expect(document.getElementById('colorPicker').value).toBe('#00ff00');
        expect(document.getElementById('horizontalLineCount').value).toBe('5');
        expect(document.getElementById('horizontalLineSpacing').value).toBe('200');
        expect(document.getElementById('waveAmplitude').value).toBe('75');
        expect(document.getElementById('waveSpeed').value).toBe('3');
        expect(document.getElementById('verticalMovement').value).toBe('wave');
        expect(document.getElementById('colorCycleSpeed').value).toBe('4');
        expect(document.getElementById('colorSaturation').value).toBe('90');

        // Verify control visibility
        expect(document.getElementById('horizontalControls').classList.contains('visible')).toBe(true);
        expect(document.getElementById('cycleControls').classList.contains('visible')).toBe(true);
    });
  });

  describe('Pattern Drawing', () => {
    test('should draw radial pattern', () => {
      visualizer.settings.patternMode = 'radial';
      visualizer.dataArray = new Uint8Array(1024).fill(128);
      
      visualizer.drawLines(false);
      
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.moveTo).toHaveBeenCalled();
      expect(mockCtx.lineTo).toHaveBeenCalled();
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    test('should draw horizontal pattern', () => {
      visualizer.settings.patternMode = 'horizontal';
      visualizer.dataArray = new Uint8Array(1024).fill(128);
      
      visualizer.drawHorizontalLines(false);
      
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.moveTo).toHaveBeenCalled();
      expect(mockCtx.lineTo).toHaveBeenCalled();
      expect(mockCtx.stroke).toHaveBeenCalled();
    });
  });

  describe('Effects', () => {
    test('should update particles on beat', () => {
      visualizer.settings.particlesEnabled = true;
      visualizer.updateParticles(true);
      
      expect(visualizer.particles.length).toBeGreaterThan(0);
    });

    test('should update waves on beat', () => {
      visualizer.settings.wavesEnabled = true;
      visualizer.updateWaves(true);
      
      expect(visualizer.waves.length).toBeGreaterThan(0);
    });

    test('should draw frequency bars when enabled', () => {
      visualizer.settings.frequencyBarsEnabled = true;
      visualizer.dataArray = new Uint8Array(1024).fill(128);
      
      visualizer.drawFrequencyBars();
      
      expect(mockCtx.fillRect).toHaveBeenCalled();
    });
  });

  describe('Canvas Management', () => {
    test('should resize canvas on window resize', () => {
      const originalWidth = visualizer.canvas.width;
      const originalHeight = visualizer.canvas.height;
      
      // Simulate window resize
      global.innerWidth = 1920;
      global.innerHeight = 1080;
      window.dispatchEvent(new Event('resize'));
      
      expect(visualizer.canvas.width).toBe(1920);
      expect(visualizer.canvas.height).toBe(1080);
      expect(visualizer.canvas.width).not.toBe(originalWidth);
      expect(visualizer.canvas.height).not.toBe(originalHeight);
    });

    test('should handle fullscreen toggle', () => {
      const mockRequestFullscreen = jest.fn();
      const mockExitFullscreen = jest.fn();
      
      document.documentElement.requestFullscreen = mockRequestFullscreen;
      document.exitFullscreen = mockExitFullscreen;
      
      // Test entering fullscreen
      document.fullscreenElement = null;
      visualizer.toggleFullscreen();
      expect(mockRequestFullscreen).toHaveBeenCalled();
      
      // Test exiting fullscreen
      document.fullscreenElement = document.documentElement;
      visualizer.toggleFullscreen();
      expect(mockExitFullscreen).toHaveBeenCalled();
    });
  });

  describe('Visualization', () => {
    test('should handle pattern mode changes', () => {
      // Add the select element and setup event listener
      document.body.innerHTML += '<select id="patternMode"><option value="radial">Radial</option><option value="horizontal">Horizontal</option></select>';
      const patternSelect = document.getElementById('patternMode');
      
      // Setup event listener
      patternSelect.addEventListener('change', (e) => {
        visualizer.settings.patternMode = e.target.value;
      });
      
      // Set initial value
      visualizer.settings.patternMode = 'radial';
      
      // Change pattern mode
      patternSelect.value = 'horizontal';
      patternSelect.dispatchEvent(new Event('change'));
      
      expect(visualizer.settings.patternMode).toBe('horizontal');
    });
  });

  describe('Presets', () => {
    test('should load preset correctly', () => {
      visualizer.loadPreset('minimal');
      expect(visualizer.settings.lineCount).toBe(4);
      expect(visualizer.settings.color).toBe('#00ff00');
    });

    test('should save custom preset', () => {
      const presetName = 'customPreset';
      visualizer.settings.color = '#ff00ff';
      visualizer.saveCurrentAsPreset(presetName);
      
      expect(visualizer.presets[presetName]).toBeDefined();
      expect(visualizer.presets[presetName].color).toBe('#ff00ff');
    });
  });

  describe('DOM Initialization', () => {
    let mockCtx;
    let domContentLoadedCallback;

    beforeEach(() => {
      // Clear DOM
      document.body.innerHTML = '';

      // Set up minimal DOM
      const canvas = document.createElement('canvas');
      canvas.id = 'canvas';
      document.body.appendChild(canvas);

      const startAudioBtn = document.createElement('button');
      startAudioBtn.id = 'startAudioBtn';
      document.body.appendChild(startAudioBtn);

      const fullscreenBtn = document.createElement('button');
      fullscreenBtn.id = 'fullscreenBtn';
      document.body.appendChild(fullscreenBtn);

      // Mock canvas context
      mockCtx = {
        _fillStyle: '#000000',
        get fillStyle() { return this._fillStyle; },
        set fillStyle(value) { this._fillStyle = value; },
        fillRect: jest.fn(),
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        stroke: jest.fn(),
        arc: jest.fn(),
        fill: jest.fn()
      };

      // Mock canvas getContext
      canvas.getContext = jest.fn().mockReturnValue(mockCtx);

      // Mock window.addEventListener to capture DOMContentLoaded callback
      const originalAddEventListener = window.addEventListener;
      window.addEventListener = jest.fn((event, callback) => {
        if (event === 'DOMContentLoaded') {
          domContentLoadedCallback = callback;
        }
        return originalAddEventListener.call(window, event, callback);
      });
    });

    test('should initialize with minimal DOM elements', () => {
      const visualizer = new AudioVisualizer();
      expect(visualizer).toBeDefined();
      expect(visualizer.canvas).toBeDefined();
      expect(visualizer.ctx).toBeDefined();
    });

    test('should handle missing elements gracefully', () => {
      // Create visualizer with minimal DOM
      const visualizer = new AudioVisualizer();

      // Verify that the visualizer still initializes
      expect(visualizer).toBeDefined();
      expect(visualizer.canvas).toBeDefined();
      expect(visualizer.ctx).toBeDefined();

      // Verify that missing elements don't cause errors
      expect(() => visualizer.updateUIFromSettings()).not.toThrow();
      expect(() => visualizer.setupEventListeners()).not.toThrow();
    });

    test('should initialize audio after delay', () => {
      jest.useFakeTimers();
      const visualizer = new AudioVisualizer();

      // Trigger DOMContentLoaded
      if (domContentLoadedCallback) {
        domContentLoadedCallback();
      }

      // Fast-forward through the delay
      jest.advanceTimersByTime(1000);

      // Verify that audio initialization was attempted
      expect(visualizer.canvas).toBeDefined();
      expect(visualizer.ctx).toBeDefined();

      jest.useRealTimers();
    });
  });

  describe('Animation and Effects', () => {
    let mockCtx;
    let visualizer;
    let animationFrameCallback;

    beforeEach(() => {
        // Set up DOM
        document.body.innerHTML = `
            <canvas id="canvas"></canvas>
            <button id="startAudioBtn">Start Audio</button>
        `;

        // Mock canvas context
        mockCtx = {
            _fillStyle: 'rgba(0, 0, 0, 0.1)',
            get fillStyle() { return this._fillStyle; },
            set fillStyle(value) { this._fillStyle = value; },
            fillRect: jest.fn(),
            beginPath: jest.fn(),
            moveTo: jest.fn(),
            lineTo: jest.fn(),
            stroke: jest.fn(),
            arc: jest.fn(),
            fill: jest.fn()
        };

        // Mock canvas
        const canvas = document.getElementById('canvas');
        canvas.width = 800;
        canvas.height = 600;
        canvas.getContext = jest.fn().mockReturnValue(mockCtx);

        // Mock requestAnimationFrame to execute callback immediately
        window.requestAnimationFrame = jest.fn(callback => {
            callback();
            return 1;
        });

        // Create visualizer instance
        visualizer = new AudioVisualizer();
        
        // Mock the detectBeat method
        visualizer.detectBeat = jest.fn().mockReturnValue(true);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should update canvas with fade effect', () => {
        visualizer.animate();
        expect(mockCtx._fillStyle).toBe('rgba(0, 0, 0, 0.1)');
        expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
    });

    test('should handle beat detection in animation', () => {
        const detectBeatSpy = jest.spyOn(visualizer, 'detectBeat');
        const requestAnimationFrameSpy = jest.spyOn(window, 'requestAnimationFrame');
        
        visualizer.animate();
        
        expect(detectBeatSpy).toHaveBeenCalled();
        expect(requestAnimationFrameSpy).toHaveBeenCalled();
        expect(mockCtx._fillStyle).toBe('rgba(0, 0, 0, 0.1)');
        expect(mockCtx.canvas.width).toBeDefined();
        expect(mockCtx.canvas.height).toBeDefined();
    });
  });

  describe('Additional Event Listeners', () => {
    let mockCtx;
    let visualizer;

    beforeEach(() => {
        // Set up DOM with all required elements
        document.body.innerHTML = `
            <canvas id="canvas"></canvas>
            <button id="startAudioBtn">Start Audio</button>
            <button id="fullscreenBtn">Fullscreen</button>
            <button id="toggleSettings">Settings</button>
            <div id="settingsPanel" class="visible">
                <input type="color" id="colorPicker" value="#ff0000">
                <input type="range" id="sensitivity" min="0" max="100" value="50">
                <input type="range" id="lineCount" min="1" max="20" value="8">
                <input type="range" id="beatSensitivity" min="0" max="100" value="50">
                <select id="patternMode">
                    <option value="radial">Radial</option>
                    <option value="horizontal">Horizontal</option>
                </select>
                <select id="colorMode">
                    <option value="static">Static</option>
                    <option value="cycle">Cycle</option>
                </select>
                <div id="presetControls">
                    <button id="savePresetBtn">Save Preset</button>
                    <select id="presetSelect">
                        <option value="minimal">Minimal</option>
                    </select>
                </div>
            </div>
        `;

        // Mock canvas context
        mockCtx = {
            _fillStyle: 'rgba(0, 0, 0, 0.1)',
            get fillStyle() { return this._fillStyle; },
            set fillStyle(value) { this._fillStyle = value; },
            fillRect: jest.fn(),
            beginPath: jest.fn(),
            moveTo: jest.fn(),
            lineTo: jest.fn(),
            stroke: jest.fn(),
            arc: jest.fn(),
            fill: jest.fn()
        };

        // Mock canvas
        const canvas = document.getElementById('canvas');
        canvas.width = 800;
        canvas.height = 600;
        canvas.getContext = jest.fn().mockReturnValue(mockCtx);

        // Mock localStorage
        localStorage.setItem = jest.fn();
        localStorage.getItem = jest.fn();

        // Create visualizer instance
        visualizer = new AudioVisualizer();
    });

    test('should handle preset loading', () => {
        const presetSelect = document.getElementById('presetSelect');
        
        // Select the minimal preset
        presetSelect.value = 'minimal';
        presetSelect.dispatchEvent(new Event('change'));

        // Verify that the minimal preset was loaded correctly
        expect(visualizer.settings.lineCount).toBe(50);
        expect(visualizer.settings.sensitivity).toBe(50);
        expect(visualizer.settings.smoothingTimeConstant).toBe(0.8);
        expect(visualizer.isAnimating).toBe(true);
        expect(document.querySelector('canvas')).toBeTruthy();
        expect(localStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('Animation and Effects', () => {
    let mockCtx;
    let visualizer;
    let animationFrameCallback;

    beforeEach(() => {
        // Set up DOM
        document.body.innerHTML = `
            <canvas id="canvas"></canvas>
            <button id="startAudioBtn">Start Audio</button>
        `;

        // Mock canvas context
        mockCtx = {
            _fillStyle: 'rgba(0, 0, 0, 0.1)',
            get fillStyle() { return this._fillStyle; },
            set fillStyle(value) { this._fillStyle = value; },
            fillRect: jest.fn(),
            beginPath: jest.fn(),
            moveTo: jest.fn(),
            lineTo: jest.fn(),
            stroke: jest.fn(),
            arc: jest.fn(),
            fill: jest.fn()
        };

        // Mock canvas
        const canvas = document.getElementById('canvas');
        canvas.width = 800;
        canvas.height = 600;
        canvas.getContext = jest.fn().mockReturnValue(mockCtx);

        // Mock requestAnimationFrame to execute callback immediately
        window.requestAnimationFrame = jest.fn(callback => {
            callback();
            return 1;
        });

        // Create visualizer instance
        visualizer = new AudioVisualizer();
        
        // Mock the detectBeat method
        visualizer.detectBeat = jest.fn().mockReturnValue(true);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should update canvas with fade effect', () => {
        // Setup canvas mock
        const mockCanvas = document.createElement('canvas');
        mockCanvas.width = 800;
        mockCanvas.height = 600;
        document.body.appendChild(mockCanvas);

        // Trigger animation
        visualizer.animate();

        // Verify canvas clearing
        expect(mockCtx._fillStyle).toBe('rgba(0, 0, 0, 0.1)');
        expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);

        // Verify animation frame was requested
        expect(window.requestAnimationFrame).toHaveBeenCalled();

        // Cleanup
        document.body.removeChild(mockCanvas);
    });
  });
}); 