import {ref, nextTick} from 'vue';
import {usePhotoCapture} from '../src';

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
        expect(mockCanvas.getContext().drawImage).toHaveBeenCalledWith(mockVideo, 0, 0, 1280, 720);
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
        expect(mockCanvas.getContext().drawImage).toHaveBeenCalledWith(videoElem, 0, 0, 640, 480);
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
    });

    describe('barcode scanning', () => {
        it('scan rejects when BarcodeDetector is unavailable', async () => {
            const {scan, isBarcodeSupported} = usePhotoCapture();
            expect(isBarcodeSupported).toBe(false);
            await expect(scan()).rejects.toThrow('BarcodeDetector is not supported');
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
