/**
 * Particle effect visualization
 */

/**
 * Create new particles on beat
 * @param {Object} dimensions - Canvas dimensions
 * @param {Object} settings - Visualization settings
 * @returns {Array} Array of new particle objects
 */
export function createParticles(dimensions, settings) {
    const particles = [];
    for (let i = 0; i < 5; i++) {
        particles.push({
            x: dimensions.width / 2,
            y: dimensions.height / 2,
            angle: Math.random() * Math.PI * 2,
            speed: 2 + Math.random() * 4,
            size: settings.particleSize,
            life: 1.0
        });
    }
    return particles;
}

/**
 * Update and draw particles
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {Array} particles - Array of particle objects
 * @param {Object} settings - Visualization settings
 * @returns {Array} Updated array of particles
 */
export function updateParticles(ctx, particles, settings) {
    return particles.filter(particle => {
        particle.x += Math.cos(particle.angle) * particle.speed;
        particle.y += Math.sin(particle.angle) * particle.speed;
        particle.life -= 0.02;

        if (particle.life > 0) {
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${parseInt(settings.color.substr(1,2), 16)}, 
                                 ${parseInt(settings.color.substr(3,2), 16)}, 
                                 ${parseInt(settings.color.substr(5,2), 16)}, 
                                 ${particle.life})`;
            ctx.fill();
            return true;
        }
        return false;
    });
}
