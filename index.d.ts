import { Ref } from 'vue';

export declare function usePhotoCapture(): {
  videoForScreenShot: Ref<HTMLVideoElement | null>;
  screenshotVideoBlob: Ref<Blob | null>;
  setUpVideoForScreenshot: (videoOptions?: {
    width: { max: number; ideal: number };
    height: { max: number; ideal: number };
    facingMode: { exact: string };
  }) => Promise<void>;
  capturePhoto: (video?: HTMLVideoElement) => void;
};