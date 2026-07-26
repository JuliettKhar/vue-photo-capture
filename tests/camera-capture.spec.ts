import {flushPromises, mount} from '@vue/test-utils';
import {h} from 'vue';
import {CameraCapture} from '../src';

const makeCameraStream = () => ({
    getVideoTracks: () => [{getSettings: () => ({width: 1280, height: 720}), stop: jest.fn()}],
    getTracks: () => [{stop: jest.fn()}],
});

describe('CameraCapture', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // jsdom doesn't implement HTMLMediaElement.play(); stub it to silence the noise.
        jest.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
        if (!navigator.mediaDevices) {
            Object.defineProperty(navigator, 'mediaDevices', {
                configurable: true,
                writable: true,
                value: {getUserMedia: jest.fn(), enumerateDevices: jest.fn().mockResolvedValue([])},
            });
        }
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('renders a video element', () => {
        jest.spyOn(navigator.mediaDevices, 'getUserMedia').mockResolvedValue(makeCameraStream() as any);
        const wrapper = mount(CameraCapture, {props: {autoStart: false}});
        expect(wrapper.find('video').exists()).toBe(true);
        wrapper.unmount();
    });

    it('starts the camera on mount when autoStart is true', async () => {
        const gum = jest.spyOn(navigator.mediaDevices, 'getUserMedia')
            .mockResolvedValue(makeCameraStream() as any);
        const wrapper = mount(CameraCapture, {props: {facingMode: 'environment'}});
        await flushPromises();
        expect(gum).toHaveBeenCalledWith({video: {facingMode: 'environment'}, audio: false});
        wrapper.unmount();
    });

    it('does not start the camera when autoStart is false', async () => {
        const gum = jest.spyOn(navigator.mediaDevices, 'getUserMedia')
            .mockResolvedValue(makeCameraStream() as any);
        const wrapper = mount(CameraCapture, {props: {autoStart: false}});
        await flushPromises();
        expect(gum).not.toHaveBeenCalled();
        wrapper.unmount();
    });

    it('emits "error" when the camera fails to start', async () => {
        jest.spyOn(navigator.mediaDevices, 'getUserMedia').mockRejectedValue(new Error('boom'));
        const wrapper = mount(CameraCapture);
        await flushPromises();
        expect(wrapper.emitted('error')).toBeTruthy();
        expect((wrapper.emitted('error')![0][0] as Error).message).toBe('boom');
        wrapper.unmount();
    });

    it('emits "capture" with the blob from takePhoto()', async () => {
        const photoBlob = new Blob(['x'], {type: 'image/jpeg'});
        const orig = (window as any).ImageCapture;
        (window as any).ImageCapture = jest.fn().mockImplementation(() => ({
            takePhoto: jest.fn().mockResolvedValue(photoBlob),
            grabFrame: jest.fn(),
        }));
        try {
            jest.spyOn(navigator.mediaDevices, 'getUserMedia').mockResolvedValue(makeCameraStream() as any);
            const wrapper = mount(CameraCapture);
            await flushPromises();

            await (wrapper.vm as any).capture();

            expect(wrapper.emitted('capture')).toBeTruthy();
            expect(wrapper.emitted('capture')![0][0]).toBe(photoBlob);
            wrapper.unmount();
        } finally {
            delete (window as any).ImageCapture;
            if (orig !== undefined) (window as any).ImageCapture = orig;
        }
    });

    it('renders a custom controls slot with the capture scope', async () => {
        jest.spyOn(navigator.mediaDevices, 'getUserMedia').mockResolvedValue(makeCameraStream() as any);
        const wrapper = mount(CameraCapture, {
            props: {autoStart: false},
            slots: {
                controls: (scope: any) => h('button', {class: 'my-shot', onClick: scope.capture}, 'Shoot'),
            },
        });
        expect(wrapper.find('button.my-shot').exists()).toBe(true);
        // the default controls should be replaced
        expect(wrapper.text()).toContain('Shoot');
        wrapper.unmount();
    });
});
