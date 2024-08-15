import {usePhotoCapture} from '../src';

describe('usePhotoCapture', () => {
    beforeEach(() => {
        jest.clearAllMocks();
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

    it('should capture photo and set the blob', () => {
        const mockBlob = new Blob();
        const mockCanvas = {
            width: 1280,
            height: 720,
            getContext: jest.fn().mockReturnValue({
                drawImage: jest.fn(),
            }),
            toBlob: jest.fn((callback) => callback(mockBlob)),
        };
        const mockVideoElem = document.createElement('video');

        jest.spyOn(document, 'createElement').mockImplementation((tag: any) => {
            if (tag === 'canvas') {
                return mockCanvas;
            } else if(tag === 'video') {
                return mockVideoElem;
            }
            return tag;
        });

        const {screenshotVideoBlob, capturePhoto} = usePhotoCapture();
        const mockVideo = document.createElement('video');
        mockVideo.width = 1280;
        mockVideo.height = 720;

        capturePhoto(mockVideo);

        expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
        expect(mockCanvas.getContext().drawImage).toHaveBeenCalledWith(mockVideo, 0, 0, 1280, 720);
        expect(mockCanvas.toBlob).toHaveBeenCalled();
        expect(screenshotVideoBlob.value).toBe(mockBlob);
    });
});
