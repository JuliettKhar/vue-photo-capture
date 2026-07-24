import { getCurrentInstance as e, onUnmounted as t, ref as n, shallowRef as r } from "vue";
//#region src/index.ts
var i = {
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
function a(a = {}) {
	let { autoCleanup: o = !0 } = a, s = typeof navigator < "u" && !!navigator.mediaDevices?.getUserMedia, c = typeof window < "u" && "BarcodeDetector" in window, l = n(null), u = n(null), d = r(null), f = n(!1), p = r(null), m = n("unknown"), h = n([]), g = n(null), _ = n(!1), v = n(!1), y = n(!1), b = n(null), x = n(!1), S = n(1), C = n([]), w = null, T = null, E = null, D = !1, O = () => d.value?.getVideoTracks()[0] ?? null, k = () => {
		A();
	}, A = async () => {
		if (!s || !navigator.mediaDevices?.enumerateDevices) return [];
		let e = await navigator.mediaDevices.enumerateDevices();
		return h.value = e.filter((e) => e.kind === "videoinput"), h.value;
	}, j = async (e = i) => {
		if (p.value = null, !s) {
			let e = /* @__PURE__ */ Error("getUserMedia is not supported in this environment");
			throw p.value = e, e;
		}
		try {
			let t = await navigator.mediaDevices.getUserMedia({ video: e }), n = t.getVideoTracks()[0], r = n.getSettings(), i = document.createElement("video");
			i.setAttribute("autoplay", "true"), i.setAttribute("playsinline", "true"), i.setAttribute("width", String(r.width || 1280)), i.setAttribute("height", String(r.height || 1280)), i.srcObject = t, l.value = i, d.value = t, f.value = !0, m.value = "granted", g.value = r.deviceId ?? null, _.value = r.facingMode === "user";
			let a = n.getCapabilities?.() ?? {};
			v.value = !!a.torch, y.value = !!a.zoom, b.value = a.zoom ? {
				min: a.zoom.min,
				max: a.zoom.max,
				step: a.zoom.step ?? .1
			} : null, x.value = !1, S.value = r.zoom ?? 1, await A(), !D && navigator.mediaDevices.addEventListener && (navigator.mediaDevices.addEventListener("devicechange", k), D = !0);
		} catch (e) {
			let t = e instanceof Error ? e : Error(String(e), { cause: e });
			throw (t.name === "NotAllowedError" || t.name === "SecurityError") && (m.value = "denied"), p.value = t, f.value = !1, t;
		}
	}, M = async (e) => {
		let t = _.value;
		H(), await j(e ? { deviceId: { exact: e } } : { facingMode: t ? "environment" : "user" });
	}, N = (e = l.value, t = {}) => new Promise((n, r) => {
		let i = (e) => {
			let t = Error(e);
			p.value = t, r(t);
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
			u.value = e, n(e);
		}, t.type, t.quality);
	}), P = (e = u.value) => {
		if (!e) throw Error("No photo has been captured yet");
		return w && URL.revokeObjectURL(w), w = URL.createObjectURL(e), w;
	}, F = (e = u.value) => new Promise((t, n) => {
		if (!e) {
			n(/* @__PURE__ */ Error("No photo has been captured yet"));
			return;
		}
		let r = new FileReader();
		r.onload = () => t(r.result), r.onerror = () => n(r.error ?? /* @__PURE__ */ Error("Failed to read the photo blob")), r.readAsDataURL(e);
	}), I = (e = "photo.png", t = u.value) => {
		if (!t) throw Error("No photo has been captured yet");
		return new File([t], e, { type: t.type || "image/png" });
	}, L = async (e) => {
		let t = O();
		if (!t) throw Error("Camera is not active");
		if (!v.value) throw Error("Torch is not supported by this camera");
		await t.applyConstraints({ advanced: [{ torch: e }] }), x.value = e;
	}, R = async (e) => {
		let t = O();
		if (!t) throw Error("Camera is not active");
		if (!y.value) throw Error("Zoom is not supported by this camera");
		await t.applyConstraints({ advanced: [{ zoom: e }] }), S.value = e;
	}, z = async (e = l.value) => {
		if (!c) throw Error("BarcodeDetector is not supported in this browser");
		if (!e) return [];
		T ??= new window.BarcodeDetector();
		let t = await T.detect(e);
		return C.value = t, t;
	}, B = (e) => {
		if (!c) throw Error("BarcodeDetector is not supported in this browser");
		let t = async () => {
			try {
				let t = await z();
				t.length && e && e(t);
			} catch {}
			E = requestAnimationFrame(t);
		};
		t();
	}, V = () => {
		E !== null && (cancelAnimationFrame(E), E = null);
	}, H = () => {
		V(), d.value?.getTracks().forEach((e) => e.stop()), l.value && (l.value.srcObject = null), w &&= (URL.revokeObjectURL(w), null), D && navigator.mediaDevices?.removeEventListener && (navigator.mediaDevices.removeEventListener("devicechange", k), D = !1), d.value = null, l.value = null, f.value = !1, v.value = !1, y.value = !1, b.value = null, x.value = !1;
	};
	return o && e() && t(H), {
		videoForScreenShot: l,
		screenshotVideoBlob: u,
		videoStream: d,
		isSupported: s,
		isActive: f,
		error: p,
		permission: m,
		setUpVideoForScreenshot: j,
		capturePhoto: N,
		stop: H,
		devices: h,
		currentDeviceId: g,
		isFrontCamera: _,
		refreshDevices: A,
		switchCamera: M,
		toObjectURL: P,
		toDataURL: F,
		toFile: I,
		canTorch: v,
		canZoom: y,
		zoomRange: b,
		torchOn: x,
		zoom: S,
		setTorch: L,
		setZoom: R,
		isBarcodeSupported: c,
		detectedCodes: C,
		scan: z,
		startScanning: B,
		stopScanning: V
	};
}
//#endregion
export { a as usePhotoCapture };
