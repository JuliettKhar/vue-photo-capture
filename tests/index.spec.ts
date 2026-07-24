import {usePhotoCapture} from '../src';

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
});
