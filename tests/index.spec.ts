import {ref, nextTick, defineComponent, h} from 'vue';
import {mount} from '@vue/test-utils';
import {usePhotoCapture, editImage} from '../src';

// A minimal MediaStream-like object good enough for setUp/stop/recording.
const makeCameraStream = () => ({
    getVideoTracks: () => [{
        getSettings: () => ({width: 1280, height: 720}),
        stop: jest.fn(),
    }],
    getTracks: () => [{stop: jest.fn()}],
});

describe('usePhotoCapture', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Ensure a mediaDevices object exists so tests can spy on it regardless of order.
        if (!navigator.mediaDevices) {
            Object.defineProperty(navigator, 'mediaDevices', {
                configurable: true,
                writable: true,
                value: {
                    getUserMedia: jest.fn(),
                    enumerateDevices: jest.fn().mockResolvedValue([]),
                },
            });
        }
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should initialize refs to null', () => {
        const {videoForScreenShot, screenshotVideoBlob, videoStream} = usePhotoCapture();
        expect(videoForScreenShot.value).toBeNull();
        expect(screenshotVideoBlob.value).toBeNull();
        expect(videoStream.value).toBeNull();
    });

    it('should set up video for screenshot correctly', async () => {
        const mockStream = {
            getVideoTracks: jest.fn().mockReturnValue([{
                getSettings: jest.fn().mockReturnValue({width: 1280, height: 720}),
            }]),
        };
                Object.defineProperty(window.navigator, 'mediaDevices', {
            configurable: true,
            writable: true,
            value: {
                getUserMedia: jest.fn().mockResolvedValueOnce(mockStream as any),
            },
        });


        jest.spyOn(window.navigator.mediaDevices, 'getUserMedia').mockResolvedValue(mockStream as any);

        const {videoForScreenShot, videoStream, setUpVideoForScreenshot} = usePhotoCapture();

        await setUpVideoForScreenshot();

        expect(global.navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
            video: expect.any(Object),
            audio: false,
        });

        expect(videoForScreenShot.value).not.toBeNull();
        expect(videoForScreenShot.value!.srcObject).toBe(mockStream);
        expect(videoForScreenShot.value!.getAttribute('autoplay')).toBe('true');
        expect(videoForScreenShot.value!.getAttribute('playsinline')).toBe('true');
        expect(videoForScreenShot.value!.getAttribute('width')).toBe('1280');
        expect(videoForScreenShot.value!.getAttribute('height')).toBe('720');

        expect(videoStream.value!.getVideoTracks).toBe(mockStream.getVideoTracks);
    });

    it('should handle errors in setUpVideoForScreenshot', async () => {
        jest.spyOn(global.navigator.mediaDevices, 'getUserMedia').mockRejectedValue(new Error('Test error'));

        const {setUpVideoForScreenshot} = usePhotoCapture();

        await expect(setUpVideoForScreenshot()).rejects.toThrow('Test error');
    });

    it('should mark permission as denied when access is refused', async () => {
        const notAllowed = Object.assign(new Error('Permission denied'), {name: 'NotAllowedError'});
        jest.spyOn(global.navigator.mediaDevices, 'getUserMedia').mockRejectedValue(notAllowed);

        const {setUpVideoForScreenshot, permission, error, isActive} = usePhotoCapture();

        await expect(setUpVideoForScreenshot()).rejects.toThrow('Permission denied');
        expect(permission.value).toBe('denied');
        expect(error.value).toBe(notAllowed);
        expect(isActive.value).toBe(false);
    });

    it('should capture photo, resolve with the blob and set the ref', async () => {
        const mockBlob = new Blob();
        const mockCanvas = {
            width: 1280,
            height: 720,
            getContext: jest.fn().mockReturnValue({
                drawImage: jest.fn(),
            }),
            toBlob: jest.fn((callback) => callback(mockBlob)),
        };

        const mockVideo = document.createElement('video');
        mockVideo.width = 1280;
        mockVideo.height = 720;

        const realCreateElement = document.createElement.bind(document);
        jest.spyOn(document, 'createElement').mockImplementation((tag: any) =>
            tag === 'canvas' ? (mockCanvas as any) : realCreateElement(tag),
        );

        const {screenshotVideoBlob, capturePhoto} = usePhotoCapture();

        await expect(capturePhoto(mockVideo)).resolves.toBe(mockBlob);

        expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
        expect(mockCanvas.getContext().drawImage).toHaveBeenCalledWith(mockVideo, 0, 0, 1280, 720, 0, 0, 1280, 720);
        expect(mockCanvas.toBlob).toHaveBeenCalled();
        expect(screenshotVideoBlob.value).toBe(mockBlob);
    });

    it('should fall back to videoWidth/videoHeight for CSS-sized video elements', async () => {
        const mockBlob = new Blob();
        const mockCanvas = {
            width: 0,
            height: 0,
            getContext: jest.fn().mockReturnValue({drawImage: jest.fn()}),
            toBlob: jest.fn((callback) => callback(mockBlob)),
        };
        const realCreateElement = document.createElement.bind(document);
        jest.spyOn(document, 'createElement').mockImplementation((tag: any) =>
            tag === 'canvas' ? (mockCanvas as any) : realCreateElement(tag),
        );

        // width/height attributes are 0 (CSS-sized), only intrinsic size is known
        const videoElem = {width: 0, height: 0, videoWidth: 640, videoHeight: 480} as any;

        const {capturePhoto} = usePhotoCapture();
        await expect(capturePhoto(videoElem)).resolves.toBe(mockBlob);

        expect(mockCanvas.width).toBe(640);
        expect(mockCanvas.height).toBe(480);
        expect(mockCanvas.getContext().drawImage).toHaveBeenCalledWith(videoElem, 0, 0, 640, 480, 0, 0, 640, 480);
    });

    it('should reject when there is no video element to capture from', async () => {
        const {capturePhoto, error} = usePhotoCapture();

        await expect(capturePhoto(null)).rejects.toThrow('The video element can not be null');
        expect(error.value).not.toBeNull();
    });

    it('stop() should stop every track and reset reactive state', async () => {
        const track = {stop: jest.fn()};
        const mockStream = {
            getVideoTracks: jest.fn().mockReturnValue([{
                getSettings: jest.fn().mockReturnValue({width: 1280, height: 720}),
            }]),
            getTracks: jest.fn().mockReturnValue([track]),
        };
        jest.spyOn(global.navigator.mediaDevices, 'getUserMedia').mockResolvedValue(mockStream as any);

        const {setUpVideoForScreenshot, stop, videoStream, videoForScreenShot, isActive} = usePhotoCapture();

        await setUpVideoForScreenshot();
        expect(isActive.value).toBe(true);

        stop();

        expect(track.stop).toHaveBeenCalledTimes(1);
        expect(videoStream.value).toBeNull();
        expect(videoForScreenShot.value).toBeNull();
        expect(isActive.value).toBe(false);
    });

    describe('output helpers', () => {
        it('toObjectURL creates a URL and revokes the previous one', () => {
            const origCreate = URL.createObjectURL;
            const origRevoke = URL.revokeObjectURL;
            const revoke = jest.fn();
            (URL as any).createObjectURL = jest.fn()
                .mockReturnValueOnce('blob:first')
                .mockReturnValueOnce('blob:second');
            (URL as any).revokeObjectURL = revoke;

            try {
                const {toObjectURL} = usePhotoCapture();

                expect(toObjectURL(new Blob(['a']))).toBe('blob:first');
                expect(toObjectURL(new Blob(['b']))).toBe('blob:second');
                expect(revoke).toHaveBeenCalledWith('blob:first');
            } finally {
                URL.createObjectURL = origCreate;
                URL.revokeObjectURL = origRevoke;
            }
        });

        it('toObjectURL throws when nothing has been captured', () => {
            const {toObjectURL} = usePhotoCapture();
            expect(() => toObjectURL(null)).toThrow('No photo has been captured yet');
        });

        it('toFile wraps the blob in a named File', () => {
            const {toFile} = usePhotoCapture();
            const file = toFile('shot.png', new Blob(['x'], {type: 'image/png'}));
            expect(file).toBeInstanceOf(File);
            expect(file.name).toBe('shot.png');
            expect(file.type).toBe('image/png');
        });

        it('toDataURL reads the blob as a data URL', async () => {
            const {toDataURL} = usePhotoCapture();
            const dataUrl = await toDataURL(new Blob(['hello'], {type: 'text/plain'}));
            expect(dataUrl.startsWith('data:')).toBe(true);
        });
    });

    describe('device switching', () => {
        const makeStream = (facingMode: string) => ({
            getVideoTracks: () => [{
                getSettings: () => ({width: 1280, height: 720, facingMode}),
                stop: jest.fn(),
            }],
            getTracks: () => [{stop: jest.fn()}],
        });

        it('switchCamera flips facingMode and restarts the stream', async () => {
            const gum = jest.spyOn(global.navigator.mediaDevices, 'getUserMedia')
                .mockResolvedValueOnce(makeStream('user') as any)
                .mockResolvedValueOnce(makeStream('environment') as any);

            const {setUpVideoForScreenshot, switchCamera, isFrontCamera} = usePhotoCapture();

            await setUpVideoForScreenshot({facingMode: 'user'});
            expect(isFrontCamera.value).toBe(true);

            await switchCamera();

            expect(gum).toHaveBeenLastCalledWith({video: {facingMode: 'environment'}, audio: false});
            expect(isFrontCamera.value).toBe(false);
        });
    });

    describe('hardware controls', () => {
        it('exposes capabilities and applies torch/zoom constraints', async () => {
            const applyConstraints = jest.fn().mockResolvedValue(undefined);
            const stream = {
                getVideoTracks: () => [{
                    getSettings: () => ({width: 1280, height: 720}),
                    getCapabilities: () => ({torch: true, zoom: {min: 1, max: 5, step: 0.5}}),
                    applyConstraints,
                    stop: jest.fn(),
                }],
                getTracks: () => [{stop: jest.fn()}],
            };
            jest.spyOn(global.navigator.mediaDevices, 'getUserMedia').mockResolvedValue(stream as any);

            const {setUpVideoForScreenshot, setTorch, setZoom, canTorch, canZoom, zoomRange} = usePhotoCapture();

            await setUpVideoForScreenshot();
            expect(canTorch.value).toBe(true);
            expect(canZoom.value).toBe(true);
            expect(zoomRange.value).toEqual({min: 1, max: 5, step: 0.5});

            await setTorch(true);
            expect(applyConstraints).toHaveBeenCalledWith({advanced: [{torch: true}]});

            await setZoom(3);
            expect(applyConstraints).toHaveBeenCalledWith({advanced: [{zoom: 3}]});
        });

        it('setTorch rejects when the camera is not active', async () => {
            const {setTorch} = usePhotoCapture();
            await expect(setTorch(true)).rejects.toThrow('Camera is not active');
        });

        it('exposes advanced capabilities and applies focus/exposure/white-balance', async () => {
            const applyConstraints = jest.fn().mockResolvedValue(undefined);
            const stream = {
                getVideoTracks: () => [{
                    getSettings: () => ({width: 1280, height: 720}),
                    getCapabilities: () => ({
                        focusDistance: {min: 0, max: 10, step: 0.1},
                        exposureCompensation: {min: -3, max: 3, step: 0.5},
                        colorTemperature: {min: 2800, max: 6500, step: 100},
                    }),
                    applyConstraints,
                    stop: jest.fn(),
                }],
                getTracks: () => [{stop: jest.fn()}],
            };
            jest.spyOn(global.navigator.mediaDevices, 'getUserMedia').mockResolvedValue(stream as any);

            const cam = usePhotoCapture();
            await cam.setUpVideoForScreenshot();

            expect(cam.canFocus.value).toBe(true);
            expect(cam.focusRange.value).toEqual({min: 0, max: 10, step: 0.1});
            expect(cam.canExposure.value).toBe(true);
            expect(cam.canWhiteBalance.value).toBe(true);
            expect(cam.colorTemperatureRange.value).toEqual({min: 2800, max: 6500, step: 100});

            await cam.setFocusDistance(5);
            expect(applyConstraints).toHaveBeenCalledWith({advanced: [{focusMode: 'manual', focusDistance: 5}]});

            await cam.focusAt(0.5, 0.5);
            expect(applyConstraints).toHaveBeenCalledWith({advanced: [{focusMode: 'single-shot', pointsOfInterest: [{x: 0.5, y: 0.5}]}]});

            await cam.setExposureCompensation(1.5);
            expect(applyConstraints).toHaveBeenCalledWith({advanced: [{exposureMode: 'manual', exposureCompensation: 1.5}]});

            await cam.setColorTemperature(5000);
            expect(applyConstraints).toHaveBeenCalledWith({advanced: [{whiteBalanceMode: 'manual', colorTemperature: 5000}]});
        });

        it('advanced setters reject when the capability is unsupported', async () => {
            jest.spyOn(global.navigator.mediaDevices, 'getUserMedia')
                .mockResolvedValue(makeCameraStream() as any); // no getCapabilities → nothing supported

            const cam = usePhotoCapture();
            await cam.setUpVideoForScreenshot();

            expect(cam.canFocus.value).toBe(false);
            await expect(cam.setFocusDistance(1)).rejects.toThrow('Manual focus is not supported');
            await expect(cam.setExposureCompensation(1)).rejects.toThrow('Exposure is not supported');
            await expect(cam.setColorTemperature(4000)).rejects.toThrow('White balance is not supported');
        });
    });

    describe('crop / resize / editImage', () => {
        const mockCanvasFactory = (blob: Blob) => {
            const ctx = {drawImage: jest.fn(), translate: jest.fn(), scale: jest.fn()};
            const canvas = {width: 0, height: 0, getContext: () => ctx, toBlob: (cb: any) => cb(blob)};
            return {canvas, ctx};
        };

        it('capturePhoto crops and downscales the frame', async () => {
            const outBlob = new Blob();
            const {canvas, ctx} = mockCanvasFactory(outBlob);
            const realCreateElement = document.createElement.bind(document);
            jest.spyOn(document, 'createElement').mockImplementation((tag: any) =>
                tag === 'canvas' ? (canvas as any) : realCreateElement(tag),
            );

            const videoElem = {width: 0, height: 0, videoWidth: 1000, videoHeight: 800} as any;
            const {capturePhoto} = usePhotoCapture();

            await capturePhoto(videoElem, {crop: {x: 100, y: 50, width: 400, height: 300}, maxWidth: 200});

            // 400×300 fit within maxWidth 200 → scale 0.5 → 200×150
            expect(canvas.width).toBe(200);
            expect(canvas.height).toBe(150);
            expect(ctx.drawImage).toHaveBeenCalledWith(videoElem, 100, 50, 400, 300, 0, 0, 200, 150);
        });

        it('editImage applies EXIF orientation, crop and resize', async () => {
            const outBlob = new Blob(['out'], {type: 'image/png'});
            const {canvas, ctx} = mockCanvasFactory(outBlob);
            const realCreateElement = document.createElement.bind(document);
            jest.spyOn(document, 'createElement').mockImplementation((tag: any) =>
                tag === 'canvas' ? (canvas as any) : realCreateElement(tag),
            );
            const bitmap = {width: 1000, height: 800, close: jest.fn()};
            (global as any).createImageBitmap = jest.fn().mockResolvedValue(bitmap);

            try {
                const result = await editImage(new Blob(['in']), {
                    crop: {x: 200, y: 100, width: 600, height: 600},
                    maxHeight: 300,
                });

                expect((global as any).createImageBitmap).toHaveBeenCalledWith(expect.any(Blob), {imageOrientation: 'from-image'});
                // 600×600 fit within maxHeight 300 → 300×300
                expect(canvas.width).toBe(300);
                expect(canvas.height).toBe(300);
                expect(ctx.drawImage).toHaveBeenCalledWith(bitmap, 200, 100, 600, 600, 0, 0, 300, 300);
                expect(bitmap.close).toHaveBeenCalled();
                expect(result).toBe(outBlob);
            } finally {
                delete (global as any).createImageBitmap;
            }
        });

        it('clamps a crop rect to the source bounds', async () => {
            const outBlob = new Blob();
            const {canvas, ctx} = mockCanvasFactory(outBlob);
            const realCreateElement = document.createElement.bind(document);
            jest.spyOn(document, 'createElement').mockImplementation((tag: any) =>
                tag === 'canvas' ? (canvas as any) : realCreateElement(tag),
            );

            const videoElem = {width: 0, height: 0, videoWidth: 640, videoHeight: 480} as any;
            const {capturePhoto} = usePhotoCapture();

            // crop extends past the right/bottom edges → clamped to 440×280 from (200,200)
            await capturePhoto(videoElem, {crop: {x: 200, y: 200, width: 9999, height: 9999}});

            expect(ctx.drawImage).toHaveBeenCalledWith(videoElem, 200, 200, 440, 280, 0, 0, 440, 280);
        });
    });

    describe('barcode scanning', () => {
        it('scan rejects when BarcodeDetector is unavailable', async () => {
            const {scan, isBarcodeSupported} = usePhotoCapture();
            expect(isBarcodeSupported).toBe(false);
            await expect(scan()).rejects.toThrow('BarcodeDetector is not supported');
        });
    });

    describe('stream info', () => {
        it('exposes resolution, aspectRatio and mirrorStyle', async () => {
            const stream = {
                getVideoTracks: () => [{
                    getSettings: () => ({width: 1280, height: 720, facingMode: 'user'}),
                    stop: jest.fn(),
                }],
                getTracks: () => [{stop: jest.fn()}],
            };
            jest.spyOn(global.navigator.mediaDevices, 'getUserMedia').mockResolvedValue(stream as any);

            const {setUpVideoForScreenshot, resolution, aspectRatio, mirrorStyle, isFrontCamera} =
                usePhotoCapture();

            await setUpVideoForScreenshot({facingMode: 'user'});

            expect(resolution.value).toEqual({width: 1280, height: 720});
            expect(aspectRatio.value).toBeCloseTo(1280 / 720);
            expect(isFrontCamera.value).toBe(true);
            expect(mirrorStyle.value).toEqual({transform: 'scaleX(-1)'});
        });
    });

    describe('OverconstrainedError fallback', () => {
        it('retries with relaxed constraints when the requested ones are unsupported', async () => {
            const overconstrained = Object.assign(new Error('constraints'), {name: 'OverconstrainedError'});
            const gum = jest.spyOn(global.navigator.mediaDevices, 'getUserMedia')
                .mockRejectedValueOnce(overconstrained)
                .mockResolvedValueOnce(makeCameraStream() as any);

            const {setUpVideoForScreenshot, isActive, error} = usePhotoCapture();

            await setUpVideoForScreenshot({width: {exact: 4000}});

            expect(gum).toHaveBeenCalledTimes(2);
            expect(gum).toHaveBeenLastCalledWith({video: true, audio: false});
            expect(isActive.value).toBe(true);
            expect(error.value).toBeNull();
        });

        it('rethrows non-OverconstrainedError errors without retrying', async () => {
            const notAllowed = Object.assign(new Error('denied'), {name: 'NotAllowedError'});
            const gum = jest.spyOn(global.navigator.mediaDevices, 'getUserMedia')
                .mockRejectedValue(notAllowed);

            const {setUpVideoForScreenshot} = usePhotoCapture();

            await expect(setUpVideoForScreenshot()).rejects.toThrow('denied');
            expect(gum).toHaveBeenCalledTimes(1);
        });
    });

    describe('lifecycle cleanup', () => {
        it('stops tracks when the host component unmounts', async () => {
            const track = {stop: jest.fn()};
            const stream = {
                getVideoTracks: () => [{getSettings: () => ({width: 1280, height: 720}), stop: jest.fn()}],
                getTracks: () => [track],
            };
            jest.spyOn(global.navigator.mediaDevices, 'getUserMedia').mockResolvedValue(stream as any);

            let api: ReturnType<typeof usePhotoCapture> | undefined;
            const Comp = defineComponent({
                setup() {
                    api = usePhotoCapture();
                    return () => h('div');
                },
            });

            const wrapper = mount(Comp);
            await api!.setUpVideoForScreenshot();
            expect(api!.isActive.value).toBe(true);

            wrapper.unmount();

            expect(track.stop).toHaveBeenCalledTimes(1);
            expect(api!.isActive.value).toBe(false);
        });
    });

    describe('videoRef auto-binding', () => {
        it('binds the stream to the provided <video> ref', async () => {
            const videoEl = document.createElement('video');
            videoEl.play = jest.fn().mockResolvedValue(undefined) as any;
            const videoRef = ref<HTMLVideoElement | null>(videoEl);

            const stream = makeCameraStream();
            jest.spyOn(global.navigator.mediaDevices, 'getUserMedia').mockResolvedValue(stream as any);

            const {setUpVideoForScreenshot} = usePhotoCapture({videoRef});
            await setUpVideoForScreenshot();
            await nextTick();

            expect(videoEl.srcObject).toBe(stream);
            expect(videoEl.play).toHaveBeenCalled();
        });
    });

    describe('ImageCapture (full-resolution stills)', () => {
        it('takePhoto uses ImageCapture and updates the blob', async () => {
            const photoBlob = new Blob(['img'], {type: 'image/jpeg'});
            const takePhotoMock = jest.fn().mockResolvedValue(photoBlob);
            const orig = (window as any).ImageCapture;
            (window as any).ImageCapture = jest.fn().mockImplementation(() => ({
                takePhoto: takePhotoMock,
                grabFrame: jest.fn(),
            }));
            try {
                jest.spyOn(global.navigator.mediaDevices, 'getUserMedia')
                    .mockResolvedValue(makeCameraStream() as any);

                const {setUpVideoForScreenshot, takePhoto, screenshotVideoBlob, isImageCaptureSupported} =
                    usePhotoCapture();
                expect(isImageCaptureSupported).toBe(true);

                await setUpVideoForScreenshot();
                const blob = await takePhoto();

                expect(takePhotoMock).toHaveBeenCalled();
                expect(blob).toBe(photoBlob);
                expect(screenshotVideoBlob.value).toBe(photoBlob);
            } finally {
                delete (window as any).ImageCapture;
                if (orig !== undefined) (window as any).ImageCapture = orig;
            }
        });

        it('takePhoto falls back to canvas capture when ImageCapture is unsupported', async () => {
            const mockBlob = new Blob();
            const mockCanvas = {
                width: 0,
                height: 0,
                getContext: jest.fn().mockReturnValue({drawImage: jest.fn(), translate: jest.fn(), scale: jest.fn()}),
                toBlob: jest.fn((cb) => cb(mockBlob)),
            };
            const realCreateElement = document.createElement.bind(document);
            const createElementSpy = jest.spyOn(document, 'createElement').mockImplementation((tag: any) =>
                tag === 'canvas' ? (mockCanvas as any) : realCreateElement(tag),
            );

            try {
                const videoRef = ref<any>({width: 0, height: 0, videoWidth: 640, videoHeight: 480});
                const {takePhoto, isImageCaptureSupported} = usePhotoCapture({videoRef});

                expect(isImageCaptureSupported).toBe(false);
                await expect(takePhoto()).resolves.toBe(mockBlob);
                expect(mockCanvas.width).toBe(640);
            } finally {
                createElementSpy.mockRestore();
            }
        });
    });

    describe('video recording', () => {
        class FakeRecorder {
            state = 'inactive';
            mimeType = 'video/webm';
            ondataavailable: ((e: any) => void) | null = null;
            onstop: (() => void) | null = null;
            constructor(public stream: any, public opts: any) {}
            start() { this.state = 'recording'; }
            stop() {
                this.state = 'inactive';
                this.ondataavailable?.({data: new Blob(['chunk'], {type: 'video/webm'})});
                this.onstop?.();
            }
            pause() { this.state = 'paused'; }
            resume() { this.state = 'recording'; }
            static isTypeSupported() { return true; }
        }

        it('records and resolves with a blob', async () => {
            const orig = (window as any).MediaRecorder;
            (window as any).MediaRecorder = FakeRecorder as any;
            try {
                jest.spyOn(global.navigator.mediaDevices, 'getUserMedia')
                    .mockResolvedValue(makeCameraStream() as any);

                const {setUpVideoForScreenshot, startRecording, stopRecording, isRecording, recordedBlob, isRecordingSupported} =
                    usePhotoCapture();
                expect(isRecordingSupported).toBe(true);

                await setUpVideoForScreenshot();
                startRecording();
                expect(isRecording.value).toBe(true);

                const blob = await stopRecording();
                expect(blob).toBeInstanceOf(Blob);
                expect(recordedBlob.value).toBe(blob);
                expect(isRecording.value).toBe(false);
            } finally {
                delete (window as any).MediaRecorder;
                if (orig !== undefined) (window as any).MediaRecorder = orig;
            }
        });

        it('startRecording throws when the camera is not active', () => {
            const orig = (window as any).MediaRecorder;
            (window as any).MediaRecorder = FakeRecorder as any;
            try {
                const {startRecording} = usePhotoCapture();
                expect(() => startRecording()).toThrow('Camera is not active');
            } finally {
                delete (window as any).MediaRecorder;
                if (orig !== undefined) (window as any).MediaRecorder = orig;
            }
        });
    });
});
