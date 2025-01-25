import { AudioVisualizer } from './src/AudioVisualizer.js';
import { SettingsManager } from './settings.js';

// Create instances
const visualizer = new AudioVisualizer();
const settingsManager = new SettingsManager();

// Make settings manager globally available for the visualizer
window.settingsManager = settingsManager;

// Start audio if autoplay is enabled
document.addEventListener('DOMContentLoaded', () => {
    // Add click handler for start audio button
    const startAudioBtn = document.getElementById('startAudio');
    if (startAudioBtn) {
        startAudioBtn.addEventListener('click', () => visualizer.startAudio());
    }

    // Add click handler for fullscreen button
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => visualizer.toggleFullscreen());
    }
}); 