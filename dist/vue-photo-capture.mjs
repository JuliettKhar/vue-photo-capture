import { computed as e, getCurrentInstance as t, onUnmounted as n, ref as r, shallowRef as i, watch as a } from "vue";
//#region src/index.ts
var o = {
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
function s(s = {}) {
	let { autoCleanup: c = !0 } = s, l = typeof navigator < "u" && !!navigator.mediaDevices?.getUserMedia, u = typeof window < "u" && "BarcodeDetector" in window, d = typeof window < "u" && "ImageCapture" in window, f = typeof window < "u" && "MediaRecorder" in window, p = r(null), m = r(null), h = i(null), g = r(!1), _ = i(null), v = r("unknown"), y = r([]), b = r(null), x = r(!1), S = r(null), C = r(null), w = e(() => ({ transform: x.value ? "scaleX(-1)" : "none" })), T = r(!1), E = r(!1), D = r(null), O = r(!1), k = r(1), A = r([]), j = r(!1), M = r(null), N = null, P = null, F = null, I = !1, L = null, R = null, z = [], B = () => h.value?.getVideoTracks()[0] ?? null, V = () => s.videoRef?.value ?? p.value, H = () => {
		U();
	}, U = async () => {
		if (!l || !navigator.mediaDevices?.enumerateDevices) return [];
		let e = await navigator.mediaDevices.enumerateDevices();
		return y.value = e.filter((e) => e.kind === "videoinput"), y.value;
	};
	s.videoRef && a([h, s.videoRef], async () => {
		let e = s.videoRef?.value;
		if (e && (e.srcObject !== h.value && (e.srcObject = h.value), h.value)) try {
			await e.play();
		} catch {}
	}, { flush: "post" });
	let W = async (e = o) => {
		if (_.value = null, !l) {
			let e = /* @__PURE__ */ Error("getUserMedia is not supported in this environment");
			throw _.value = e, e;
		}
		let t = s.audio ?? !1;
		try {
			let n;
			try {
				n = await navigator.mediaDevices.getUserMedia({
					video: e,
					audio: t
				});
			} catch (e) {
				if (e?.name === "OverconstrainedError") n = await navigator.mediaDevices.getUserMedia({
					video: !0,
					audio: t
				});
				else throw e;
			}
			let r = n.getVideoTracks()[0], i = r.getSettings(), a = document.createElement("video");
			a.setAttribute("autoplay", "true"), a.setAttribute("playsinline", "true"), a.setAttribute("width", String(i.width || 1280)), a.setAttribute("height", String(i.height || 1280)), a.srcObject = n, p.value = a, h.value = n, g.value = !0, v.value = "granted", L = null, S.value = i.width && i.height ? {
				width: i.width,
				height: i.height
			} : null, C.value = S.value ? S.value.width / S.value.height : i.aspectRatio ?? null, b.value = i.deviceId ?? null, x.value = i.facingMode === "user";
			let o = r.getCapabilities?.() ?? {};
			T.value = !!o.torch, E.value = !!o.zoom, D.value = o.zoom ? {
				min: o.zoom.min,
				max: o.zoom.max,
				step: o.zoom.step ?? .1
			} : null, O.value = !1, k.value = i.zoom ?? 1, await U(), !I && navigator.mediaDevices.addEventListener && (navigator.mediaDevices.addEventListener("devicechange", H), I = !0);
		} catch (e) {
			let t = e instanceof Error ? e : Error(String(e), { cause: e });
			throw (t.name === "NotAllowedError" || t.name === "SecurityError") && (v.value = "denied"), _.value = t, g.value = !1, t;
		}
	}, G = async (e) => {
		let t = x.value;
		$(), await W(e ? { deviceId: { exact: e } } : { facingMode: t ? "environment" : "user" });
	}, K = (e = V(), t = {}) => new Promise((n, r) => {
		let i = (e) => {
			let t = Error(e);
			_.value = t, r(t);
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
			m.value = e, n(e);
		}, t.type, t.quality);
	}), q = () => {
		let e = B();
		if (!e) throw Error("Camera is not active");
		return L ??= new window.ImageCapture(e), L;
	}, J = async (e = {}) => {
		if (d && B()) try {
			let e = await q().takePhoto();
			return m.value = e, e;
		} catch {}
		return K(V(), e);
	}, Y = async () => {
		if (!d) throw Error("ImageCapture is not supported in this browser");
		return q().grabFrame();
	}, X = (e = m.value) => {
		if (!e) throw Error("No photo has been captured yet");
		return N && URL.revokeObjectURL(N), N = URL.createObjectURL(e), N;
	}, ee = (e = m.value) => new Promise((t, n) => {
		if (!e) {
			n(/* @__PURE__ */ Error("No photo has been captured yet"));
			return;
		}
		let r = new FileReader();
		r.onload = () => t(r.result), r.onerror = () => n(r.error ?? /* @__PURE__ */ Error("Failed to read the photo blob")), r.readAsDataURL(e);
	}), te = (e = "photo.png", t = m.value) => {
		if (!t) throw Error("No photo has been captured yet");
		return new File([t], e, { type: t.type || "image/png" });
	}, ne = async (e) => {
		let t = B();
		if (!t) throw Error("Camera is not active");
		if (!T.value) throw Error("Torch is not supported by this camera");
		await t.applyConstraints({ advanced: [{ torch: e }] }), O.value = e;
	}, re = async (e) => {
		let t = B();
		if (!t) throw Error("Camera is not active");
		if (!E.value) throw Error("Zoom is not supported by this camera");
		await t.applyConstraints({ advanced: [{ zoom: e }] }), k.value = e;
	}, ie = (e = {}) => {
		if (!f) throw Error("MediaRecorder is not supported in this browser");
		if (!h.value) throw Error("Camera is not active");
		if (j.value) return;
		let t = e.mimeType && MediaRecorder.isTypeSupported(e.mimeType) ? e.mimeType : void 0;
		z = [];
		let n = new MediaRecorder(h.value, {
			...t ? { mimeType: t } : {},
			...e.audioBitsPerSecond ? { audioBitsPerSecond: e.audioBitsPerSecond } : {},
			...e.videoBitsPerSecond ? { videoBitsPerSecond: e.videoBitsPerSecond } : {}
		});
		n.ondataavailable = (e) => {
			e.data && e.data.size > 0 && z.push(e.data);
		}, R = n, n.start(e.timeslice), j.value = !0;
	}, ae = () => new Promise((e, t) => {
		let n = R;
		if (!n || n.state === "inactive") {
			t(/* @__PURE__ */ Error("Not recording"));
			return;
		}
		n.onstop = () => {
			let t = n.mimeType || z[0]?.type || "video/webm", r = new Blob(z, { type: t });
			M.value = r, j.value = !1, R = null, e(r);
		}, n.stop();
	}), oe = () => {
		R?.state === "recording" && R.pause();
	}, se = () => {
		R?.state === "paused" && R.resume();
	}, Z = async (e = V()) => {
		if (!u) throw Error("BarcodeDetector is not supported in this browser");
		if (!e) return [];
		P ??= new window.BarcodeDetector();
		let t = await P.detect(e);
		return A.value = t, t;
	}, ce = (e) => {
		if (!u) throw Error("BarcodeDetector is not supported in this browser");
		let t = async () => {
			try {
				let t = await Z();
				t.length && e && e(t);
			} catch {}
			F = requestAnimationFrame(t);
		};
		t();
	}, Q = () => {
		F !== null && (cancelAnimationFrame(F), F = null);
	}, $ = () => {
		if (Q(), R && R.state !== "inactive") try {
			R.stop();
		} catch {}
		R = null, j.value = !1, L = null, h.value?.getTracks().forEach((e) => e.stop()), p.value && (p.value.srcObject = null), s.videoRef?.value && (s.videoRef.value.srcObject = null), N &&= (URL.revokeObjectURL(N), null), I && navigator.mediaDevices?.removeEventListener && (navigator.mediaDevices.removeEventListener("devicechange", H), I = !1), h.value = null, p.value = null, g.value = !1, T.value = !1, E.value = !1, D.value = null, O.value = !1, S.value = null, C.value = null;
	};
	return c && t() && n($), {
		videoForScreenShot: p,
		screenshotVideoBlob: m,
		videoStream: h,
		isSupported: l,
		isActive: g,
		error: _,
		permission: v,
		setUpVideoForScreenshot: W,
		capturePhoto: K,
		stop: $,
		isImageCaptureSupported: d,
		takePhoto: J,
		grabFrame: Y,
		devices: y,
		currentDeviceId: b,
		isFrontCamera: x,
		refreshDevices: U,
		switchCamera: G,
		resolution: S,
		aspectRatio: C,
		mirrorStyle: w,
		toObjectURL: X,
		toDataURL: ee,
		toFile: te,
		canTorch: T,
		canZoom: E,
		zoomRange: D,
		torchOn: O,
		zoom: k,
		setTorch: ne,
		setZoom: re,
		isRecordingSupported: f,
		isRecording: j,
		recordedBlob: M,
		startRecording: ie,
		stopRecording: ae,
		pauseRecording: oe,
		resumeRecording: se,
		isBarcodeSupported: u,
		detectedCodes: A,
		scan: Z,
		startScanning: ce,
		stopScanning: Q
	};
}
//#endregion
export { s as usePhotoCapture };
