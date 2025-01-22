/**
 * Utility functions for audio processing and beat detection
 */

/**
 * Initialize audio context and analyzer
 * @param {MediaStream} stream - Audio input stream
 * @param {Object} settings - Audio settings
 * @returns {Object} Audio context and analyzer node
 */
export async function initializeAudio(stream, settings) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    
    // Create a low-pass filter for bass frequencies
    const bassFilter = audioContext.createBiquadFilter();
    bassFilter.type = 'lowpass';
    bassFilter.frequency.value = settings.bassFrequency;
    bassFilter.Q.value = settings.bassQuality;
    
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.5;
    
    // Connect the audio nodes
    source.connect(bassFilter);
    bassFilter.connect(analyser);
    
    return {
        context: audioContext,
        analyser: analyser,
        dataArray: new Uint8Array(analyser.frequencyBinCount)
    };
}

/**
 * Detect beats in audio data
 * @param {Uint8Array} audioData - Audio frequency data
 * @param {Object} beatData - Beat detection state
 * @param {Object} settings - Audio settings
 * @returns {boolean} Whether a beat was detected
 */
export function detectBeat(audioData, beatData, settings) {
    // Calculate energy in sub-bass frequencies
    let energy = 0;
    for (let i = 0; i < 10; i++) {
        energy += audioData[i];
    }
    energy = energy / 2550; // Normalize to 0-1 range

    // Check if enough time has passed since last beat
    const now = Date.now();
    if (now - beatData.lastBeatTime < settings.minTimeBetweenBeats) {
        return false;
    }
    
    // Update energy history
    beatData.energy.history.push(energy);
    beatData.energy.history.shift();
    
    // Calculate dynamic threshold
    const sum = beatData.energy.history.reduce((a, b) => a + b, 0);
    const avg = sum / beatData.energy.history.length;
    beatData.threshold = avg * settings.beatSensitivity;
    
    // Detect beat
    if (energy > beatData.threshold && energy > beatData.energy.previous) {
        beatData.lastBeatTime = now;
        beatData.energy.previous = energy;
        return true;
    }
    
    beatData.energy.previous = energy;
    return false;
}

/**
 * Request and set up audio input
 * @returns {Promise<MediaStream>} Audio input stream
 */
export async function setupAudioInput() {
    try {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
        
        if (permissionStatus.state === 'granted' || permissionStatus.state === 'prompt') {
            return await navigator.mediaDevices.getUserMedia({ audio: true });
        } else {
            throw new Error('Microphone access denied');
        }
    } catch (err) {
        console.error('Error accessing microphone:', err);
        throw err;
    }
}
