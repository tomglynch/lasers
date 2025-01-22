import { drawHorizontalLines } from '../src/patterns/HorizontalPattern.js';

describe('HorizontalPattern', () => {
    let mockCtx;
    let dimensions;
    let audioData;
    let settings;

    beforeEach(() => {
        mockCtx = {
            beginPath: jest.fn(),
            moveTo: jest.fn(),
            lineTo: jest.fn(),
            stroke: jest.fn(),
            strokeStyle: '#000000',
            lineWidth: 1
        };

        // Define property setters and getters
        Object.defineProperties(mockCtx, {
            strokeStyle: {
                get: function() { return this._strokeStyle; },
                set: function(value) { this._strokeStyle = value; }
            },
            lineWidth: {
                get: function() { return this._lineWidth; },
                set: function(value) { this._lineWidth = value; }
            }
        });

        dimensions = {
            width: 800,
            height: 600
        };

        audioData = new Uint8Array(1024).fill(128);

        settings = {
            color: '#ff0000',
            lineThickness: 2,
            horizontalLineCount: 3,
            horizontalLineSpacing: 100,
            waveAmplitude: 50,
            waveSpeed: 2,
            verticalMovement: 'none',
            verticalSpeed: 1,
            verticalRange: 200,
            sensitivity: 50,
            beatIntensity: 2.0
        };

        // Mock performance.now()
        jest.spyOn(performance, 'now').mockReturnValue(1000);
    });

    afterEach(() => {
        performance.now.mockRestore();
    });

    describe('drawHorizontalLines', () => {
        test('should draw basic horizontal lines', () => {
            drawHorizontalLines(mockCtx, dimensions, audioData, settings, false);
            
            expect(mockCtx.strokeStyle).toBeDefined();
            expect(mockCtx.lineWidth).toBeDefined();
            expect(mockCtx.beginPath).toHaveBeenCalledTimes(settings.horizontalLineCount);
            expect(mockCtx.stroke).toHaveBeenCalledTimes(settings.horizontalLineCount);
        });

        test('should handle vertical movement', () => {
            settings.verticalMovement = 'updown';
            
            drawHorizontalLines(mockCtx, dimensions, audioData, settings, false);
            
            // Verify that different y-coordinates are used for moveTo/lineTo
            const yCoords = mockCtx.moveTo.mock.calls.map(call => call[1]);
            const uniqueYCoords = new Set(yCoords);
            expect(uniqueYCoords.size).toBeGreaterThan(1);
        });

        test('should apply beat intensity', () => {
            // First draw without beat
            drawHorizontalLines(mockCtx, dimensions, audioData, settings, false);
            const normalCalls = mockCtx.lineTo.mock.calls.map(call => call[1]);
            
            // Reset mocks
            mockCtx.lineTo.mockClear();
            
            // Draw with beat
            drawHorizontalLines(mockCtx, dimensions, audioData, settings, true);
            const beatCalls = mockCtx.lineTo.mock.calls.map(call => call[1]);
            
            // Compare y-coordinates - beat should have larger amplitudes
            const normalAmplitude = Math.max(...normalCalls.map(y => Math.abs(y - dimensions.height / 2)));
            const beatAmplitude = Math.max(...beatCalls.map(y => Math.abs(y - dimensions.height / 2)));
            expect(beatAmplitude).toBeGreaterThan(normalAmplitude);
        });

        test('should handle zero frequency data', () => {
            const zeroData = new Uint8Array(1024).fill(0);
            
            drawHorizontalLines(mockCtx, dimensions, zeroData, settings, false);
            
            // Lines should still be drawn, but with minimal wave effect
            expect(mockCtx.beginPath).toHaveBeenCalled();
            expect(mockCtx.moveTo).toHaveBeenCalled();
            expect(mockCtx.lineTo).toHaveBeenCalled();
        });

        test('should handle maximum frequency data', () => {
            const maxData = new Uint8Array(1024).fill(255);
            
            drawHorizontalLines(mockCtx, dimensions, maxData, settings, false);
            
            // Lines should be drawn with maximum wave effect
            expect(mockCtx.beginPath).toHaveBeenCalled();
            expect(mockCtx.moveTo).toHaveBeenCalled();
            expect(mockCtx.lineTo).toHaveBeenCalled();
        });

        test('should handle different line counts', () => {
            settings.horizontalLineCount = 5;
            
            drawHorizontalLines(mockCtx, dimensions, audioData, settings, false);
            
            expect(mockCtx.beginPath).toHaveBeenCalledTimes(5);
            expect(mockCtx.stroke).toHaveBeenCalledTimes(5);
        });

        test('should handle different wave speeds', () => {
            // Draw with normal speed
            drawHorizontalLines(mockCtx, dimensions, audioData, settings, false);
            const normalCalls = mockCtx.lineTo.mock.calls.map(call => call[1]);
            
            // Reset mocks
            mockCtx.lineTo.mockClear();
            
            // Draw with higher speed
            settings.waveSpeed = 4;
            drawHorizontalLines(mockCtx, dimensions, audioData, settings, false);
            const fastCalls = mockCtx.lineTo.mock.calls.map(call => call[1]);
            
            // Wave patterns should be different
            expect(normalCalls).not.toEqual(fastCalls);
        });
    });
}); 