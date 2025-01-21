// Import jest-dom additions
import '@testing-library/jest-dom';

// Mock Canvas API
class CanvasRenderingContext2D {
  beginPath() {}
  moveTo() {}
  lineTo() {}
  arc() {}
  fill() {}
  stroke() {}
  clearRect() {}
}

// Mock Web Audio API
class AudioContext {
  constructor() {
    this.state = 'suspended';
    this.destination = {};
  }
  createAnalyser() {
    return {
      connect: () => {},
      disconnect: () => {},
      fftSize: 2048,
      frequencyBinCount: 1024,
      getByteFrequencyData: (array) => {
        // Fill with mock frequency data
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
      }
    };
  }
  createMediaStreamSource() {
    return {
      connect: () => {}
    };
  }
  createBiquadFilter() {
    return {
      connect: () => {},
      type: 'lowpass',
      frequency: { value: 0 },
      Q: { value: 0 }
    };
  }
}

// Mock HTML Canvas Element
class HTMLCanvasElement {
  getContext() {
    return new CanvasRenderingContext2D();
  }
}

// Setup global mocks
global.HTMLCanvasElement = HTMLCanvasElement;
global.CanvasRenderingContext2D = CanvasRenderingContext2D;
global.AudioContext = AudioContext;
global.webkitAudioContext = AudioContext;

// Mock window properties and methods
global.innerWidth = 1024;
global.innerHeight = 768;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id); 