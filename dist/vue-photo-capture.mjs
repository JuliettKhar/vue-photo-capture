import { ref as r } from "vue";
function d() {
  const t = r(null), i = r(null), n = r(null), c = {
    width: { max: 1280, ideal: 1280 },
    height: { min: 400, ideal: 1080 },
    facingMode: "user",
    frameRate: { min: 15, ideal: 24, max: 30 },
    aspectRatio: { ideal: 1.7777777778 }
  };
  return {
    videoForScreenShot: t,
    screenshotVideoBlob: i,
    videoStream: n,
    setUpVideoForScreenshot: async (o = c) => {
      try {
        const e = await navigator.mediaDevices.getUserMedia({ video: o }), { width: s, height: a } = e.getVideoTracks()[0].getSettings();
        t.value = document.createElement("video"), t.value.setAttribute("autoplay", "true"), t.value.setAttribute("playsinline", "true"), t.value.setAttribute("width", String(s || 1280)), t.value.setAttribute("height", String(a || 1280)), t.value.srcObject = e, n.value = e;
      } catch (e) {
        throw new Error(e?.message || e.toString(), { cause: e });
      }
    },
    capturePhoto: (o = t.value) => {
      if (o) {
        const e = document.createElement("canvas");
        e.width = o.width, e.height = o.height, e.getContext("2d")?.drawImage(o, 0, 0, e.width, e.height), e.toBlob((a) => {
          i.value = a;
        });
      } else
        throw new Error("The video element can not be null");
    }
  };
}
export {
  d as usePhotoCapture
};
