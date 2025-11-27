"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Difference } from "@/lib/types";

// Constants
const MAGNIFIER_SIZE = 150;
const ZOOM_LEVEL = 2.5;
const THROTTLE_MS = 16; // ~60fps

interface MarkedImageProps {
  cadImageUrl: string;
  handdrawnImageUrl: string;
  differences: Difference[];
}

// Throttle function for performance
function throttle<T extends (...args: Parameters<T>) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export default function MarkedImage({ cadImageUrl, handdrawnImageUrl, differences }: MarkedImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const magnifierRef = useRef<HTMLCanvasElement>(null);

  const [showMagnifier, setShowMagnifier] = useState(false);
  const [magnifierPos, setMagnifierPos] = useState({ x: 0, y: 0 });
  const [compareMode, setCompareMode] = useState<"cad" | "handdrawn" | "slider">("cad");
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);

  const cadImageRef = useRef<HTMLImageElement | null>(null);
  const handdrawnImageRef = useRef<HTMLImageElement | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Handle global mouse/touch events for slider dragging
  useEffect(() => {
    if (compareMode !== "slider" || !isDraggingSlider) return;

    const handleGlobalMove = (clientX: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const newPosition = (x / rect.width) * 100;
      setSliderPosition(Math.max(0, Math.min(100, newPosition)));
    };

    const handleMouseMove = (e: MouseEvent) => handleGlobalMove(e.clientX);
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleGlobalMove(e.touches[0].clientX);
    };

    const handleEnd = () => setIsDraggingSlider(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDraggingSlider, compareMode]);

  // Load both images with cleanup and error handling
  useEffect(() => {
    let isMounted = true;
    const cadImg = new window.Image();
    const handdrawnImg = new window.Image();
    let loadedCount = 0;

    const onLoad = () => {
      loadedCount++;
      if (loadedCount === 2 && isMounted) {
        cadImageRef.current = cadImg;
        handdrawnImageRef.current = handdrawnImg;
        setImagesLoaded(true);
        setImageError(null);
      }
    };

    const onError = () => {
      if (isMounted) {
        setImageError("Fehler beim Laden der Bilder");
      }
    };

    cadImg.onload = onLoad;
    cadImg.onerror = onError;
    handdrawnImg.onload = onLoad;
    handdrawnImg.onerror = onError;

    cadImg.src = cadImageUrl;
    handdrawnImg.src = handdrawnImageUrl;

    return () => {
      isMounted = false;
      cadImg.onload = null;
      cadImg.onerror = null;
      handdrawnImg.onload = null;
      handdrawnImg.onerror = null;
    };
  }, [cadImageUrl, handdrawnImageUrl]);

  // Draw main canvas
  useEffect(() => {
    if (!imagesLoaded) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const cadImg = cadImageRef.current;
    const handdrawnImg = handdrawnImageRef.current;

    if (!canvas || !container || !cadImg || !handdrawnImg) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const containerWidth = container.clientWidth;
    const aspectRatio = cadImg.height / cadImg.width;
    const canvasHeight = containerWidth * aspectRatio;

    canvas.width = containerWidth;
    canvas.height = canvasHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (compareMode === "slider") {
      const sliderX = (sliderPosition / 100) * canvas.width;

      // Draw handdrawn on left side
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, sliderX, canvas.height);
      ctx.clip();
      ctx.drawImage(handdrawnImg, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      // Draw CAD on right side
      ctx.save();
      ctx.beginPath();
      ctx.rect(sliderX, 0, canvas.width - sliderX, canvas.height);
      ctx.clip();
      ctx.drawImage(cadImg, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      // Draw slider line
      ctx.beginPath();
      ctx.moveTo(sliderX, 0);
      ctx.lineTo(sliderX, canvas.height);
      ctx.strokeStyle = "#3B82F6";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw slider handle
      ctx.beginPath();
      ctx.arc(sliderX, canvas.height / 2, 20, 0, 2 * Math.PI);
      ctx.fillStyle = "#3B82F6";
      ctx.fill();
      ctx.fillStyle = "white";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("↔", sliderX, canvas.height / 2);
    } else if (compareMode === "handdrawn") {
      ctx.drawImage(handdrawnImg, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.drawImage(cadImg, 0, 0, canvas.width, canvas.height);
    }

    // Draw markers (only on CAD or slider mode)
    if (compareMode !== "handdrawn") {
      differences.forEach((diff) => {
        if (!diff.coordinates) return;

        const x = (diff.coordinates.x / 100) * canvas.width;
        const y = (diff.coordinates.y / 100) * canvas.height;

        const colors = {
          critical: "#EF4444",
          major: "#F59E0B",
          minor: "#3B82F6",
        };
        const color = colors[diff.severity];

        ctx.beginPath();
        ctx.arc(x, y, 20, 0, 2 * Math.PI);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x, y, 12, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();

        ctx.fillStyle = "white";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(diff.id.toString(), x, y);
      });
    }
  }, [differences, imagesLoaded, compareMode, sliderPosition]);

  // Magnifier update function
  const doUpdateMagnifier = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    const magnifier = magnifierRef.current;
    const cadImg = cadImageRef.current;
    const handdrawnImg = handdrawnImageRef.current;

    if (!canvas || !magnifier || !cadImg || !handdrawnImg) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    setMagnifierPos({ x: clientX, y: clientY });

    const magnifierCtx = magnifier.getContext("2d");
    if (!magnifierCtx) return;

    magnifier.width = MAGNIFIER_SIZE;
    magnifier.height = MAGNIFIER_SIZE;

    // Calculate scale between original image and displayed canvas
    const scaleX = cadImg.width / canvas.width;
    const scaleY = cadImg.height / canvas.height;

    // Map mouse position to original image coordinates
    const imgX = x * scaleX;
    const imgY = y * scaleY;

    // Calculate source pixels to sample (uses full image resolution)
    const sourceWidth = (MAGNIFIER_SIZE / ZOOM_LEVEL) * scaleX;
    const sourceHeight = (MAGNIFIER_SIZE / ZOOM_LEVEL) * scaleY;

    const sourceX = imgX - sourceWidth / 2;
    const sourceY = imgY - sourceHeight / 2;

    // Clear and draw circular mask
    magnifierCtx.clearRect(0, 0, MAGNIFIER_SIZE, MAGNIFIER_SIZE);
    magnifierCtx.save();
    magnifierCtx.beginPath();
    magnifierCtx.arc(MAGNIFIER_SIZE / 2, MAGNIFIER_SIZE / 2, MAGNIFIER_SIZE / 2 - 2, 0, 2 * Math.PI);
    magnifierCtx.clip();

    // Draw appropriate image based on mode and mouse position
    let imgToDraw: HTMLImageElement;
    if (compareMode === "handdrawn") {
      imgToDraw = handdrawnImg;
    } else if (compareMode === "slider") {
      const sliderX = (sliderPosition / 100) * rect.width;
      imgToDraw = x < sliderX ? handdrawnImg : cadImg;
    } else {
      imgToDraw = cadImg;
    }

    magnifierCtx.drawImage(
      imgToDraw,
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, MAGNIFIER_SIZE, MAGNIFIER_SIZE
    );

    magnifierCtx.restore();

    // Draw border
    magnifierCtx.beginPath();
    magnifierCtx.arc(MAGNIFIER_SIZE / 2, MAGNIFIER_SIZE / 2, MAGNIFIER_SIZE / 2 - 2, 0, 2 * Math.PI);
    magnifierCtx.strokeStyle = "#3B82F6";
    magnifierCtx.lineWidth = 3;
    magnifierCtx.stroke();

    // Draw crosshair
    magnifierCtx.beginPath();
    magnifierCtx.moveTo(MAGNIFIER_SIZE / 2 - 10, MAGNIFIER_SIZE / 2);
    magnifierCtx.lineTo(MAGNIFIER_SIZE / 2 + 10, MAGNIFIER_SIZE / 2);
    magnifierCtx.moveTo(MAGNIFIER_SIZE / 2, MAGNIFIER_SIZE / 2 - 10);
    magnifierCtx.lineTo(MAGNIFIER_SIZE / 2, MAGNIFIER_SIZE / 2 + 10);
    magnifierCtx.strokeStyle = "rgba(59, 130, 246, 0.7)";
    magnifierCtx.lineWidth = 1;
    magnifierCtx.stroke();
  }, [compareMode, sliderPosition]);

  // Throttled version of magnifier update
  const throttledUpdateRef = useRef<ReturnType<typeof throttle<typeof doUpdateMagnifier>> | null>(null);

  useEffect(() => {
    throttledUpdateRef.current = throttle(doUpdateMagnifier, THROTTLE_MS);
  }, [doUpdateMagnifier]);

  const updateMagnifier = useCallback((clientX: number, clientY: number) => {
    throttledUpdateRef.current?.(clientX, clientY);
  }, []);

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (isDraggingSlider) return;
    updateMagnifier(clientX, clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handlePointerMove(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (isDraggingSlider) return;
    const touch = e.touches[0];
    handlePointerMove(touch.clientX, touch.clientY);
  };

  const handlePointerDown = (clientX: number) => {
    if (compareMode === "slider") {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;

      setIsDraggingSlider(true);
      const newPosition = (x / rect.width) * 100;
      setSliderPosition(Math.max(0, Math.min(100, newPosition)));
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handlePointerDown(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const touch = e.touches[0];
    handlePointerDown(touch.clientX);
    setShowMagnifier(true);
  };

  const handlePointerUp = () => {
    setIsDraggingSlider(false);
  };

  if (imageError) {
    return (
      <div className="w-full p-8 text-center text-red-600 bg-red-50 rounded-lg" role="alert">
        {imageError}
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Compare mode toggle */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Anzeigemodus">
        <button
          onClick={() => setCompareMode("cad")}
          aria-pressed={compareMode === "cad"}
          className={`px-4 py-2 rounded-lg font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            compareMode === "cad"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          CAD-Plan
        </button>
        <button
          onClick={() => setCompareMode("handdrawn")}
          aria-pressed={compareMode === "handdrawn"}
          className={`px-4 py-2 rounded-lg font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            compareMode === "handdrawn"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Handzeichnung
        </button>
        <button
          onClick={() => setCompareMode("slider")}
          aria-pressed={compareMode === "slider"}
          className={`px-4 py-2 rounded-lg font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            compareMode === "slider"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Vergleichs-Slider
        </button>
      </div>

      {compareMode === "slider" && (
        <p className="text-sm text-gray-600">
          Ziehen Sie den Slider, um zwischen Handzeichnung (links) und CAD-Plan (rechts) zu vergleichen.
        </p>
      )}

      <p className="text-sm text-gray-600">
        Bewegen Sie die Maus oder den Finger über das Bild, um die Lupe zu aktivieren.
      </p>

      {/* Canvas container */}
      <div
        ref={containerRef}
        className="w-full relative"
        onMouseLeave={() => {
          setShowMagnifier(false);
          setIsDraggingSlider(false);
        }}
        onTouchEnd={() => {
          setShowMagnifier(false);
          setIsDraggingSlider(false);
        }}
      >
        <canvas
          ref={canvasRef}
          className={`w-full touch-none ${compareMode === "slider" ? "cursor-ew-resize" : "cursor-crosshair"}`}
          onMouseEnter={() => setShowMagnifier(true)}
          onMouseLeave={() => setShowMagnifier(false)}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handlePointerUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handlePointerUp}
          role="img"
          aria-label={`Planvergleich: ${compareMode === "cad" ? "CAD-Plan" : compareMode === "handdrawn" ? "Handzeichnung" : "Vergleichs-Slider"} mit ${differences.length} markierten Unterschieden`}
        />

        {/* Magnifier */}
        {showMagnifier && !isDraggingSlider && (
          <canvas
            ref={magnifierRef}
            className="pointer-events-none fixed z-50 rounded-full shadow-lg"
            style={{
              width: MAGNIFIER_SIZE,
              height: MAGNIFIER_SIZE,
              left: magnifierPos.x + 20,
              top: magnifierPos.y - MAGNIFIER_SIZE / 2,
            }}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}
