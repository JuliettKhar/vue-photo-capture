import { ComputedRef } from 'vue';
import { Ref } from 'vue';
import { ShallowRef } from 'vue';

/** Reactive permission state for the camera. */
export declare type CameraPermission = 'prompt' | 'granted' | 'denied' | 'unknown';

export declare interface CaptureOptions {
    /** Output image mime type, e.g. `'image/png'` (default), `'image/jpeg'`, `'image/webp'`. */
    type?: string;
    /** Quality `0..1` for lossy formats (`image/jpeg` | `image/webp`). Ignored for PNG. */
    quality?: number;
    /** Mirror the frame horizontally (useful for the front/selfie camera). */
    mirror?: boolean;
}

/** A barcode/QR code detected by the native `BarcodeDetector`. */
export declare interface DetectedBarcode {
    rawValue: string;
    format: string;
    boundingBox: DOMRectReadOnly;
    cornerPoints: Array<{
        x: number;
        y: number;
    }>;
}

export declare interface PhotoCaptureOptions {
    /** Stop tracks and reset state automatically when the host component unmounts. Default: `true`. */
    autoCleanup?: boolean;
    /**
     * A template ref to a `<video>` element. When provided, the stream is bound to it
     * automatically (no manual `srcObject`), and it becomes the default capture source.
     */
    videoRef?: Ref<HTMLVideoElement | null | undefined>;
    /** Also request a microphone track — required to record video with sound. Default: `false`. */
    audio?: boolean;
}

export declare interface RecordOptions {
    /** Recording container/codec, e.g. `'video/webm;codecs=vp9'`. Ignored if unsupported. */
    mimeType?: string;
    /** Audio bitrate in bits per second. */
    audioBitsPerSecond?: number;
    /** Video bitrate in bits per second. */
    videoBitsPerSecond?: number;
    /** Emit chunks every `timeslice` ms instead of only at stop. */
    timeslice?: number;
}

export declare type UsePhotoCapture = ReturnType<typeof usePhotoCapture>;

