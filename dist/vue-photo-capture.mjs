import { getCurrentInstance as e, onUnmounted as t, ref as n, shallowRef as r, watch as i } from "vue";
//#region src/index.ts
var a = {
	width: {
		max: 1280,
		ideal: 1280
	},
	height: {
		min: 400,
		ideal: 1080
	},
	facingMode: "user",
	frameRate: {
		min: 15,
		ideal: 24,
		max: 30
	},
	aspectRatio: { ideal: 16 / 9 }
};
function o(o = {}) {
	let { autoCleanup: s = !0 } = o, c = typeof navigator < "u" && !!navigator.mediaDevices?.getUserMedia, l = typeof window < "u" && "BarcodeDetector" in window, u = typeof window < "u" && "ImageCapture" in window, d = typeof window < "u" && "MediaRecorder" in window, f = n(null), p = n(null), m = r(null), h = n(!1), g = r(null), _ = n("unknown"), v = n([]), y = n(null), b = n(!1), x = n(!1), S = n(!1), C = n(null), w = n(!1), T = n(1), E = n([]), D = n(!1), O = n(null), k = null, A = null, j = null, M = !1, N = null, P = null, F = [], I = () => m.value?.getVideoTracks()[0] ?? null, L = () => o.videoRef?.value ?? f.value, R = () => {
		z();
	}, z = async () => {
		if (!c || !navigator.mediaDevices?.enumerateDevices) return [];
		let e = await navigator.mediaDevices.enumerateDevices();
		return v.value = e.filter((e) => e.kind === "videoinput"), v.value;
	};
	o.videoRef && i([m, o.videoRef], async () => {
		let e = o.videoRef?.value;
		if (e && (e.srcObject !== m.value && (e.srcObject = m.value), m.value)) try {
			await e.play();
		} catch {}
	}, { flush: "post" });
	let B = async (e = a) => {
		if (g.value = null, !c) {
			let e = /* @__PURE__ */ Error("getUserMedia is not supported in this environment");
			throw g.value = e, e;
		}
		try {
			let t = await navigator.mediaDevices.getUserMedia({
				video: e,
				audio: o.audio ?? !1
			}), n = t.getVideoTracks()[0], r = n.getSettings(), i = document.createElement("video");
			i.setAttribute("autoplay", "true"), i.setAttribute("playsinline", "true"), i.setAttribute("width", String(r.width || 1280)), i.setAttribute("height", String(r.height || 1280)), i.srcObject = t, f.value = i, m.value = t, h.value = !0, _.value = "granted", N = null, y.value = r.deviceId ?? null, b.value = r.facingMode === "user";
			let a = n.getCapabilities?.() ?? {};
			x.value = !!a.torch, S.value = !!a.zoom, C.value = a.zoom ? {
				min: a.zoom.min,
				max: a.zoom.max,
				step: a.zoom.step ?? .1
			} : null, w.value = !1, T.value = r.zoom ?? 1, await z(), !M && navigator.mediaDevices.addEventListener && (navigator.mediaDevices.addEventListener("devicechange", R), M = !0);
		} catch (e) {
			let t = e instanceof Error ? e : Error(String(e), { cause: e });
			throw (t.name === "NotAllowedError" || t.name === "SecurityError") && (_.value = "denied"), g.value = t, h.value = !1, t;
		}
	}, V = async (e) => {
		let t = b.value;
		$(), await B(e ? { deviceId: { exact: e } } : { facingMode: t ? "environment" : "user" });
	}, H = (e = L(), t = {}) => new Promise((n, r) => {
		let i = (e) => {
			let t = Error(e);
			g.value = t, r(t);
		};
		if (!e) {
			i("The video element can not be null");
			return;
		}
		let a = e.width || e.videoWidth, o = e.height || e.videoHeight;
		if (!a || !o) {
			i("Video has no dimensions yet — is the camera stream playing?");
			return;
		}
		let s = document.createElement("canvas");
		s.width = a, s.height = o;
		let c = s.getContext("2d");
		if (!c) {
			i("Unable to get a 2D canvas context");
			return;
		}
		t.mirror && (c.translate(s.width, 0), c.scale(-1, 1)), c.drawImage(e, 0, 0, s.width, s.height), s.toBlob((e) => {
			if (!e) {
				i("Failed to capture photo: the canvas produced an empty blob");
				return;
			}
			p.value = e, n(e);
		}, t.type, t.quality);
	}), U = () => {
		let e = I();
		if (!e) throw Error("Camera is not active");
		return N ??= new window.ImageCapture(e), N;
	}, W = async (e = {}) => {
		if (u && I()) try {
			let e = await U().takePhoto();
			return p.value = e, e;
		} catch {}
		return H(L(), e);
	}, G = async () => {
		if (!u) throw Error("ImageCapture is not supported in this browser");
		return U().grabFrame();
	}, K = (e = p.value) => {
		if (!e) throw Error("No photo has been captured yet");
		return k && URL.revokeObjectURL(k), k = URL.createObjectURL(e), k;
	}, q = (e = p.value) => new Promise((t, n) => {
		if (!e) {
			n(/* @__PURE__ */ Error("No photo has been captured yet"));
			return;
		}
		let r = new FileReader();
		r.onload = () => t(r.result), r.onerror = () => n(r.error ?? /* @__PURE__ */ Error("Failed to read the photo blob")), r.readAsDataURL(e);
	}), J = (e = "photo.png", t = p.value) => {
		if (!t) throw Error("No photo has been captured yet");
		return new File([t], e, { type: t.type || "image/png" });
	}, Y = async (e) => {
		let t = I();
		if (!t) throw Error("Camera is not active");
		if (!x.value) throw Error("Torch is not supported by this camera");
		await t.applyConstraints({ advanced: [{ torch: e }] }), w.value = e;
	}, X = async (e) => {
		let t = I();
		if (!t) throw Error("Camera is not active");
		if (!S.value) throw Error("Zoom is not supported by this camera");
		await t.applyConstraints({ advanced: [{ zoom: e }] }), T.value = e;
	}, ee = (e = {}) => {
		if (!d) throw Error("MediaRecorder is not supported in this browser");
		if (!m.value) throw Error("Camera is not active");
		if (D.value) return;
		let t = e.mimeType && MediaRecorder.isTypeSupported(e.mimeType) ? e.mimeType : void 0;
		F = [];
		let n = new MediaRecorder(m.value, {
			...t ? { mimeType: t } : {},
			...e.audioBitsPerSecond ? { audioBitsPerSecond: e.audioBitsPerSecond } : {},
			...e.videoBitsPerSecond ? { videoBitsPerSecond: e.videoBitsPerSecond } : {}
		});
		n.ondataavailable = (e) => {
			e.data && e.data.size > 0 && F.push(e.data);
		}, P = n, n.start(e.timeslice), D.value = !0;
	}, te = () => new Promise((e, t) => {
		let n = P;
		if (!n || n.state === "inactive") {
			t(/* @__PURE__ */ Error("Not recording"));
			return;
		}
		n.onstop = () => {
			let t = n.mimeType || F[0]?.type || "video/webm", r = new Blob(F, { type: t });
			O.value = r, D.value = !1, P = null, e(r);
		}, n.stop();
	}), ne = () => {
		P?.state === "recording" && P.pause();
	}, re = () => {
		P?.state === "paused" && P.resume();
	}, Z = async (e = L()) => {
		if (!l) throw Error("BarcodeDetector is not supported in this browser");
		if (!e) return [];
		A ??= new window.BarcodeDetector();
		let t = await A.detect(e);
		return E.value = t, t;
	}, ie = (e) => {
		if (!l) throw Error("BarcodeDetector is not supported in this browser");
		let t = async () => {
			try {
				let t = await Z();
				t.length && e && e(t);
			} catch {}
			j = requestAnimationFrame(t);
		};
		t();
	}, Q = () => {
		j !== null && (cancelAnimationFrame(j), j = null);
	}, $ = () => {
		if (Q(), P && P.state !== "inactive") try {
			P.stop();
		} catch {}
		P = null, D.value = !1, N = null, m.value?.getTracks().forEach((e) => e.stop()), f.value && (f.value.srcObject = null), o.videoRef?.value && (o.videoRef.value.srcObject = null), k &&= (URL.revokeObjectURL(k), null), M && navigator.mediaDevices?.removeEventListener && (navigator.mediaDevices.removeEventListener("devicechange", R), M = !1), m.value = null, f.value = null, h.value = !1, x.value = !1, S.value = !1, C.value = null, w.value = !1;
	};
	return s && e() && t($), {
		videoForScreenShot: f,
		screenshotVideoBlob: p,
		videoStream: m,
		isSupported: c,
		isActive: h,
		error: g,
		permission: _,
		setUpVideoForScreenshot: B,
		capturePhoto: H,
		stop: $,
		isImageCaptureSupported: u,
		takePhoto: W,
		grabFrame: G,
		devices: v,
		currentDeviceId: y,
		isFrontCamera: b,
		refreshDevices: z,
		switchCamera: V,
		toObjectURL: K,
		toDataURL: q,
		toFile: J,
		canTorch: x,
		canZoom: S,
		zoomRange: C,
		torchOn: w,
		zoom: T,
		setTorch: Y,
		setZoom: X,
		isRecordingSupported: d,
		isRecording: D,
		recordedBlob: O,
		startRecording: ee,
		stopRecording: te,
		pauseRecording: ne,
		resumeRecording: re,
		isBarcodeSupported: l,
		detectedCodes: E,
		scan: Z,
		startScanning: ie,
		stopScanning: Q
	};
}
//#endregion
export { o as usePhotoCapture };
