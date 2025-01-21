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
    
    // Create canvas element
    document.body.innerHTML = '<canvas id="canvas"></canvas>';
    const canvas = document.getElementById('canvas');
    
    // Mock canvas context
    mockCtx = {
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      fillRect: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn()
    };
    
    // Mock getContext to return our mock context
    canvas.getContext = jest.fn(() => mockCtx);
    
    // Create visualizer instance
    visualizer = new AudioVisualizer();
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
      
      // Mock performance.now() to ensure enough time has passed since last beat
      performance.now.mockReturnValue(1000);
      
      const result = visualizer.detectBeat(visualizer.dataArray);
      expect(result).toBe(true);
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
}); 