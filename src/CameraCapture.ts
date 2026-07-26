import { defineComponent, h, ref, computed, onMounted, type PropType } from 'vue';
import { usePhotoCapture } from './index';

/**
 * A drop-in camera component wrapping `usePhotoCapture`. Renders a live `<video>`
 * with default capture/flip controls, and exposes the composable's methods.
 *
 * @example
 * <CameraCapture @capture="onPhoto" @error="onError" facing-mode="environment" />
 */
export const CameraCapture = defineComponent({
    name: 'CameraCapture',
    props: {
        /** Start the camera automatically on mount. Default `true`. */
        autoStart: { type: Boolean, default: true },
        /** Initial camera facing mode. */
        facingMode: { type: String as PropType<'user' | 'environment'>, default: undefined },
        /** Custom `getUserMedia` video constraints (overrides `facingMode`). */
        constraints: {
            type: [Object, Boolean] as PropType<MediaStreamConstraints['video']>,
            default: undefined,
        },
        /** Also request a microphone track (needed to record with sound). */
        audio: { type: Boolean, default: false },
        /** Mirror the preview and capture. Defaults to auto (front camera only). */
        mirror: { type: Boolean, default: undefined },
        /** Captured image mime type. */
        type: { type: String, default: undefined },
        /** Captured image quality `0..1` for lossy formats. */
        quality: { type: Number, default: undefined },
    },
    emits: {
        capture: (blob: Blob) => blob instanceof Blob,
        recorded: (blob: Blob) => blob instanceof Blob,
        error: (err: Error) => err instanceof Error,
        ready: () => true,
        switch: (deviceId?: string) => deviceId === undefined || typeof deviceId === 'string',
    },
    setup(props, { emit, slots, expose }) {
        const videoEl = ref<HTMLVideoElement | null>(null);
        const cam = usePhotoCapture({ videoRef: videoEl, audio: props.audio });
        const ready = ref(false);
        const mirrored = computed(() => props.mirror ?? cam.isFrontCamera.value);

        const fail = (e: unknown) =>
            emit('error', cam.error.value ?? (e instanceof Error ? e : new Error(String(e))));

        const start = async (): Promise<void> => {
            try {
                const constraints =
                    props.constraints ?? (props.facingMode ? { facingMode: props.facingMode } : undefined);
                await cam.setUpVideoForScreenshot(constraints);
            } catch (e) {
                fail(e);
            }
        };

        const capture = async (): Promise<Blob | undefined> => {
            try {
                const blob = await cam.takePhoto({
                    type: props.type,
                    quality: props.quality,
                    mirror: mirrored.value,
                });
                emit('capture', blob);
                return blob;
            } catch (e) {
                fail(e);
            }
        };

        const switchCamera = async (deviceId?: string): Promise<void> => {
            try {
                await cam.switchCamera(deviceId);
                emit('switch', deviceId);
            } catch (e) {
                fail(e);
            }
        };

        const stopRecording = async (): Promise<Blob> => {
            const blob = await cam.stopRecording();
            emit('recorded', blob);
            return blob;
        };

        const onReady = () => {
            if (!ready.value) {
                ready.value = true;
                emit('ready');
            }
        };

        onMounted(() => {
            if (props.autoStart) void start();
        });

        // Public API exposed on the component instance (via a template ref).
        expose({
            start,
            stop: cam.stop,
            capture,
            switchCamera,
            takePhoto: cam.takePhoto,
            grabFrame: cam.grabFrame,
            startRecording: cam.startRecording,
            stopRecording,
            camera: cam,
        });

        // Everything a custom `controls`/`overlay` slot might need.
        const slotScope = () => ({
            capture,
            start,
            stop: cam.stop,
            switchCamera,
            startRecording: cam.startRecording,
            stopRecording,
            isActive: cam.isActive.value,
            isRecording: cam.isRecording.value,
            isFrontCamera: cam.isFrontCamera.value,
            ready: ready.value,
            error: cam.error.value,
            devices: cam.devices.value,
        });

        const defaultControls = () =>
            h('div', { class: 'camera-capture__controls' }, [
                h(
                    'button',
                    {
                        type: 'button',
                        disabled: !cam.isActive.value || !ready.value,
                        onClick: () => void capture(),
                    },
                    'Capture',
                ),
                h(
                    'button',
                    {
                        type: 'button',
                        disabled: !cam.isActive.value,
                        onClick: () => void switchCamera(),
                    },
                    'Flip',
                ),
            ]);

        return () =>
            h('div', { class: 'camera-capture' }, [
                h('div', { class: 'camera-capture__stage', style: { position: 'relative' } }, [
                    h('video', {
                        ref: videoEl,
                        class: 'camera-capture__video',
                        playsinline: true,
                        autoplay: true,
                        muted: true,
                        style: {
                            width: '100%',
                            display: 'block',
                            objectFit: 'cover',
                            transform: mirrored.value ? 'scaleX(-1)' : undefined,
                        },
                        onLoadedmetadata: onReady,
                        onPlaying: onReady,
                    }),
                    slots.overlay?.(slotScope()),
                ]),
                slots.controls ? slots.controls(slotScope()) : defaultControls(),
            ]);
    },
});

export default CameraCapture;
