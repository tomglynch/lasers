import { AudioVisualizer } from './src/AudioVisualizer.js';

// Initialize on DOM content loaded
window.addEventListener('DOMContentLoaded', () => {
    // Verify all required elements exist
    const requiredElements = [
        'canvas',
        'startAudio',
        'fullscreenBtn',
        'colorPicker',
        'sensitivity',
        'lineCount',
        'toggleSettings',
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

    // Initialize visualizer
    const visualizer = new AudioVisualizer();
    setTimeout(() => visualizer.startAudio(), 100);
}); 