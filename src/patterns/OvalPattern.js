/**
 * Oval pattern visualization that creates floating ovals that respond to audio
 */

/**
 * Draw floating oval patterns
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {Object} dimensions - Canvas dimensions
 * @param {Uint8Array} audioData - Audio frequency data
 * @param {Object} settings - Visualization settings
 * @param {boolean} beat - Whether a beat was detected
 */
export function drawOvals(ctx, dimensions, audioData, settings, beat) {
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    
    // Get movement style settings
    const style = settings.ovalStyle || 'slow';
    const speed = settings.ovalMovementSpeed || 2;
    const range = settings.ovalMovementRange || 100;
    const heightOffset = (settings.ovalHeightOffset || 0) / 100 * dimensions.height / 2;
    const widthRatio = settings.ovalWidthRatio || 1;
    const rotationSpeed = (settings.ovalRotationSpeed || 0.2) * Math.PI * 2;
    const rotationOffset = settings.ovalRotationOffset || 0;
    
    // Time calculation based on style
    const time = style === 'slow' || style === 'ovalsv2' ? 
        performance.now() / 4000 : // Slow movement
        performance.now() / 1000 * speed; // Wave movement
    
    // Number of ovals to draw
    const numOvals = Math.max(1, Math.min(8, settings.ovalCount || 1));
    const isDouble = style === 'double';
    const isV2 = style === 'ovalsv2';
    const actualOvals = isV2 ? numOvals : (isDouble ? Math.ceil(numOvals / 2) : numOvals);
    
    // Base oval size
    const baseSize = Math.max(1, settings.ovalSize || 50);
    
    // Calculate movement bounds
    const maxOffset = style === 'slow' || style === 'ovalsv2' ? 
        Math.min(dimensions.width, dimensions.height) * (style === 'ovalsv2' ? 0.25 : 0.4) : // Reduced range for v2
        range; // Wave style uses fixed range
    
    // Fixed colors for v2 style
    const v2Colors = ['#00CED1', '#9400D3']; // Turquoise and Purple
    
    // Create semi-random offsets for v2 style that change slowly
    const getV2Offset = (index, seed) => {
        const slowTime = time * 0.1; // Very slow change
        return Math.sin(slowTime + index * seed) * baseSize * 0.3; // Small offset based on oval size
    };
    
    // Draw function for a single oval
    const drawSingleOval = (index, color, timeOffset = 0, pairIndex = 0) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = settings.lineThickness;
        
        // Get audio intensity first for size calculation
        const intensity = audioData[index * 8] / 255 * (settings.sensitivity / 50);
        
        // Calculate dimensions with beat effect
        let width = baseSize * (1 + intensity * 0.5) * (style === 'ovalsv2' ? 10 : widthRatio);
        let height = baseSize * (1 + intensity * 0.5);
        
        // Ensure ovals stay on screen for v2 style
        if (style === 'ovalsv2') {
            const maxAllowedWidth = dimensions.width * 0.4; // 40% of screen width
            width = Math.min(width, maxAllowedWidth);
        }
        
        if (beat) {
            width *= settings.beatIntensity;
            height *= settings.beatIntensity;
        }
        
        // Calculate safe movement bounds accounting for oval width
        const safeXRange = dimensions.width * 0.3 - width;
        const safeYRange = maxOffset * 0.15 - height;
        
        // Calculate position based on style
        let offsetX, offsetY;
        if (style === 'ovalsv2') {
            // Slower horizontal movement for v2, stay near top
            offsetX = Math.sin(time * 0.3 + pairIndex * Math.PI) * Math.max(0, safeXRange);
            offsetY = Math.cos(time * 0.2 + index * Math.PI/2) * Math.max(0, safeYRange) - dimensions.height * 0.3;
            
            // Add small random offsets for overlapping effect, but respect bounds
            if (color === v2Colors[1]) { // Only offset the purple ovals
                const maxRandomOffset = Math.min(width * 0.3, safeXRange * 0.2);
                offsetX += getV2Offset(index, 1.5) * maxRandomOffset / (baseSize * 0.3);
                offsetY += getV2Offset(index, 2.7) * Math.min(height, safeYRange * 0.2) / (baseSize * 0.3);
            }
            
            // Ensure the oval center stays within safe bounds
            offsetX = Math.max(-safeXRange, Math.min(safeXRange, offsetX));
            offsetY = Math.max(-dimensions.height * 0.4, Math.min(0, offsetY));
        } else if (style === 'slow') {
            offsetX = Math.sin(time * 0.7 + index * Math.PI/2) * maxOffset;
            offsetY = Math.cos(time * 0.5 + index * Math.PI/3) * maxOffset;
        } else {
            // Wave style movement
            offsetX = Math.sin(time + index * Math.PI/2) * maxOffset;
            offsetY = Math.cos(time * 1.4 + index * Math.PI/2) * (maxOffset * 0.7);
        }
        
        // Calculate rotation - no rotation for v2 style
        const rotation = style === 'ovalsv2' ? 0 : 
            (performance.now() / 1000 * rotationSpeed) + 
            (index * Math.PI/4) + 
            timeOffset + 
            rotationOffset;
        
        // Draw the oval
        ctx.beginPath();
        ctx.ellipse(
            centerX + offsetX,
            centerY + offsetY + heightOffset,
            width,
            height,
            rotation,
            0,
            Math.PI * 2
        );
        ctx.stroke();
    };
    
    // Draw all ovals
    if (isV2) {
        // Draw pairs of ovals with fixed colors
        for (let pair = 0; pair < actualOvals; pair++) {
            // Draw purple oval first (behind)
            drawSingleOval(pair, v2Colors[1], 0, pair);
            // Draw turquoise oval second (in front)
            drawSingleOval(pair, v2Colors[0], 0, pair);
        }
    } else if (isDouble) {
        for (let i = 0; i < actualOvals; i++) {
            drawSingleOval(i, settings.color);
            drawSingleOval(i, settings.ovalSecondaryColor, Math.PI/2);
        }
    } else {
        for (let i = 0; i < actualOvals; i++) {
            drawSingleOval(i, settings.color);
        }
    }
}
