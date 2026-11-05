"use client";

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { Camera, CameraOff, AlertCircle, RefreshCw, Check } from "lucide-react";

export interface SelfieCameraRef {
  takeSnapshot: () => string | null;
  isCameraActive: () => boolean;
}

interface SelfieCameraProps {
  onCameraReady?: (ready: boolean) => void;
  onError?: (error: string) => void;
}

const SelfieCamera = forwardRef<SelfieCameraRef, SelfieCameraProps>(
  ({ onCameraReady, onError }, ref) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [isStreaming, setIsStreaming] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Strictly front/selfie camera only
    const startCamera = async () => {
      setIsLoading(true);
      setCameraError(null);
      stopCamera();

      try {
        let stream: MediaStream | null = null;

        // Try strict user/selfie facingMode first
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { exact: "user" },
              width: { ideal: 720 },
              height: { ideal: 720 },
            },
            audio: false,
          });
        } catch {
          // Fallback to general user facingMode
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "user",
              width: { ideal: 640 },
              height: { ideal: 640 },
            },
            audio: false,
          });
        }

        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.muted = true;
          await videoRef.current.play();
          streamRef.current = stream;
          setIsStreaming(true);
          onCameraReady?.(true);
        }
      } catch (err: any) {
        console.error("Camera access error:", err);
        let msg = "Front camera permission required.";
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          msg = "Camera permission was denied. Tap the lock icon in Chrome address bar to allow Camera.";
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          msg = "No front camera found on this device.";
        }
        setCameraError(msg);
        setIsStreaming(false);
        onError?.(msg);
        onCameraReady?.(false);
      } finally {
        setIsLoading(false);
      }
    };

    const stopCamera = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsStreaming(false);
      onCameraReady?.(false);
    };

    useEffect(() => {
      startCamera();
      return () => {
        stopCamera();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useImperativeHandle(ref, () => ({
      takeSnapshot: () => {
        if (!videoRef.current || !canvasRef.current || !isStreaming) {
          return null;
        }
        const video = videoRef.current;
        const canvas = canvasRef.current;

        const width = video.videoWidth || 640;
        const height = video.videoHeight || 640;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        // Draw image directly (no mirroring in saved file for accurate selfie photo)
        ctx.save();
        ctx.drawImage(video, 0, 0, width, height);
        ctx.restore();

        return canvas.toDataURL("image/jpeg", 0.88);
      },
      isCameraActive: () => isStreaming,
    }));

    return (
      <div className="w-full flex flex-col items-center">
        <canvas ref={canvasRef} className="hidden" />

        {/* Camera Container */}
        <div className="relative w-full aspect-[4/4] rounded-2xl overflow-hidden bg-slate-900 border border-slate-200/90 shadow-sm">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${
              isStreaming ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Subdued Face Oval Positioning Guide (Only visible when streaming) */}
          {isStreaming && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="w-[68%] h-[74%] rounded-[50%] border-2 border-white/30 border-dashed animate-pulse" />
            </div>
          )}

          {/* Stopped / Loading / Error State */}
          {!isStreaming && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900 text-white">
              {isLoading ? (
                <>
                  <div className="w-9 h-9 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-xs font-semibold text-slate-300">Opening Front Camera...</p>
                </>
              ) : cameraError ? (
                <>
                  <AlertCircle className="w-10 h-10 text-rose-400 mb-2" />
                  <p className="text-xs font-bold text-white mb-1">Camera Access Required</p>
                  <p className="text-[11px] text-slate-300 max-w-xs leading-relaxed mb-4">
                    {cameraError}
                  </p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Try Again</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mb-3 text-slate-400 border border-slate-700">
                    <CameraOff className="w-7 h-7" />
                  </div>
                  <p className="text-xs font-semibold text-slate-300 mb-1">Camera is Paused</p>
                  <p className="text-[11px] text-slate-400 max-w-[200px]">
                    Turn on camera to capture live selfie attendance
                  </p>
                </>
              )}
            </div>
          )}

          {/* Status Badge */}
          {isStreaming && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-xs border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Front Camera Live</span>
            </div>
          )}
        </div>

        {/* Toggle Button (Matches user screenshot: "Stop Camera" / "Start Camera") */}
        <div className="w-full mt-3">
          {isStreaming ? (
            <button
              type="button"
              onClick={stopCamera}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-200 bg-slate-700 hover:bg-slate-600 active:scale-[0.99] transition shadow-xs flex items-center justify-center gap-1.5"
            >
              <CameraOff className="w-3.5 h-3.5" />
              <span>Stop Camera</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={startCamera}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] transition shadow-xs flex items-center justify-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Start Camera</span>
            </button>
          )}
        </div>
      </div>
    );
  }
);

SelfieCamera.displayName = "SelfieCamera";

export default SelfieCamera;
