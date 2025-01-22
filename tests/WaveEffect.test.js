import { createWave, updateWaves } from '../src/effects/WaveEffect.js';

describe('WaveEffect', () => {
    let mockCtx;
    let waves;

    beforeEach(() => {
        mockCtx = {
            _strokeStyle: '',
            beginPath: jest.fn(),
            moveTo: jest.fn(),
            lineTo: jest.fn(),
            arc: jest.fn(),
            stroke: jest.fn(),
            get strokeStyle() {
                return this._strokeStyle;
            },
            set strokeStyle(value) {
                this._strokeStyle = value;
            }
        };

        waves = [{
            radius: 0,
            opacity: 1.0
        }];
    });

    describe('updateWaves', () => {
        test('should update wave properties', () => {
            const initialRadius = waves[0].radius;
            const initialOpacity = waves[0].opacity;
            const updatedWaves = updateWaves(mockCtx, waves, { width: 800, height: 600 }, { color: '#123456', lineThickness: 2 });
            expect(updatedWaves[0].radius).toBeGreaterThan(initialRadius);
            expect(updatedWaves[0].opacity).toBeLessThan(initialOpacity);
        });

        test('should use correct color format', () => {
            const color = '#123456';
            updateWaves(mockCtx, waves, { width: 800, height: 600 }, { color, lineThickness: 2 });
            expect(mockCtx._strokeStyle).toMatch(/^rgba\(18,\s*52,\s*86,\s*0\.\d+\)$/);
        });

        test('should draw wave path', () => {
            updateWaves(mockCtx, waves, { width: 800, height: 600 }, { color: '#123456', lineThickness: 2 });
            expect(mockCtx.beginPath).toHaveBeenCalled();
            expect(mockCtx.arc).toHaveBeenCalledWith(400, 300, expect.any(Number), 0, Math.PI * 2);
            expect(mockCtx.stroke).toHaveBeenCalled();
        });
    });

    describe('createWave', () => {
        test('should create wave with default properties', () => {
            const wave = createWave();
            expect(wave).toHaveProperty('radius', 0);
            expect(wave).toHaveProperty('opacity', 1.0);
        });

        test('should create unique waves', () => {
            const wave1 = createWave();
            const wave2 = createWave();
            expect(wave1).not.toBe(wave2);
        });
    });
}); 