export declare function usePhotoCapture(options?: PhotoCaptureOptions): {
    readonly videoForScreenShot: Ref<HTMLVideoElement | null, HTMLVideoElement | null>;
    readonly screenshotVideoBlob: Ref<{
        readonly size: number;
        readonly type: string;
        arrayBuffer: () => Promise<ArrayBuffer>;
        bytes: () => Promise<Uint8Array<ArrayBuffer>>;
        slice: (start?: number, end?: number, contentType?: string) => Blob;
        stream: () => ReadableStream<Uint8Array<ArrayBuffer>>;
        text: () => Promise<string>;
    } | null, Blob | {
        readonly size: number;
        readonly type: string;
        arrayBuffer: () => Promise<ArrayBuffer>;
        bytes: () => Promise<Uint8Array<ArrayBuffer>>;
        slice: (start?: number, end?: number, contentType?: string) => Blob;
        stream: () => ReadableStream<Uint8Array<ArrayBuffer>>;
        text: () => Promise<string>;
    } | null>;
    readonly videoStream: ShallowRef<MediaStream | null, MediaStream | null>;
    readonly isSupported: boolean;
    readonly isActive: Ref<boolean, boolean>;
    readonly error: ShallowRef<Error | null, Error | null>;
    readonly permission: Ref<CameraPermission, CameraPermission>;
    readonly setUpVideoForScreenshot: (videoOptions?: MediaStreamConstraints["video"]) => Promise<void>;
    readonly capturePhoto: (videoElem?: HTMLVideoElement | null, captureOptions?: CaptureOptions) => Promise<Blob>;
    readonly stop: () => void;
    readonly isImageCaptureSupported: boolean;
    readonly takePhoto: (captureOptions?: CaptureOptions) => Promise<Blob>;
    readonly grabFrame: () => Promise<ImageBitmap>;
    readonly devices: Ref<{
        readonly deviceId: string;
        readonly groupId: string;
        readonly kind: MediaDeviceKind;
        readonly label: string;
        toJSON: () => any;
    }[], MediaDeviceInfo[] | {
        readonly deviceId: string;
        readonly groupId: string;
        readonly kind: MediaDeviceKind;
        readonly label: string;
        toJSON: () => any;
    }[]>;
    readonly currentDeviceId: Ref<string | null, string | null>;
    readonly isFrontCamera: Ref<boolean, boolean>;
    readonly refreshDevices: () => Promise<MediaDeviceInfo[]>;
    readonly switchCamera: (deviceId?: string) => Promise<void>;
    readonly resolution: Ref<{
        width: number;
        height: number;
    } | null, {
        width: number;
        height: number;
    } | {
        width: number;
        height: number;
    } | null>;
    readonly aspectRatio: Ref<number | null, number | null>;
    readonly mirrorStyle: ComputedRef<    {
    transform: string;
    }>;
    readonly toObjectURL: (blob?: Blob | null) => string;
    readonly toDataURL: (blob?: Blob | null) => Promise<string>;
    readonly toFile: (name?: string, blob?: Blob | null) => File;
    readonly canTorch: Ref<boolean, boolean>;
    readonly canZoom: Ref<boolean, boolean>;
    readonly zoomRange: Ref<{
        min: number;
        max: number;
        step: number;
    } | null, ZoomRange | {
        min: number;
        max: number;
        step: number;
    } | null>;
    readonly torchOn: Ref<boolean, boolean>;
    readonly zoom: Ref<number, number>;
    readonly setTorch: (on: boolean) => Promise<void>;
    readonly setZoom: (value: number) => Promise<void>;
    readonly isRecordingSupported: boolean;
    readonly isRecording: Ref<boolean, boolean>;
    readonly recordedBlob: Ref<{
        readonly size: number;
        readonly type: string;
        arrayBuffer: () => Promise<ArrayBuffer>;
        bytes: () => Promise<Uint8Array<ArrayBuffer>>;
        slice: (start?: number, end?: number, contentType?: string) => Blob;
        stream: () => ReadableStream<Uint8Array<ArrayBuffer>>;
        text: () => Promise<string>;
    } | null, Blob | {
        readonly size: number;
        readonly type: string;
        arrayBuffer: () => Promise<ArrayBuffer>;
        bytes: () => Promise<Uint8Array<ArrayBuffer>>;
        slice: (start?: number, end?: number, contentType?: string) => Blob;
        stream: () => ReadableStream<Uint8Array<ArrayBuffer>>;
        text: () => Promise<string>;
    } | null>;
    readonly startRecording: (recordOptions?: RecordOptions) => void;
    readonly stopRecording: () => Promise<Blob>;
    readonly pauseRecording: () => void;
    readonly resumeRecording: () => void;
    readonly isBarcodeSupported: boolean;
    readonly detectedCodes: Ref<{
        rawValue: string;
        format: string;
        boundingBox: {
            readonly bottom: number;
            readonly height: number;
            readonly left: number;
            readonly right: number;
            readonly top: number;
            readonly width: number;
            readonly x: number;
            readonly y: number;
            toJSON: () => any;
        };
        cornerPoints: {
            x: number;
            y: number;
        }[];
    }[], DetectedBarcode[] | {
        rawValue: string;
        format: string;
        boundingBox: {
            readonly bottom: number;
            readonly height: number;
            readonly left: number;
            readonly right: number;
            readonly top: number;
            readonly width: number;
            readonly x: number;
            readonly y: number;
            toJSON: () => any;
        };
        cornerPoints: {
            x: number;
            y: number;
        }[];
    }[]>;
    readonly scan: (source?: CanvasImageSource | null) => Promise<DetectedBarcode[]>;
    readonly startScanning: (onDetect?: (codes: DetectedBarcode[]) => void) => void;
    readonly stopScanning: () => void;
};

/** Supported/allowed zoom range reported by the active camera track. */
export declare interface ZoomRange {
    min: number;
    max: number;
    step: number;
}

export { }
