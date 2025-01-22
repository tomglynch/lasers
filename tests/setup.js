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

// Mock HTML elements needed by AudioVisualizer
document.body.innerHTML = `
  <canvas id="canvas"></canvas>
  <button id="startAudio">Start Audio</button>
  <button id="fullscreenBtn">Fullscreen</button>
  <input type="color" id="colorPicker" />
  <input type="range" id="sensitivity" min="0" max="100" />
  <input type="range" id="lineCount" min="1" max="32" />
  <input type="range" id="beatSensitivity" min="0" max="100" />
  <input type="checkbox" id="particlesEffect" />
  <input type="range" id="particleSize" min="1" max="10" />
  <input type="checkbox" id="wavesEffect" />
  <input type="checkbox" id="frequencyBars" />
  <input type="range" id="lineThickness" min="1" max="10" />
  <select id="patternMode">
    <option value="radial">Radial</option>
    <option value="horizontal">Horizontal</option>
  </select>
  <select id="colorMode">
    <option value="static">Static</option>
    <option value="cycle">Cycle</option>
  </select>
  <input type="range" id="colorCycleSpeed" min="0.5" max="5" step="0.1" />
  <input type="range" id="colorSaturation" min="0" max="100" />
  <input type="range" id="colorLightness" min="0" max="100" />
  <input type="range" id="horizontalLineCount" min="1" max="10" />
  <input type="range" id="waveAmplitude" min="0" max="200" />
  <input type="range" id="waveSpeed" min="0.5" max="5" step="0.1" />
  <select id="verticalMovement">
    <option value="none">None</option>
    <option value="updown">Up/Down</option>
  </select>
  <input type="range" id="verticalSpeed" min="0.5" max="5" step="0.1" />
  <input type="range" id="verticalRange" min="50" max="400" />
  <input type="range" id="bassFrequency" min="20" max="200" />
  <input type="range" id="bassQuality" min="0.1" max="5" step="0.1" />
  <div id="settings" class="hidden"></div>
  <button id="toggleSettings">Toggle Settings</button>
  <button id="randomizeBtn">Randomize</button>
  <select id="presetSelect"></select>
  <button id="loadPreset">Load Preset</button>
  <button id="savePreset">Save Preset</button>
  <input type="text" id="newPresetName" />
  <div id="horizontalControls"></div>
  <div id="cycleControls"></div>
`;