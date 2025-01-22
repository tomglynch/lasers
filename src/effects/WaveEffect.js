/**
 * Wave effect visualization
 */

/**
 * Create new wave on beat
 * @returns {Object} New wave object
 */
export function createWave() {
    return {
        radius: 0,
        opacity: 1.0
    };
}

/**
 * Update and draw waves
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {Array} waves - Array of wave objects
 * @param {Object} dimensions - Canvas dimensions
 * @param {Object} settings - Visualization settings
 * @returns {Array} Updated array of waves
 */
export function updateWaves(ctx, waves, dimensions, settings) {
    return waves.filter(wave => {
        wave.radius += 5;
        wave.opacity -= 0.02;

        if (wave.opacity > 0) {
            ctx.beginPath();
            ctx.arc(dimensions.width / 2, dimensions.height / 2, wave.radius, 0, Math.PI * 2);
            ctx.lineWidth = settings.lineThickness;
            ctx.strokeStyle = `rgba(${parseInt(settings.color.substr(1,2), 16)}, 
                                   ${parseInt(settings.color.substr(3,2), 16)}, 
                                   ${parseInt(settings.color.substr(5,2), 16)}, 
                                   ${wave.opacity})`;
            ctx.stroke();
            return true;
        }
        return false;
    });
}
