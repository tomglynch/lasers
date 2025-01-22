/**
 * Radial pattern visualization
 */

/**
 * Draw radial lines pattern
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {Object} dimensions - Canvas dimensions
 * @param {Uint8Array} audioData - Audio frequency data
 * @param {Object} settings - Visualization settings
 * @param {boolean} beat - Whether a beat was detected
 */
export function drawRadialLines(ctx, dimensions, audioData, settings, beat) {
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    
    // Update critical parameters including glow
    ctx.strokeStyle = settings.color;
    ctx.lineWidth = settings.lineThickness;
    
    for (let i = 0; i < settings.lineCount; i++) {
        const angle = (i / settings.lineCount) * Math.PI * 2;
        const intensity = audioData[i * 2] / 255;
        
        // Use sensitivity and beat settings
        let length = intensity * (dimensions.height / 2) * (settings.sensitivity / 50);
        if (beat) {
            length *= settings.beatIntensity;
        }
        
        const endX = centerX + Math.cos(angle) * length;
        const endY = centerY + Math.sin(angle) * length;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }
}
