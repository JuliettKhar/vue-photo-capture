import { computed as e, defineComponent as t, getCurrentInstance as n, h as r, onMounted as i, onUnmounted as a, ref as o, shallowRef as s, watch as c } from "vue";
//#region src/CameraCapture.ts
var l = t({
	name: "CameraCapture",
	props: {
		autoStart: {
			type: Boolean,
			default: !0
		},
		facingMode: {
			type: String,
			default: void 0
		},
		constraints: {
			type: [Object, Boolean],
			default: void 0
		},
		audio: {
			type: Boolean,
			default: !1
		},
		mirror: {
			type: Boolean,
			default: void 0
		},
		type: {
			type: String,
			default: void 0
		},
		quality: {
			type: Number,
			default: void 0
		}
	},
	emits: {
		capture: (e) => e instanceof Blob,
		recorded: (e) => e instanceof Blob,
		error: (e) => e instanceof Error,
		ready: () => !0,
		switch: (e) => e === void 0 || typeof e == "string"
	},
	setup(t, { emit: n, slots: a, expose: s }) {
		let c = o(null), l = d({
			videoRef: c,
			audio: t.audio
		}), u = o(!1), f = e(() => t.mirror ?? l.isFrontCamera.value), p = (e) => n("error", l.error.value ?? (e instanceof Error ? e : Error(String(e)))), m = async () => {
			try {
				let e = t.constraints ?? (t.facingMode ? { facingMode: t.facingMode } : void 0);
				await l.setUpVideoForScreenshot(e);
			} catch (e) {
				p(e);
			}
		}, h = async () => {
			try {
				let e = await l.takePhoto({
					type: t.type,
					quality: t.quality,
					mirror: f.value
				});
				return n("capture", e), e;
			} catch (e) {
				p(e);
			}
		}, g = async (e) => {
			try {
				await l.switchCamera(e), n("switch", e);
			} catch (e) {
				p(e);
			}
		}, _ = async () => {
			let e = await l.stopRecording();
			return n("recorded", e), e;
		}, v = () => {
			u.value || (u.value = !0, n("ready"));
		};
		i(() => {
			t.autoStart && m();
		}), s({
			start: m,
			stop: l.stop,
			capture: h,
			switchCamera: g,
			takePhoto: l.takePhoto,
			grabFrame: l.grabFrame,
			startRecording: l.startRecording,
			stopRecording: _,
			camera: l
		});
		let y = () => ({
			capture: h,
			start: m,
			stop: l.stop,
			switchCamera: g,
			startRecording: l.startRecording,
			stopRecording: _,
			isActive: l.isActive.value,
			isRecording: l.isRecording.value,
			isFrontCamera: l.isFrontCamera.value,
			ready: u.value,
			error: l.error.value,
			devices: l.devices.value
		}), b = () => r("div", { class: "camera-capture__controls" }, [r("button", {
			type: "button",
			disabled: !l.isActive.value || !u.value,
			onClick: () => void h()
		}, "Capture"), r("button", {
			type: "button",
			disabled: !l.isActive.value,
			onClick: () => void g()
		}, "Flip")]);
		return () => r("div", { class: "camera-capture" }, [r("div", {
			class: "camera-capture__stage",
			style: { position: "relative" }
		}, [r("video", {
			ref: c,
			class: "camera-capture__video",
			playsinline: !0,
			autoplay: !0,
			muted: !0,
			style: {
				width: "100%",
				display: "block",
				objectFit: "cover",
				transform: f.value ? "scaleX(-1)" : void 0
			},
			onLoadedmetadata: v,
			onPlaying: v
		}), a.overlay?.(y())]), a.controls ? a.controls(y()) : b()]);
	}
}), u = {
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
function d(t = {}) {
	let { autoCleanup: r = !0 } = t, i = typeof navigator < "u" && !!navigator.mediaDevices?.getUserMedia, l = typeof window < "u" && "BarcodeDetector" in window, d = typeof window < "u" && "ImageCapture" in window, f = typeof window < "u" && "MediaRecorder" in window, p = o(null), m = o(null), h = s(null), g = o(!1), _ = s(null), v = o("unknown"), y = o([]), b = o(null), x = o(!1), S = o(null), C = o(null), ee = e(() => ({ transform: x.value ? "scaleX(-1)" : "none" })), w = o(!1), T = o(!1), E = o(null), D = o(!1), O = o(1), k = o(!1), A = o(null), j = o(null), M = o(!1), N = o(null), P = o(null), F = o(!1), I = o(null), L = o(null), te = o([]), R = o(!1), z = o(null), B = null, V = null, H = null, U = !1, W = null, G = null, K = [], q = () => h.value?.getVideoTracks()[0] ?? null, J = () => t.videoRef?.value ?? p.value, ne = () => {
		Y();
	}, Y = async () => {
		if (!i || !navigator.mediaDevices?.enumerateDevices) return [];
		let e = await navigator.mediaDevices.enumerateDevices();
		return y.value = e.filter((e) => e.kind === "videoinput"), y.value;
	};
	t.videoRef && c([h, t.videoRef], async () => {
		let e = t.videoRef?.value;
		if (e && (e.srcObject !== h.value && (e.srcObject = h.value), h.value)) try {
			await e.play();
		} catch {}
	}, { flush: "post" });
	let X = async (e = u) => {
		if (_.value = null, !i) {
			let e = /* @__PURE__ */ Error("getUserMedia is not supported in this environment");
			throw _.value = e, e;
		}
		let n = t.audio ?? !1;
		try {
			let t;
			try {
				t = await navigator.mediaDevices.getUserMedia({
					video: e,
					audio: n
				});
			} catch (e) {
				if (e?.name === "OverconstrainedError") t = await navigator.mediaDevices.getUserMedia({
					video: !0,
					audio: n
				});
				else throw e;
			}
			let r = t.getVideoTracks()[0], i = r.getSettings(), a = document.createElement("video");
			a.setAttribute("autoplay", "true"), a.setAttribute("playsinline", "true"), a.setAttribute("width", String(i.width || 1280)), a.setAttribute("height", String(i.height || 1280)), a.srcObject = t, p.value = a, h.value = t, g.value = !0, v.value = "granted", W = null, S.value = i.width && i.height ? {
				width: i.width,
				height: i.height
			} : null, C.value = S.value ? S.value.width / S.value.height : i.aspectRatio ?? null, b.value = i.deviceId ?? null, x.value = i.facingMode === "user";
			let o = r.getCapabilities?.() ?? {}, s = i, c = (e) => e ? {
				min: e.min,
				max: e.max,
				step: e.step ?? .1
			} : null;
			w.value = !!o.torch, T.value = !!o.zoom, E.value = c(o.zoom), D.value = !1, O.value = s.zoom ?? 1, k.value = !!o.focusDistance, A.value = c(o.focusDistance), j.value = s.focusDistance ?? null, M.value = !!o.exposureCompensation, N.value = c(o.exposureCompensation), P.value = s.exposureCompensation ?? null, F.value = !!o.colorTemperature, I.value = c(o.colorTemperature), L.value = s.colorTemperature ?? null, await Y(), !U && navigator.mediaDevices.addEventListener && (navigator.mediaDevices.addEventListener("devicechange", ne), U = !0);
		} catch (e) {
			let t = e instanceof Error ? e : Error(String(e), { cause: e });
			throw (t.name === "NotAllowedError" || t.name === "SecurityError") && (v.value = "denied"), _.value = t, g.value = !1, t;
		}
	}, re = async (e) => {
		let t = x.value;
		$(), await X(e ? { deviceId: { exact: e } } : { facingMode: t ? "environment" : "user" });
	}, ie = (e = J(), t = {}) => new Promise((n, r) => {
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
	}), Z = () => {
		let e = q();
		if (!e) throw Error("Camera is not active");
		return W ??= new window.ImageCapture(e), W;
	}, ae = async (e = {}) => {
		if (d && q()) try {
			let e = await Z().takePhoto();
			return m.value = e, e;
		} catch {}
		return ie(J(), e);
	}, oe = async () => {
		if (!d) throw Error("ImageCapture is not supported in this browser");
		return Z().grabFrame();
	}, se = (e = m.value) => {
		if (!e) throw Error("No photo has been captured yet");
		return B && URL.revokeObjectURL(B), B = URL.createObjectURL(e), B;
	}, ce = (e = m.value) => new Promise((t, n) => {
		if (!e) {
			n(/* @__PURE__ */ Error("No photo has been captured yet"));
			return;
		}
		let r = new FileReader();
		r.onload = () => t(r.result), r.onerror = () => n(r.error ?? /* @__PURE__ */ Error("Failed to read the photo blob")), r.readAsDataURL(e);
	}), le = (e = "photo.png", t = m.value) => {
		if (!t) throw Error("No photo has been captured yet");
		return new File([t], e, { type: t.type || "image/png" });
	}, Q = async (e, t, n) => {
		let r = q();
		if (!r) throw Error("Camera is not active");
		if (!e) throw Error(`${t} is not supported by this camera`);
		await r.applyConstraints({ advanced: [n] });
	}, ue = async (e) => {
		await Q(w.value, "Torch", { torch: e }), D.value = e;
	}, de = async (e) => {
		await Q(T.value, "Zoom", { zoom: e }), O.value = e;
	}, fe = async (e) => {
		await Q(k.value, "Manual focus", {
			focusMode: "manual",
			focusDistance: e
		}), j.value = e;
	}, pe = async (e, t) => {
		await Q(k.value, "Focus", {
			focusMode: "single-shot",
			pointsOfInterest: [{
				x: e,
				y: t
			}]
		});
	}, me = async (e) => {
		await Q(M.value, "Exposure", {
			exposureMode: "manual",
			exposureCompensation: e
		}), P.value = e;
	}, he = async (e) => {
		await Q(F.value, "White balance", {
			whiteBalanceMode: "manual",
			colorTemperature: e
		}), L.value = e;
	}, ge = (e = {}) => {
		if (!f) throw Error("MediaRecorder is not supported in this browser");
		if (!h.value) throw Error("Camera is not active");
		if (R.value) return;
		let t = e.mimeType && MediaRecorder.isTypeSupported(e.mimeType) ? e.mimeType : void 0;
		K = [];
		let n = new MediaRecorder(h.value, {
			...t ? { mimeType: t } : {},
			...e.audioBitsPerSecond ? { audioBitsPerSecond: e.audioBitsPerSecond } : {},
			...e.videoBitsPerSecond ? { videoBitsPerSecond: e.videoBitsPerSecond } : {}
		});
		n.ondataavailable = (e) => {
			e.data && e.data.size > 0 && K.push(e.data);
		}, G = n, n.start(e.timeslice), R.value = !0;
	}, _e = () => new Promise((e, t) => {
		let n = G;
		if (!n || n.state === "inactive") {
			t(/* @__PURE__ */ Error("Not recording"));
			return;
		}
		n.onstop = () => {
			let t = n.mimeType || K[0]?.type || "video/webm", r = new Blob(K, { type: t });
			z.value = r, R.value = !1, G = null, e(r);
		}, n.stop();
	}), ve = () => {
		G?.state === "recording" && G.pause();
	}, ye = () => {
		G?.state === "paused" && G.resume();
	}, be = async (e = J()) => {
		if (!l) throw Error("BarcodeDetector is not supported in this browser");
		if (!e) return [];
		V ??= new window.BarcodeDetector();
		let t = await V.detect(e);
		return te.value = t, t;
	}, xe = (e) => {
		if (!l) throw Error("BarcodeDetector is not supported in this browser");
		let t = async () => {
			try {
				let t = await be();
				t.length && e && e(t);
			} catch {}
			H = requestAnimationFrame(t);
		};
		t();
	}, Se = () => {
		H !== null && (cancelAnimationFrame(H), H = null);
	}, $ = () => {
		if (Se(), G && G.state !== "inactive") try {
			G.stop();
		} catch {}
		G = null, R.value = !1, W = null, h.value?.getTracks().forEach((e) => e.stop()), p.value && (p.value.srcObject = null), t.videoRef?.value && (t.videoRef.value.srcObject = null), B &&= (URL.revokeObjectURL(B), null), U && navigator.mediaDevices?.removeEventListener && (navigator.mediaDevices.removeEventListener("devicechange", ne), U = !1), h.value = null, p.value = null, g.value = !1, w.value = !1, T.value = !1, E.value = null, D.value = !1, k.value = !1, A.value = null, j.value = null, M.value = !1, N.value = null, P.value = null, F.value = !1, I.value = null, L.value = null, S.value = null, C.value = null;
	};
	return r && n() && a($), {
		videoForScreenShot: p,
		screenshotVideoBlob: m,
		videoStream: h,
		isSupported: i,
		isActive: g,
		error: _,
		permission: v,
		setUpVideoForScreenshot: X,
		capturePhoto: ie,
		stop: $,
		isImageCaptureSupported: d,
		takePhoto: ae,
		grabFrame: oe,
		devices: y,
		currentDeviceId: b,
		isFrontCamera: x,
		refreshDevices: Y,
		switchCamera: re,
		resolution: S,
		aspectRatio: C,
		mirrorStyle: ee,
		toObjectURL: se,
		toDataURL: ce,
		toFile: le,
		canTorch: w,
		canZoom: T,
		zoomRange: E,
		torchOn: D,
		zoom: O,
		setTorch: ue,
		setZoom: de,
		canFocus: k,
		focusRange: A,
		focusDistance: j,
		setFocusDistance: fe,
		focusAt: pe,
		canExposure: M,
		exposureRange: N,
		exposureCompensation: P,
		setExposureCompensation: me,
		canWhiteBalance: F,
		colorTemperatureRange: I,
		colorTemperature: L,
		setColorTemperature: he,
		isRecordingSupported: f,
		isRecording: R,
		recordedBlob: z,
		startRecording: ge,
		stopRecording: _e,
		pauseRecording: ve,
		resumeRecording: ye,
		isBarcodeSupported: l,
		detectedCodes: te,
		scan: be,
		startScanning: xe,
		stopScanning: Se
	};
}
//#endregion
export { l as CameraCapture, d as usePhotoCapture };
