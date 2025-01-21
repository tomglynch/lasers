import { AudioVisualizer } from '../src/AudioVisualizer';

describe('Visual Effects', () => {
  let visualizer;
  let mockCtx;

  beforeEach(() => {
    // Create canvas element
    document.body.innerHTML = '<canvas id="canvas"></canvas>';
    const canvas = document.getElementById('canvas');
    
    // Mock canvas context
    mockCtx = {
        beginPath: jest.fn(),
        arc: jest.fn(),
        fill: jest.fn(),
        fillRect: jest.fn(),
        stroke: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn()
    };
    
    // Mock getContext to return our mock context
    canvas.getContext = jest.fn(() => mockCtx);
    
    // Create visualizer instance
    visualizer = new AudioVisualizer();
    
    // Spy on canvas context methods
    jest.spyOn(mockCtx, 'beginPath');
    jest.spyOn(mockCtx, 'arc');
    jest.spyOn(mockCtx, 'fill');
    jest.spyOn(mockCtx, 'fillRect');
    jest.spyOn(mockCtx, 'stroke');
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  describe('Particle System', () => {
    test('should create particles on beat', () => {
      visualizer.settings.particlesEnabled = true;
      visualizer.settings.particleSize = 3;
      
      expect(visualizer.particles.length).toBe(0);
      visualizer.updateParticles(true);
      expect(visualizer.particles.length).toBeGreaterThan(0);
    });

    test('should not create particles when disabled', () => {
      visualizer.settings.particlesEnabled = false;
      
      visualizer.updateParticles(true);
      expect(visualizer.particles.length).toBe(0);
    });

    test('should remove particles after lifetime expires', () => {
      visualizer.settings.particlesEnabled = true;
      
      // Create particles
      visualizer.updateParticles(true);
      const initialCount = visualizer.particles.length;
      
      // Advance time to expire particles
      for (let i = 0; i < 100; i++) {
        visualizer.updateParticles(false);
      }
      
      expect(visualizer.particles.length).toBeLessThan(initialCount);
    });
  });

  describe('Wave Effect', () => {
    test('should create waves on beat', () => {
      visualizer.settings.wavesEnabled = true;
      
      expect(visualizer.waves.length).toBe(0);
      visualizer.updateWaves(true);
      expect(visualizer.waves.length).toBeGreaterThan(0);
    });

    test('should not create waves when disabled', () => {
      visualizer.settings.wavesEnabled = false;
      
      visualizer.updateWaves(true);
      expect(visualizer.waves.length).toBe(0);
    });

    test('should expand waves over time', () => {
      visualizer.settings.wavesEnabled = true;
      
      visualizer.updateWaves(true);
      const initialRadius = visualizer.waves[0].radius;
      
      visualizer.updateWaves(false);
      expect(visualizer.waves[0].radius).toBeGreaterThan(initialRadius);
    });

    test('should fade waves over time', () => {
      visualizer.settings.wavesEnabled = true;
      
      visualizer.updateWaves(true);
      const initialOpacity = visualizer.waves[0].opacity;
      
      visualizer.updateWaves(false);
      expect(visualizer.waves[0].opacity).toBeLessThan(initialOpacity);
    });
  });

  describe('Frequency Bars', () => {
    test('should draw correct number of bars', () => {
      visualizer.settings.frequencyBarsEnabled = true;
      visualizer.dataArray = new Uint8Array(1024).fill(128);
      
      visualizer.drawFrequencyBars();
      
      // Should draw 64 bars
      expect(mockCtx.fillRect).toHaveBeenCalledTimes(64);
    });

    test('should not draw bars when disabled', () => {
      visualizer.settings.frequencyBarsEnabled = false;
      visualizer.dataArray = new Uint8Array(1024).fill(128);
      
      visualizer.drawFrequencyBars();
      
      expect(mockCtx.fillRect).not.toHaveBeenCalled();
    });

    test('should scale bar height based on frequency data', () => {
      visualizer.settings.frequencyBarsEnabled = true;
      visualizer.dataArray = new Uint8Array(1024);
      
      // Set different amplitudes
      visualizer.dataArray.fill(255, 0, 32);  // Max amplitude for first half
      visualizer.dataArray.fill(128, 32, 64); // Half amplitude for second half
      
      visualizer.drawFrequencyBars();
      
      const calls = mockCtx.fillRect.mock.calls;
      const firstBarHeight = calls[0][3];  // Height is the fourth parameter
      const lastBarHeight = calls[63][3];
      
      expect(firstBarHeight).toBeGreaterThan(lastBarHeight);
    });
  });
}); 