# Audio Laser Visualizer

An interactive audio visualizer that creates laser-like patterns synchronized to your microphone input. Features multiple visualization modes, real-time beat detection, and customizable visual effects.

## Prerequisites

- Node.js (v14 or higher)
- A modern web browser (Chrome, Firefox, Safari, or Edge)
- A microphone

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd lasers
```

2. Install dependencies:
```bash
npm install
```

## Running the Visualizer

1. Start the development server:
```bash
npm run dev
```

2. Open your browser and navigate to:
```
http://localhost:8000
```

3. When prompted, allow microphone access in your browser.

## Features

- **Multiple Visualization Patterns**
  - Radial: Lines emanating from the center
  - Horizontal: Wave-like patterns moving horizontally

- **Real-time Audio Analysis**
  - Beat detection
  - Frequency analysis
  - Bass-focused filtering

- **Visual Effects**
  - Particles
  - Waves
  - Frequency bars
  - Color cycling

- **Customization Options**
  - Line count and thickness
  - Color settings
  - Beat sensitivity
  - Wave parameters
  - And more!

## Controls

- **Start Audio**: Begins microphone capture and visualization
- **Fullscreen**: Toggles fullscreen mode
- **Randomize**: Generates random visual settings
- **Settings Panel**: Toggle with the button in the top-left corner

## Development

The server uses live reload, so any changes to the files will automatically refresh the browser. The server watches for changes in:
- HTML files
- JavaScript files
- CSS files

## Troubleshooting

1. **No Audio Input**
   - Check if your microphone is properly connected
   - Make sure you've granted microphone permissions in your browser
   - Try refreshing the page

2. **Performance Issues**
   - Try reducing the number of visual effects enabled
   - Lower the line count
   - Disable frequency bars if enabled

3. **Browser Compatibility**
   - Ensure you're using a modern browser with Web Audio API support
   - Check that JavaScript is enabled 