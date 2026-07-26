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
		let c = o(null), l = h({
			videoRef: c,
			audio: t.audio
		}), u = o(!1), d = e(() => t.mirror ?? l.isFrontCamera.value), f = (e) => n("error", l.error.value ?? (e instanceof Error ? e : Error(String(e)))), p = async () => {
			try {
				let e = t.constraints ?? (t.facingMode ? { facingMode: t.facingMode } : void 0);
				await l.setUpVideoForScreenshot(e);
			} catch (e) {
				f(e);
			}
		}, m = async () => {
			try {
				let e = await l.takePhoto({
					type: t.type,
					quality: t.quality,
					mirror: d.value
				});
				return n("capture", e), e;
			} catch (e) {
				f(e);
			}
		}, g = async (e) => {
			try {
				await l.switchCamera(e), n("switch", e);
			} catch (e) {
				f(e);
			}
		}, _ = async () => {
			let e = await l.stopRecording();
			return n("recorded", e), e;
		}, v = () => {
			u.value || (u.value = !0, n("ready"));
		};
		i(() => {
			t.autoStart && p();
		}), s({
			start: p,
			stop: l.stop,
			capture: m,
			switchCamera: g,
			takePhoto: l.takePhoto,
			grabFrame: l.grabFrame,
			startRecording: l.startRecording,
			stopRecording: _,
			camera: l
		});
		let y = () => ({
			capture: m,
			start: p,
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
			onClick: () => void m()
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
				transform: d.value ? "scaleX(-1)" : void 0
			},
			onLoadedmetadata: v,
			onPlaying: v
		}), a.overlay?.(y())]), a.controls ? a.controls(y()) : b()]);
	}
});
//#endregion
//#region src/index.ts
function u(e, t, n) {
	if (!n) return {
		x: 0,
		y: 0,
		width: e,
		height: t
	};
	let r = Math.max(0, Math.min(n.x, e - 1)), i = Math.max(0, Math.min(n.y, t - 1));
	return {
		x: r,
		y: i,
		width: Math.max(1, Math.min(n.width, e - r)),
		height: Math.max(1, Math.min(n.height, t - i))
	};
}
function d(e, t, n, r) {
	let i = 1;
	return n && e > n && (i = Math.min(i, n / e)), r && t > r && (i = Math.min(i, r / t)), {
		width: Math.max(1, Math.round(e * i)),
		height: Math.max(1, Math.round(t * i))
	};
}
async function f(e, t = {}) {
	let n = await createImageBitmap(e, { imageOrientation: "from-image" });
	try {
		let e = u(n.width, n.height, t.crop), { width: r, height: i } = d(e.width, e.height, t.maxWidth, t.maxHeight), a = document.createElement("canvas");
		a.width = r, a.height = i;
		let o = a.getContext("2d");
		if (!o) throw Error("Unable to get a 2D canvas context");
		return t.mirror && (o.translate(r, 0), o.scale(-1, 1)), o.drawImage(n, e.x, e.y, e.width, e.height, 0, 0, r, i), await new Promise((e, n) => {
			a.toBlob((t) => t ? e(t) : n(/* @__PURE__ */ Error("Failed to encode the edited image")), t.type, t.quality);
		});
	} finally {
		n.close();
	}
}
var p = (e) => new Promise((t) => setTimeout(t, e)), m = {
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
function h(t = {}) {
	let { autoCleanup: r = !0 } = t, i = typeof navigator < "u" && !!navigator.mediaDevices?.getUserMedia, l = typeof window < "u" && "BarcodeDetector" in window, h = typeof window < "u" && "ImageCapture" in window, g = typeof window < "u" && "MediaRecorder" in window, _ = o(null), v = o(null), y = s(null), b = o(!1), x = s(null), S = o("unknown"), C = o([]), ee = o(null), w = o(!1), T = o(null), E = o(null), te = e(() => ({ transform: w.value ? "scaleX(-1)" : "none" })), D = o(!1), O = o(!1), k = o(null), A = o(!1), j = o(1), M = o(!1), N = o(null), P = o(null), F = o(!1), I = o(null), L = o(null), R = o(!1), z = o(null), B = o(null), ne = o([]), V = o(!1), re = o(null), H = null, ie = null, U = null, W = !1, G = null, K = null, q = [], J = () => y.value?.getVideoTracks()[0] ?? null, Y = () => t.videoRef?.value ?? _.value, ae = () => {
		X();
	}, X = async () => {
		if (!i || !navigator.mediaDevices?.enumerateDevices) return [];
		let e = await navigator.mediaDevices.enumerateDevices();
		return C.value = e.filter((e) => e.kind === "videoinput"), C.value;
	};
	t.videoRef && c([y, t.videoRef], async () => {
		let e = t.videoRef?.value;
		if (e && (e.srcObject !== y.value && (e.srcObject = y.value), y.value)) try {
			await e.play();
		} catch {}
	}, { flush: "post" });
	let oe = async (e = m) => {
		if (x.value = null, !i) {
			let e = /* @__PURE__ */ Error("getUserMedia is not supported in this environment");
			throw x.value = e, e;
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
			a.setAttribute("autoplay", "true"), a.setAttribute("playsinline", "true"), a.setAttribute("width", String(i.width || 1280)), a.setAttribute("height", String(i.height || 1280)), a.srcObject = t, _.value = a, y.value = t, b.value = !0, S.value = "granted", G = null, T.value = i.width && i.height ? {
				width: i.width,
				height: i.height
			} : null, E.value = T.value ? T.value.width / T.value.height : i.aspectRatio ?? null, ee.value = i.deviceId ?? null, w.value = i.facingMode === "user";
			let o = r.getCapabilities?.() ?? {}, s = i, c = (e) => e ? {
				min: e.min,
				max: e.max,
				step: e.step ?? .1
			} : null;
			D.value = !!o.torch, O.value = !!o.zoom, k.value = c(o.zoom), A.value = !1, j.value = s.zoom ?? 1, M.value = !!o.focusDistance, N.value = c(o.focusDistance), P.value = s.focusDistance ?? null, F.value = !!o.exposureCompensation, I.value = c(o.exposureCompensation), L.value = s.exposureCompensation ?? null, R.value = !!o.colorTemperature, z.value = c(o.colorTemperature), B.value = s.colorTemperature ?? null, await X(), !W && navigator.mediaDevices.addEventListener && (navigator.mediaDevices.addEventListener("devicechange", ae), W = !0);
		} catch (e) {
			let t = e instanceof Error ? e : Error(String(e), { cause: e });
			throw (t.name === "NotAllowedError" || t.name === "SecurityError") && (S.value = "denied"), x.value = t, b.value = !1, t;
		}
	}, se = async (e) => {
		let t = w.value;
		$(), await oe(e ? { deviceId: { exact: e } } : { facingMode: t ? "environment" : "user" });
	}, Z = (e = Y(), t = {}) => new Promise((n, r) => {
		let i = (e) => {
			let t = Error(e);
			x.value = t, r(t);
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
		let s = u(a, o, t.crop), { width: c, height: l } = d(s.width, s.height, t.maxWidth, t.maxHeight), f = document.createElement("canvas");
		f.width = c, f.height = l;
		let p = f.getContext("2d");
		if (!p) {
			i("Unable to get a 2D canvas context");
			return;
		}
		t.mirror && (p.translate(c, 0), p.scale(-1, 1)), p.drawImage(e, s.x, s.y, s.width, s.height, 0, 0, c, l), f.toBlob((e) => {
			if (!e) {
				i("Failed to capture photo: the canvas produced an empty blob");
				return;
			}
			v.value = e, n(e);
		}, t.type, t.quality);
	}), ce = () => {
		let e = J();
		if (!e) throw Error("Camera is not active");
		return G ??= new window.ImageCapture(e), G;
	}, le = async (e = {}) => {
		if (h && J()) try {
			let t = await ce().takePhoto();
			return (e.crop || e.maxWidth != null || e.maxHeight != null || e.mirror || e.type != null || e.quality != null) && (t = await f(t, e)), v.value = t, t;
		} catch {}
		return Z(Y(), e);
	}, ue = async () => {
		if (!h) throw Error("ImageCapture is not supported in this browser");
		return ce().grabFrame();
	}, de = async (e, t = {}) => {
		let { interval: n = 300, ...r } = t, i = [];
		for (let t = 0; t < e; t += 1) t > 0 && await p(n), i.push(await Z(Y(), r));
		return i;
	}, fe = async (e, t = {}) => {
		let { onTick: n, ...r } = t;
		for (let t = e; t > 0; --t) n?.(t), await p(1e3);
		return n?.(0), le(r);
	}, pe = (e = v.value) => {
		if (!e) throw Error("No photo has been captured yet");
		return H && URL.revokeObjectURL(H), H = URL.createObjectURL(e), H;
	}, me = (e = v.value) => new Promise((t, n) => {
		if (!e) {
			n(/* @__PURE__ */ Error("No photo has been captured yet"));
			return;
		}
		let r = new FileReader();
		r.onload = () => t(r.result), r.onerror = () => n(r.error ?? /* @__PURE__ */ Error("Failed to read the photo blob")), r.readAsDataURL(e);
	}), he = (e = "photo.png", t = v.value) => {
		if (!t) throw Error("No photo has been captured yet");
		return new File([t], e, { type: t.type || "image/png" });
	}, Q = async (e, t, n) => {
		let r = J();
		if (!r) throw Error("Camera is not active");
		if (!e) throw Error(`${t} is not supported by this camera`);
		await r.applyConstraints({ advanced: [n] });
	}, ge = async (e) => {
		await Q(D.value, "Torch", { torch: e }), A.value = e;
	}, _e = async (e) => {
		await Q(O.value, "Zoom", { zoom: e }), j.value = e;
	}, ve = async (e) => {
		await Q(M.value, "Manual focus", {
			focusMode: "manual",
			focusDistance: e
		}), P.value = e;
	}, ye = async (e, t) => {
		await Q(M.value, "Focus", {
			focusMode: "single-shot",
			pointsOfInterest: [{
				x: e,
				y: t
			}]
		});
	}, be = async (e) => {
		await Q(F.value, "Exposure", {
			exposureMode: "manual",
			exposureCompensation: e
		}), L.value = e;
	}, xe = async (e) => {
		await Q(R.value, "White balance", {
			whiteBalanceMode: "manual",
			colorTemperature: e
		}), B.value = e;
	}, Se = (e = {}) => {
		if (!g) throw Error("MediaRecorder is not supported in this browser");
		if (!y.value) throw Error("Camera is not active");
		if (V.value) return;
		let t = e.mimeType && MediaRecorder.isTypeSupported(e.mimeType) ? e.mimeType : void 0;
		q = [];
		let n = new MediaRecorder(y.value, {
			...t ? { mimeType: t } : {},
			...e.audioBitsPerSecond ? { audioBitsPerSecond: e.audioBitsPerSecond } : {},
			...e.videoBitsPerSecond ? { videoBitsPerSecond: e.videoBitsPerSecond } : {}
		});
		n.ondataavailable = (e) => {
			e.data && e.data.size > 0 && q.push(e.data);
		}, K = n, n.start(e.timeslice), V.value = !0;
	}, Ce = () => new Promise((e, t) => {
		let n = K;
		if (!n || n.state === "inactive") {
			t(/* @__PURE__ */ Error("Not recording"));
			return;
		}
		n.onstop = () => {
			let t = n.mimeType || q[0]?.type || "video/webm", r = new Blob(q, { type: t });
			re.value = r, V.value = !1, K = null, e(r);
		}, n.stop();
	}), we = () => {
		K?.state === "recording" && K.pause();
	}, Te = () => {
		K?.state === "paused" && K.resume();
	}, Ee = async (e = Y()) => {
		if (!l) throw Error("BarcodeDetector is not supported in this browser");
		if (!e) return [];
		ie ??= new window.BarcodeDetector();
		let t = await ie.detect(e);
		return ne.value = t, t;
	}, De = (e) => {
		if (!l) throw Error("BarcodeDetector is not supported in this browser");
		let t = async () => {
			try {
				let t = await Ee();
				t.length && e && e(t);
			} catch {}
			U = requestAnimationFrame(t);
		};
		t();
	}, Oe = () => {
		U !== null && (cancelAnimationFrame(U), U = null);
	}, $ = () => {
		if (Oe(), K && K.state !== "inactive") try {
			K.stop();
		} catch {}
		K = null, V.value = !1, G = null, y.value?.getTracks().forEach((e) => e.stop()), _.value && (_.value.srcObject = null), t.videoRef?.value && (t.videoRef.value.srcObject = null), H &&= (URL.revokeObjectURL(H), null), W && navigator.mediaDevices?.removeEventListener && (navigator.mediaDevices.removeEventListener("devicechange", ae), W = !1), y.value = null, _.value = null, b.value = !1, D.value = !1, O.value = !1, k.value = null, A.value = !1, M.value = !1, N.value = null, P.value = null, F.value = !1, I.value = null, L.value = null, R.value = !1, z.value = null, B.value = null, T.value = null, E.value = null;
	};
	return r && n() && a($), {
		videoForScreenShot: _,
		screenshotVideoBlob: v,
		videoStream: y,
		isSupported: i,
		isActive: b,
		error: x,
		permission: S,
		setUpVideoForScreenshot: oe,
		capturePhoto: Z,
		stop: $,
		isImageCaptureSupported: h,
		takePhoto: le,
		grabFrame: ue,
		captureBurst: de,
		captureAfter: fe,
		devices: C,
		currentDeviceId: ee,
		isFrontCamera: w,
		refreshDevices: X,
		switchCamera: se,
		resolution: T,
		aspectRatio: E,
		mirrorStyle: te,
		toObjectURL: pe,
		toDataURL: me,
		toFile: he,
		canTorch: D,
		canZoom: O,
		zoomRange: k,
		torchOn: A,
		zoom: j,
		setTorch: ge,
		setZoom: _e,
		canFocus: M,
		focusRange: N,
		focusDistance: P,
		setFocusDistance: ve,
		focusAt: ye,
		canExposure: F,
		exposureRange: I,
		exposureCompensation: L,
		setExposureCompensation: be,
		canWhiteBalance: R,
		colorTemperatureRange: z,
		colorTemperature: B,
		setColorTemperature: xe,
		isRecordingSupported: g,
		isRecording: V,
		recordedBlob: re,
		startRecording: Se,
		stopRecording: Ce,
		pauseRecording: we,
		resumeRecording: Te,
		isBarcodeSupported: l,
		detectedCodes: ne,
		scan: Ee,
		startScanning: De,
		stopScanning: Oe
	};
}
//#endregion
export { l as CameraCapture, f as editImage, h as usePhotoCapture };
