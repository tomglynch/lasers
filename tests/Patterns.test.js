import { AudioVisualizer } from '../src/AudioVisualizer';

describe('Visualization Patterns', () => {
  let visualizer;
  let mockCtx;

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
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
    
    // Mock audio data
    visualizer.dataArray = new Uint8Array(1024).fill(128);
    
    // Set default canvas dimensions
    visualizer.canvas.width = 800;
    visualizer.canvas.height = 600;

    // Mock performance.now()
    global.performance = {
      now: jest.fn().mockReturnValue(0)
    };
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  describe('Radial Pattern', () => {
    beforeEach(() => {
      visualizer.settings.patternMode = 'radial';
      visualizer.settings.lineCount = 8;
      visualizer.settings.beatIntensity = 2.0;
    });

    test('should draw correct number of lines', () => {
      visualizer.drawLines(false);
      
      expect(mockCtx.beginPath).toHaveBeenCalledTimes(8);
      expect(mockCtx.lineTo).toHaveBeenCalledTimes(8);
      expect(mockCtx.stroke).toHaveBeenCalledTimes(8);
    });

    test('should respond to beat detection', () => {
      // Set up test data
      visualizer.dataArray = new Uint8Array(1024).fill(128);
      
      // Draw without beat
      visualizer.settings.beatIntensity = 1.0;
      visualizer.drawLines(false);
      const withoutBeatCalls = [...mockCtx.lineTo.mock.calls];

      // Clear mocks
      jest.clearAllMocks();

      // Set up beat conditions
      visualizer.settings.beatIntensity = 2.0;
      visualizer.settings.sensitivity = 50;
      
      // Draw with beat
      visualizer.drawLines(true);
      const withBeatCalls = [...mockCtx.lineTo.mock.calls];

      // Verify that at least one line is longer with beat
      const withoutBeatLength = Math.sqrt(
        Math.pow(withoutBeatCalls[0][0], 2) + 
        Math.pow(withoutBeatCalls[0][1], 2)
      );
      
      const withBeatLength = Math.sqrt(
        Math.pow(withBeatCalls[0][0], 2) + 
        Math.pow(withBeatCalls[0][1], 2)
      );
      
      expect(withBeatLength).toBeGreaterThan(withoutBeatLength);
    });
  });

  describe('Horizontal Pattern', () => {
    beforeEach(() => {
      visualizer.settings.patternMode = 'horizontal';
      visualizer.settings.horizontalLineCount = 5;
      visualizer.settings.waveAmplitude = 50;
      visualizer.settings.waveSpeed = 2;
      visualizer.settings.verticalMovement = true;
      visualizer.settings.verticalSpeed = 1;
    });

    test('should draw correct number of horizontal lines', () => {
      // Mock performance.now to return a fixed value
      performance.now = jest.fn().mockReturnValue(0);
      
      // Set up test conditions
      visualizer.settings.horizontalLineCount = 5;
      visualizer.settings.waveAmplitude = 0; // Disable wave effect for this test
      visualizer.settings.verticalMovement = false;
      
      visualizer.drawHorizontalLines(false);
      
      expect(mockCtx.beginPath).toHaveBeenCalledTimes(5);
      expect(mockCtx.moveTo).toHaveBeenCalledTimes(5);
      expect(mockCtx.stroke).toHaveBeenCalledTimes(5);
    });

    test('should apply wave effect', () => {
      // Draw initial wave
      performance.now = jest.fn().mockReturnValue(0);
      visualizer.drawHorizontalLines(false);
      const firstWave = [...mockCtx.lineTo.mock.calls];
      
      // Simulate time passing
      jest.clearAllMocks();
      performance.now = jest.fn().mockReturnValue(1000);
      visualizer.drawHorizontalLines(false);
      const secondWave = [...mockCtx.lineTo.mock.calls];

      // Wave positions should be different
      expect(secondWave[0][1]).not.toBe(firstWave[0][1]);
    });

    test('should handle vertical movement', () => {
      // Draw initial position
      visualizer.drawHorizontalLines(false);
      const firstPosition = mockCtx.lineTo.mock.calls;
      
      // Simulate time passing
      performance.now.mockReturnValue(1000);
      jest.clearAllMocks();
      visualizer.drawHorizontalLines(false);
      const secondPosition = mockCtx.lineTo.mock.calls;

      // Vertical positions should be different
      expect(secondPosition[0][1]).not.toEqual(firstPosition[0][1]);
    });
  });
}); 