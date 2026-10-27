"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ZoomIn, ZoomOut, RotateCcw, Check, X, Move, Crop } from "lucide-react";

export interface CropResult {
  focalX: number; // 0 to 100
  focalY: number; // 0 to 100
  zoom: number;   // >= 1
  aspectRatio: string; // "4:3" | "1:1" | "4:5"
  croppedBlob?: Blob;  // generated for client preview / fallback
}

interface ImageCropperModalProps {
  imageSrc: string;
  initialAspectRatio?: "4:3" | "1:1" | "4:5";
  initialFocalX?: number; // 0 to 100 (default 50)
  initialFocalY?: number; // 0 to 100 (default 50)
  initialZoom?: number;   // default 1
  allowedRatios?: ("4:3" | "1:1" | "4:5")[];
  title?: string;
  onCropComplete: (result: CropResult) => void;
  onCancel: () => void;
}

const RATIO_VALUES: Record<"4:3" | "1:1" | "4:5", number> = {
  "4:3": 4 / 3,
  "1:1": 1,
  "4:5": 4 / 5,
};

export default function ImageCropperModal({
  imageSrc,
  initialAspectRatio = "4:3",
  initialFocalX = 50,
  initialFocalY = 50,
  initialZoom = 1,
  allowedRatios = ["4:3", "1:1", "4:5"],
  title = "Crop & Reposition Image",
  onCropComplete,
  onCancel,
}: ImageCropperModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cropWindowRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [selectedRatio, setSelectedRatio] = useState<"4:3" | "1:1" | "4:5">(initialAspectRatio);
  const ratioNum = RATIO_VALUES[selectedRatio] || 4 / 3;

  // Natural image dimensions
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);

  // Zoom scale: minScale fits the crop box, scale = minScale * zoom
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [zoomMultiplier, setZoomMultiplier] = useState(initialZoom || 1);

  // Position (offset in px from center)
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Dragging state
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const posStart = useRef({ x: 0, y: 0 });

  // Touch pinch-to-zoom state
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartZoom = useRef<number>(1);

  // In-modal notification toast state
  const [modalToast, setModalToast] = useState<{ message: string; type: "info" | "warning" | "error" } | null>(null);

  const showModalToast = (message: string, type: "info" | "warning" | "error" = "info") => {
    setModalToast({ message, type });
    setTimeout(() => {
      setModalToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Determine if imageSrc is already a local source (data: or blob:)
  const isLocalSource = useMemo(() => {
    return imageSrc.startsWith("data:") || imageSrc.startsWith("blob:");
  }, [imageSrc]);

  // For remote images (e.g. ImageKit), append cache-busting timestamp to avoid tainted canvas from stale non-CORS cache
  const effectiveImageSrc = useMemo(() => {
    if (isLocalSource) return imageSrc;
    try {
      const sep = imageSrc.includes("?") ? "&" : "?";
      return `${imageSrc}${sep}cb=${Date.now()}`;
    } catch {
      return imageSrc;
    }
  }, [imageSrc, isLocalSource]);

  // Keep a ref of values for event listeners registered outside React props
  const stateRef = useRef({
    scale,
    minScale,
    zoomMultiplier,
    position,
  });

  useEffect(() => {
    stateRef.current = { scale, minScale, zoomMultiplier, position };
  }, [scale, minScale, zoomMultiplier, position]);

  // Crop frame dimensions in the modal viewport
  const [cropBox, setCropBox] = useState({ width: 480, height: 360 });

  // Calculate crop box size responsive to window/container (mobile full-screen sheet safe)
  useEffect(() => {
    const updateCropBox = () => {
      const isMobile = window.innerWidth < 640;
      const maxW = isMobile ? window.innerWidth - 32 : Math.min(window.innerWidth - 64, 560);
      const maxH = isMobile ? window.innerHeight - 340 : Math.min(window.innerHeight - 300, 420);

      let w = maxW;
      let h = w / ratioNum;

      if (h > maxH) {
        h = maxH;
        w = h * ratioNum;
      }

      setCropBox({ width: Math.round(w), height: Math.round(h) });
    };

    updateCropBox();
    window.addEventListener("resize", updateCropBox);
    return () => window.removeEventListener("resize", updateCropBox);
  }, [ratioNum]);

  // Lock body scroll while modal is mounted (save original style and restore on unmount)
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
    };
  }, []);

  // Clamp movement so image always fully covers the crop frame
  const clampPosition = useCallback(
    (x: number, y: number, currentScale: number) => {
      if (!naturalSize) return { x, y };

      const currentW = naturalSize.width * currentScale;
      const currentH = naturalSize.height * currentScale;

      const maxOffsetX = Math.max(0, (currentW - cropBox.width) / 2);
      const maxOffsetY = Math.max(0, (currentH - cropBox.height) / 2);

      return {
        x: Math.max(-maxOffsetX, Math.min(maxOffsetX, x)),
        y: Math.max(-maxOffsetY, Math.min(maxOffsetY, y)),
      };
    },
    [naturalSize, cropBox]
  );

  // Initialize position and zoom from initial focal point
  const applyFocalAndZoom = useCallback(
    (focalX: number, focalY: number, zoomVal: number, nw: number, nh: number, curCropBox: { width: number; height: number }) => {
      const scaleX = curCropBox.width / nw;
      const scaleY = curCropBox.height / nh;
      const baseFit = Math.max(scaleX, scaleY);
      setMinScale(baseFit);

      const effectiveZoom = Math.max(1, Math.min(4, zoomVal));
      setZoomMultiplier(effectiveZoom);
      const effectiveScale = baseFit * effectiveZoom;
      setScale(effectiveScale);

      const renderedW = nw * effectiveScale;
      const renderedH = nh * effectiveScale;

      const maxOffsetX = Math.max(0, (renderedW - curCropBox.width) / 2);
      const maxOffsetY = Math.max(0, (renderedH - curCropBox.height) / 2);

      const targetX = ((50 - focalX) / 50) * maxOffsetX;
      const targetY = ((50 - focalY) / 50) * maxOffsetY;

      const clamped = {
        x: Math.max(-maxOffsetX, Math.min(maxOffsetX, targetX)),
        y: Math.max(-maxOffsetY, Math.min(maxOffsetY, targetY)),
      };
      setPosition(clamped);
    },
    []
  );

  // When image loads
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    setNaturalSize({ width: nw, height: nh });

    applyFocalAndZoom(initialFocalX, initialFocalY, initialZoom, nw, nh, cropBox);
  };

  // Re-adjust if cropBox or ratio changes
  useEffect(() => {
    if (!naturalSize) return;
    const scaleX = cropBox.width / naturalSize.width;
    const scaleY = cropBox.height / naturalSize.height;
    const baseFit = Math.max(scaleX, scaleY);
    setMinScale(baseFit);

    const effectiveScale = baseFit * zoomMultiplier;
    setScale(effectiveScale);
    setPosition((prev) => clampPosition(prev.x, prev.y, effectiveScale));
  }, [cropBox, naturalSize, zoomMultiplier, clampPosition]);

  // Pointer drag handlers (Mouse & Touch in ANY direction)
  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    posStart.current = { ...position };
    try {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const newX = posStart.current.x + dx;
    const newY = posStart.current.y + dy;
    setPosition(clampPosition(newX, newY, scale));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Helper: check if client coordinates fall inside the active crop box
  const isPointInCropBox = useCallback((clientX: number, clientY: number): boolean => {
    if (!cropWindowRef.current) return false;
    const rect = cropWindowRef.current.getBoundingClientRect();
    return (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    );
  }, []);

  // Passive event listener fix: register wheel & touch listeners with { passive: false }
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      // Only prevent default if wheel action occurs over the crop viewport / area
      if (isPointInCropBox(e.clientX, e.clientY) || container.contains(e.target as Node)) {
        e.preventDefault();
      }

      const { zoomMultiplier: curZoom, minScale: curMin } = stateRef.current;
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      const nextZoom = Math.min(4, Math.max(1, curZoom * zoomFactor));
      setZoomMultiplier(nextZoom);
      const nextScale = curMin * nextZoom;
      setScale(nextScale);
      setPosition((prev) => clampPosition(prev.x, prev.y, nextScale));
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
        pinchStartDist.current = dist;
        pinchStartZoom.current = stateRef.current.zoomMultiplier;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchStartDist.current !== null) {
        // Two-finger pinch inside cropper
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        if (
          isPointInCropBox(touch1.clientX, touch1.clientY) ||
          isPointInCropBox(touch2.clientX, touch2.clientY) ||
          container.contains(e.target as Node)
        ) {
          e.preventDefault();
        }

        const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
        const ratio = dist / pinchStartDist.current;
        const nextZoom = Math.min(4, Math.max(1, pinchStartZoom.current * ratio));
        setZoomMultiplier(nextZoom);
        const nextScale = stateRef.current.minScale * nextZoom;
        setScale(nextScale);
        setPosition((prev) => clampPosition(prev.x, prev.y, nextScale));
      }
    };

    const onTouchEnd = () => {
      pinchStartDist.current = null;
    };

    // Attach with passive: false so preventDefault() never throws console error
    container.addEventListener("wheel", onWheel, { passive: false });
    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("wheel", onWheel);
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
    };
  }, [clampPosition, isPointInCropBox]);

  const handleZoomSlider = (val: number) => {
    const nextZoom = Math.min(4, Math.max(1, val));
    setZoomMultiplier(nextZoom);
    const nextScale = minScale * nextZoom;
    setScale(nextScale);
    setPosition((prev) => clampPosition(prev.x, prev.y, nextScale));
  };

  const handleReset = () => {
    setZoomMultiplier(1);
    setScale(minScale);
    setPosition({ x: 0, y: 0 });
  };

  // Calculate current focal point in percent (0 to 100)
  const computeFocalPoint = (): { focalX: number; focalY: number } => {
    if (!naturalSize) return { focalX: 50, focalY: 50 };

    const renderedW = naturalSize.width * scale;
    const renderedH = naturalSize.height * scale;

    const maxOffsetX = Math.max(0, (renderedW - cropBox.width) / 2);
    const maxOffsetY = Math.max(0, (renderedH - cropBox.height) / 2);

    let focalX = 50;
    if (maxOffsetX > 0) {
      focalX = Math.round(50 - (position.x / maxOffsetX) * 50);
      focalX = Math.max(0, Math.min(100, focalX));
    }

    let focalY = 50;
    if (maxOffsetY > 0) {
      focalY = Math.round(50 - (position.y / maxOffsetY) * 50);
      focalY = Math.max(0, Math.min(100, focalY));
    }

    return { focalX, focalY };
  };

  // Confirm crop:
  // Non-destructive architecture:
  // - EXISTING images: Only save focalX, focalY, zoom, and aspectRatio (no canvas export, no re-upload)
  // - NEW files (local data: or blob:): canvas.toBlob is optional preview bake with try/catch fallback
  // - Entire handleConfirm wrapped in try/catch to NEVER throw an uncaught promise rejection
  const handleConfirm = async () => {
    try {
      if (!naturalSize) {
        showModalToast("Please wait for the image to finish loading.", "warning");
        return;
      }

      const { focalX, focalY } = computeFocalPoint();
      const zoomVal = Number(zoomMultiplier.toFixed(2));

      // 1. For EXISTING / remote images (e.g. from ImageKit / CDN):
      // The app is non-destructive (original is stored, crop rendered dynamically via focal point + zoom).
      // Never attempt canvas.toBlob on cross-origin remote images.
      if (!isLocalSource) {
        onCropComplete({
          focalX,
          focalY,
          zoom: zoomVal,
          aspectRatio: selectedRatio,
        });
        return;
      }

      // 2. For NEW files picked from computer (data: or blob:):
      // Attempt to bake optional client preview blob, with full try/catch fallback to non-destructive focal point
      let previewBlob: Blob | undefined = undefined;
      try {
        if (imageRef.current) {
          const exportWidth = Math.min(naturalSize.width, 1600);
          const exportHeight = Math.round(exportWidth / ratioNum);

          const canvas = document.createElement("canvas");
          canvas.width = exportWidth;
          canvas.height = exportHeight;
          const ctx = canvas.getContext("2d");

          if (ctx) {
            const renderedW = naturalSize.width * scale;
            const renderedH = naturalSize.height * scale;

            const cropLeftInRendered = renderedW / 2 - cropBox.width / 2 - position.x;
            const cropTopInRendered = renderedH / 2 - cropBox.height / 2 - position.y;

            const srcX = cropLeftInRendered / scale;
            const srcY = cropTopInRendered / scale;
            const srcW = cropBox.width / scale;
            const srcH = cropBox.height / scale;

            ctx.drawImage(
              imageRef.current,
              srcX,
              srcY,
              srcW,
              srcH,
              0,
              0,
              exportWidth,
              exportHeight
            );

            previewBlob = await new Promise<Blob | undefined>((resolve) => {
              try {
                canvas.toBlob(
                  (blob) => resolve(blob || undefined),
                  "image/webp",
                  0.88
                );
              } catch (canvasErr) {
                console.warn("Canvas export skipped (using non-destructive focal point):", canvasErr);
                resolve(undefined);
              }
            });
          }
        }
      } catch (bakeErr) {
        console.warn("Optional canvas bake encountered error, falling back to original file:", bakeErr);
      }

      onCropComplete({
        focalX,
        focalY,
        zoom: zoomVal,
        aspectRatio: selectedRatio,
        croppedBlob: previewBlob,
      });
    } catch (err: any) {
      console.error("Cropper save error:", err);
      showModalToast(
        err?.message || "Could not save crop settings. Your adjustments remain intact.",
        "error"
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] max-w-xl w-full max-h-[96vh] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] shadow-2xl overflow-hidden flex flex-col relative">
        {/* In-modal alert / toast if an issue occurs */}
        {modalToast && (
          <div
            className={`absolute top-16 left-4 right-4 z-50 px-4 py-2.5 rounded-xl text-xs font-mono font-bold shadow-lg flex items-center justify-between transition-all ${
              modalToast.type === "error"
                ? "bg-[#D40000] text-white"
                : modalToast.type === "warning"
                ? "bg-amber-500 text-white"
                : "bg-[#0A0A0A] text-white"
            }`}
          >
            <span>{modalToast.message}</span>
            <button
              type="button"
              onClick={() => setModalToast(null)}
              className="p-1 hover:opacity-80 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-[rgba(10,10,10,0.08)] bg-[#FAF9F7]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#D40000]/10 flex items-center justify-center text-[#D40000]">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-tight text-[#0A0A0A] font-mono">
                {title}
              </h3>
              <p className="text-[11px] text-[#6B6B6B] font-mono">
                Drag in any direction • Pinch or scroll to zoom
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            aria-label="Close"
            className="p-1.5 rounded-full hover:bg-black/5 text-[#6B6B6B] hover:text-[#0A0A0A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aspect Ratio Picker (if multiple allowed) */}
        {allowedRatios.length > 1 && (
          <div className="px-5 py-2.5 bg-[#FAF9F7] border-b border-[rgba(10,10,10,0.06)] flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold text-[#6B6B6B] uppercase mr-1">
              Frame Ratio:
            </span>
            {allowedRatios.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRatio(r)}
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                  selectedRatio === r
                    ? "bg-[#D40000] text-white shadow-xs"
                    : "bg-white text-[#6B6B6B] hover:text-[#0A0A0A] border border-[rgba(10,10,10,0.08)]"
                }`}
              >
                {r === "4:3" ? "4:3 (Card)" : r === "1:1" ? "1:1 (Square)" : "4:5 (Portrait)"}
              </button>
            ))}
          </div>
        )}

        {/* Viewport container */}
        <div
          ref={containerRef}
          className="relative w-full h-[320px] sm:h-[380px] bg-[#121212] flex items-center justify-center overflow-hidden select-none"
          style={{ touchAction: "none" }}
        >
          {/* Draggable Image layer */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing"
            style={{ touchAction: "none" }}
          >
            {/* Image element with crossOrigin anonymous and cache-busted src */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imageRef}
              crossOrigin={isLocalSource ? undefined : "anonymous"}
              src={effectiveImageSrc}
              alt="Crop target"
              onLoad={onImageLoad}
              draggable={false}
              style={{
                width: naturalSize ? `${naturalSize.width * scale}px` : "auto",
                height: naturalSize ? `${naturalSize.height * scale}px` : "auto",
                maxWidth: "none",
                maxHeight: "none",
                transform: `translate(${position.x}px, ${position.y}px)`,
                transition: isDragging.current ? "none" : "transform 0.05s ease-out",
                touchAction: "none",
              }}
              className="pointer-events-none select-none"
            />
          </div>

          {/* Dark overlay mask outside cropBox */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Crop window with border and viewfinder brackets */}
            <div
              ref={cropWindowRef}
              style={{ width: `${cropBox.width}px`, height: `${cropBox.height}px`, touchAction: "none" }}
              className="relative shadow-[0_0_0_9999px_rgba(0,0,0,0.68)] rounded-xl border-2 border-white/95"
            >
              {/* Corner brackets for visual guide */}
              <span className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-[#D40000]" />
              <span className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-[#D40000]" />
              <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-[#D40000]" />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-[#D40000]" />

              {/* Center subtle crosshair / drag hint */}
              <div className="absolute inset-0 flex items-center justify-center opacity-40">
                <Move className="w-6 h-6 text-white drop-shadow-md" />
              </div>

              {/* Aspect ratio pill */}
              <div className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-md border border-white/20">
                {selectedRatio}
              </div>
            </div>
          </div>
        </div>

        {/* Controls footer */}
        <div className="p-4 sm:p-5 bg-white border-t border-[rgba(10,10,10,0.08)] flex flex-col gap-3">
          {/* Zoom Controls */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleZoomSlider(zoomMultiplier * 0.9)}
              className="p-1.5 rounded-lg bg-[#FAF9F7] hover:bg-[#F0EFEB] text-[#0A0A0A] border border-[rgba(10,10,10,0.08)] cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <input
              type="range"
              min={1}
              max={4}
              step={0.05}
              value={zoomMultiplier}
              onChange={(e) => handleZoomSlider(parseFloat(e.target.value))}
              className="flex-1 accent-[#D40000] cursor-pointer h-1.5 bg-[#FAF9F7] rounded-lg"
            />

            <button
              type="button"
              onClick={() => handleZoomSlider(zoomMultiplier * 1.1)}
              className="p-1.5 rounded-lg bg-[#FAF9F7] hover:bg-[#F0EFEB] text-[#0A0A0A] border border-[rgba(10,10,10,0.08)] cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FAF9F7] hover:bg-[#F0EFEB] text-[11px] font-mono text-[#6B6B6B] hover:text-[#0A0A0A] border border-[rgba(10,10,10,0.08)] cursor-pointer"
              title="Reset Zoom & Position"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-[rgba(10,10,10,0.08)]">
            <span className="text-[11px] font-mono text-[#6B6B6B]">
              Non-destructive positioning saved
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-full border border-[rgba(10,10,10,0.12)] text-[#6B6B6B] hover:text-[#0A0A0A] text-xs font-mono font-bold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-white text-xs font-mono font-bold cursor-pointer shadow-md hover:brightness-105 active:scale-95 transition-all"
                style={{
                  background: "linear-gradient(135deg, #FF5A4D 0%, #D40000 55%, #7A0000 100%)",
                }}
              >
                <Check className="w-4 h-4" />
                <span>Crop & Save</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
