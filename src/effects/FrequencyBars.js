/**
 * Frequency bars visualization
 */

/**
 * Draw frequency bars
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {Object} dimensions - Canvas dimensions
 * @param {Uint8Array} audioData - Audio frequency data
 * @param {Object} settings - Visualization settings
 */
export function drawFrequencyBars(ctx, dimensions, audioData, settings) {
    const barWidth = dimensions.width / 64;
    const barSpacing = 2;
    const maxHeight = dimensions.height / 3;

    for (let i = 0; i < 64; i++) {
        const height = (audioData[i] / 255) * maxHeight;
        const x = i * (barWidth + barSpacing);
        const y = dimensions.height - height;

        ctx.fillStyle = settings.color;
        ctx.fillRect(x, y, barWidth, height);
    }
}
