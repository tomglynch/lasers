import { initializeAudio, detectBeat, setupAudioInput } from '../src/utils/AudioUtils.js';

describe('AudioUtils', () => {
    let mockAudioContext;
    let mockAnalyser;
    let mockBassFilter;
    let mockMediaStreamSource;
    let mockStream;
    let mockSettings;

    beforeEach(() => {
        mockAnalyser = {
            fftSize: 2048,
            smoothingTimeConstant: 0.5,
            frequencyBinCount: 1024,
            connect: jest.fn()
        };

        mockBassFilter = {
            type: 'lowpass',
            frequency: { value: 150 },
            Q: { value: 1 },
            connect: jest.fn()
        };

        mockMediaStreamSource = {
            connect: jest.fn()
        };

        mockAudioContext = {
            createAnalyser: jest.fn().mockReturnValue(mockAnalyser),
            createMediaStreamSource: jest.fn().mockReturnValue(mockMediaStreamSource),
            createBiquadFilter: jest.fn().mockReturnValue(mockBassFilter)
        };

        mockStream = 'mock-stream';
        mockSettings = {
            bassFrequency: 150,
            bassQuality: 1,
            beatSensitivity: 2.0,
            minTimeBetweenBeats: 100
        };

        global.AudioContext = jest.fn().mockImplementation(() => mockAudioContext);
        global.webkitAudioContext = jest.fn().mockImplementation(() => mockAudioContext);
    });

    describe('initializeAudio', () => {
        test('should initialize audio context and analyzer', async () => {
            const result = await initializeAudio(mockStream, mockSettings);
            
            expect(result).toHaveProperty('context', mockAudioContext);
            expect(result).toHaveProperty('analyser', mockAnalyser);
            expect(result).toHaveProperty('dataArray');
            expect(result.dataArray).toBeInstanceOf(Uint8Array);
            expect(result.dataArray.length).toBe(1024);
        });

        test('should set up bass filter with correct settings', async () => {
            await initializeAudio(mockStream, {
                ...mockSettings,
                bassFrequency: 200,
                bassQuality: 2
            });
            
            expect(mockBassFilter.frequency.value).toBe(200);
            expect(mockBassFilter.Q.value).toBe(2);
        });

        test('should connect audio nodes in correct order', async () => {
            await initializeAudio(mockStream, mockSettings);
            
            expect(mockMediaStreamSource.connect).toHaveBeenCalledWith(mockBassFilter);
            expect(mockBassFilter.connect).toHaveBeenCalledWith(mockAnalyser);
        });
    });

    describe('detectBeat', () => {
        let audioData;
        let beatData;
        let mockSettings;
        let mockDate;

        beforeEach(() => {
            // Set up audio data with very high energy in sub-bass frequencies
            audioData = new Uint8Array(1024);
            for (let i = 0; i < 10; i++) {
                audioData[i] = 240; // Very high value
            }

            // Set up beat data with low energy history
            beatData = {
                energy: {
                    current: 0.2,
                    previous: 0.1,
                    history: Array(8).fill(0.1)
                },
                threshold: 0.2,
                lastBeatTime: 0
            };

            // Set up settings with high sensitivity and low minimum time
            mockSettings = {
                beatSensitivity: 2.0,
                minTimeBetweenBeats: 100
            };

            // Mock Date.now to return a fixed value
            mockDate = 1000;
            jest.spyOn(Date, 'now').mockImplementation(() => mockDate);
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        test('should detect first beat', () => {
            const result = detectBeat(audioData, beatData, mockSettings);
            expect(result).toBe(true);
        });

        test('should respect minimum time between beats', () => {
            // First beat should be detected
            let result = detectBeat(audioData, beatData, mockSettings);
            expect(result).toBe(true);

            // Second beat within minimum time should not be detected
            mockDate = 1050;
            result = detectBeat(audioData, beatData, mockSettings);
            expect(result).toBe(false);

            // Third beat after minimum time should be detected
            mockDate = 1150;
            result = detectBeat(audioData, beatData, mockSettings);
            expect(result).toBe(true);
        });

        test('should update energy history', () => {
            const originalHistory = [...beatData.energy.history];
            detectBeat(audioData, beatData, mockSettings);
            expect(beatData.energy.history).not.toEqual(originalHistory);
            expect(beatData.energy.history[0]).toBeGreaterThan(0.1);
        });
    });

    describe('setupAudioInput', () => {
        let mockMediaStream;
        let mockMediaStreamSource;
        let mockAudioContext;
        let mockAnalyser;
        let mockBassFilter;

        beforeEach(() => {
            mockMediaStream = {};
            mockMediaStreamSource = {
                connect: jest.fn()
            };
            mockAudioContext = {
                createMediaStreamSource: jest.fn().mockReturnValue(mockMediaStreamSource),
                createAnalyser: jest.fn().mockReturnValue(mockAnalyser),
                createBiquadFilter: jest.fn().mockReturnValue(mockBassFilter)
            };
            mockAnalyser = {
                connect: jest.fn(),
                frequencyBinCount: 1024,
                getByteFrequencyData: jest.fn()
            };
            mockBassFilter = {
                connect: jest.fn(),
                frequency: { value: 0 },
                type: ''
            };

            // Mock navigator.permissions
            global.navigator.permissions = {
                query: jest.fn().mockResolvedValue({ state: 'granted' })
            };

            // Mock navigator.mediaDevices
            global.navigator.mediaDevices = {
                getUserMedia: jest.fn().mockResolvedValue(mockMediaStream)
            };
        });

        test('should handle successful microphone access', async () => {
            await expect(setupAudioInput()).resolves.toBe(mockMediaStream);
            expect(global.navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
        });

        test('should handle getUserMedia error', async () => {
            global.navigator.mediaDevices.getUserMedia.mockRejectedValue(new Error('getUserMedia error'));
            await expect(setupAudioInput()).rejects.toThrow('getUserMedia error');
        });

        test('should handle permissions error', async () => {
            global.navigator.permissions.query.mockRejectedValue(new Error('permissions error'));
            await expect(setupAudioInput()).rejects.toThrow('permissions error');
        });

        test('should handle denied permission', async () => {
            global.navigator.permissions.query.mockResolvedValue({ state: 'denied' });
            await expect(setupAudioInput()).rejects.toThrow('Microphone access denied');
        });
    });
}); 