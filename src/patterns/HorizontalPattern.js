/**
 * Horizontal pattern visualization
 */

/**
 * Draw horizontal wave lines pattern
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {Object} dimensions - Canvas dimensions
 * @param {Uint8Array} audioData - Audio frequency data
 * @param {Object} settings - Visualization settings
 * @param {boolean} beat - Whether a beat was detected
 */
export function drawHorizontalLines(ctx, dimensions, audioData, settings, beat) {
    const centerY = dimensions.height / 2;
    ctx.strokeStyle = settings.color;
    ctx.lineWidth = settings.lineThickness;
    
    // Time-based offset for wave movement
    const timeOffset = performance.now() / 1000;
    const waveOffset = timeOffset * settings.waveSpeed;
    
    // Calculate vertical offset for up/down movement
    let verticalOffset = 0;
    if (settings.verticalMovement === 'updown') {
        verticalOffset = Math.sin(timeOffset * settings.verticalSpeed) * settings.verticalRange;
    }
    
    // Draw each horizontal line
    for (let i = 0; i < settings.horizontalLineCount; i++) {
        const baseY = centerY + 
                     (i - (settings.horizontalLineCount - 1) / 2) * settings.horizontalLineSpacing + 
                     verticalOffset;
        
        ctx.beginPath();
        
        // Draw the wavy line
        for (let x = 0; x < dimensions.width; x += 2) {
            const freqIndex = Math.floor((x / dimensions.width) * 32);
            const frequency = audioData[freqIndex] / 255.0;
            
            // Apply beat effect to wave amplitude
            let currentAmplitude = settings.waveAmplitude;
            if (beat) {
                currentAmplitude *= settings.beatIntensity;
            }
            
            const wave = Math.sin(x / 50 + waveOffset + i * Math.PI) * currentAmplitude;
            const y = baseY + wave * frequency * (settings.sensitivity / 50);
            
            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
    }
}
