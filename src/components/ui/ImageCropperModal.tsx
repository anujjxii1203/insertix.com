"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ZoomIn, ZoomOut, RotateCcw, Check, X, Move, Crop } from "lucide-react";

interface ImageCropperModalProps {
  imageSrc: string;
  aspectRatio?: number; // e.g. 4/3 = 1.333 for Projects, or 1 for avatars
  title?: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

export default function ImageCropperModal({
  imageSrc,
  aspectRatio = 4 / 3,
  title = "Adjust & Crop Image",
  onCropComplete,
  onCancel,
}: ImageCropperModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Natural image dimensions
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);

  // Transform state: offset (x, y) relative to crop box center, and zoom factor
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Dragging state
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const posStart = useRef({ x: 0, y: 0 });

  // Crop frame dimensions in the modal viewport
  const [cropBox, setCropBox] = useState({ width: 480, height: 360 });

  // Calculate crop box size responsive to window/container
  useEffect(() => {
    const updateCropBox = () => {
      const maxW = Math.min(window.innerWidth - 64, 560);
      const maxH = Math.min(window.innerHeight - 280, 420);

      let w = maxW;
      let h = w / aspectRatio;

      if (h > maxH) {
        h = maxH;
        w = h * aspectRatio;
      }

      setCropBox({ width: Math.round(w), height: Math.round(h) });
    };

    updateCropBox();
    window.addEventListener("resize", updateCropBox);
    return () => window.removeEventListener("resize", updateCropBox);
  }, [aspectRatio]);

  // When image loads and cropBox is known, compute minScale to cover the crop box
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    setNaturalSize({ width: nw, height: nh });

    const scaleX = cropBox.width / nw;
    const scaleY = cropBox.height / nh;
    const initialFit = Math.max(scaleX, scaleY);

    setMinScale(initialFit);
    setScale(initialFit);
    setPosition({ x: 0, y: 0 });
  };

  // Re-adjust minScale if cropBox changes
  useEffect(() => {
    if (!naturalSize) return;
    const scaleX = cropBox.width / naturalSize.width;
    const scaleY = cropBox.height / naturalSize.height;
    const fit = Math.max(scaleX, scaleY);
    setMinScale(fit);
    if (scale < fit) {
      setScale(fit);
    }
  }, [cropBox, naturalSize, scale]);

  // Bound movement so image always fully covers the crop frame
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

  // Pointer drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    posStart.current = { ...position };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
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

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const nextScale = Math.min(minScale * 3.5, Math.max(minScale, scale * zoomFactor));
    setScale(nextScale);
    setPosition((prev) => clampPosition(prev.x, prev.y, nextScale));
  };

  const handleZoomSlider = (val: number) => {
    setScale(val);
    setPosition((prev) => clampPosition(prev.x, prev.y, val));
  };

  const handleReset = () => {
    setScale(minScale);
    setPosition({ x: 0, y: 0 });
  };

  // Perform crop on high-resolution canvas
  const handleConfirm = async () => {
    if (!naturalSize || !imageRef.current) return;

    // Target export dimensions (up to 1600x1200 for 4:3)
    const exportWidth = Math.min(naturalSize.width, 1600);
    const exportHeight = Math.round(exportWidth / aspectRatio);

    const canvas = document.createElement("canvas");
    canvas.width = exportWidth;
    canvas.height = exportHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Map screen crop coordinates back to source natural image
    // Center of image in natural coords:
    const renderedW = naturalSize.width * scale;
    const renderedH = naturalSize.height * scale;

    // crop box top-left relative to rendered image center:
    const cropLeftInRendered = renderedW / 2 - cropBox.width / 2 - position.x;
    const cropTopInRendered = renderedH / 2 - cropBox.height / 2 - position.y;

    // In natural pixels:
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

    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCropComplete(blob);
        }
      },
      "image/webp",
      0.92
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] max-w-xl w-full border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(10,10,10,0.08)] bg-[#FAF9F7]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#D40000]/10 flex items-center justify-center text-[#D40000]">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-tight text-[#0A0A0A] font-mono">
                {title}
              </h3>
              <p className="text-[11px] text-[#6B6B6B] font-mono">
                Drag to reposition • Scroll or slider to zoom
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-full hover:bg-black/5 text-[#6B6B6B] hover:text-[#0A0A0A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport container */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          className="relative w-full h-[380px] bg-[#121212] flex items-center justify-center overflow-hidden select-none"
        >
          {/* Draggable Image layer */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
          >
            {/* Hidden image element to load source */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imageRef}
              src={imageSrc}
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
              }}
              className="pointer-events-none select-none"
            />
          </div>

          {/* Dark overlay mask outside cropBox */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Crop window with border and viewfinder brackets */}
            <div
              style={{ width: `${cropBox.width}px`, height: `${cropBox.height}px` }}
              className="relative shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] rounded-xl border-2 border-white/90"
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
                {aspectRatio === 1 ? "1:1 Avatar" : "4:3 Card"}
              </div>
            </div>
          </div>
        </div>

        {/* Controls footer */}
        <div className="p-4 sm:p-5 bg-white border-t border-[rgba(10,10,10,0.08)] flex flex-col gap-3">
          {/* Zoom Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleZoomSlider(Math.max(minScale, scale * 0.9))}
              className="p-1.5 rounded-lg bg-[#FAF9F7] hover:bg-[#F0EFEB] text-[#0A0A0A] border border-[rgba(10,10,10,0.08)] cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <input
              type="range"
              min={minScale}
              max={minScale * 3.5}
              step={minScale * 0.02}
              value={scale}
              onChange={(e) => handleZoomSlider(parseFloat(e.target.value))}
              className="flex-1 accent-[#D40000] cursor-pointer h-1.5 bg-[#FAF9F7] rounded-lg"
            />

            <button
              onClick={() => handleZoomSlider(Math.min(minScale * 3.5, scale * 1.1))}
              className="p-1.5 rounded-lg bg-[#FAF9F7] hover:bg-[#F0EFEB] text-[#0A0A0A] border border-[rgba(10,10,10,0.08)] cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <button
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
              Preview shows exact crop frame
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
