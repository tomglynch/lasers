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
    // Sum energy between ~100Hz (bin 10) and ~400Hz (bin 40) to detect bass frequencies
    energy = audioData.subarray(10, 40).reduce((sum, value) => sum + value, 0);
    energy = energy / 3000; // Normalize to 0-1 range (30 bins * 255 max value)
    // Add minimum energy threshold to filter out silence
    const MIN_ENERGY = 0.15;
    if (energy < MIN_ENERGY) {
        return false;
    }

    // Check if enough time has passed since last beat 
    // (150ms is slightly less than the gap between the two fast ones in a dnb song)
    const now = Date.now();
    if (now - beatData.lastBeatTime < 150) {
        console.log("Beat rejected: beat too recent");
        return false;
    }
    
    // Update energy history
    beatData.energy.history.push(energy);
    beatData.energy.history.shift();
    
    // Calculate dynamic threshold with a minimum value
    const sum = beatData.energy.history.reduce((a, b) => a + b, 0);
    const avg = sum / beatData.energy.history.length;
    const MIN_THRESHOLD = 0.15;
    // The threshold grows over time because we keep adding energy values to history
    // and calculating average. Let's add a maximum threshold to prevent it from
    // getting too high
    const MAX_THRESHOLD = 0.4;
    beatData.threshold = Math.min(
        Math.max(avg * settings.beatSensitivity, MIN_THRESHOLD),
        MAX_THRESHOLD
    );
    
    // Detect beat with less strict conditions
    // Removed the 1.3 * avg condition since the average was making it harder over time
    if (energy > beatData.threshold && 
        energy > beatData.energy.previous) {
        beatData.lastBeatTime = now;
        beatData.energy.previous = energy;
        console.log("Beat detected", {energy, threshold: beatData.threshold, avg});
        return true;
    } else {
        if (energy <= beatData.threshold) {
            console.log("Beat rejected: energy below threshold", {energy, threshold: beatData.threshold});
        } else if (energy <= beatData.energy.previous) {
            console.log("Beat rejected: energy not increasing", {energy, previous: beatData.energy.previous});
        }
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
