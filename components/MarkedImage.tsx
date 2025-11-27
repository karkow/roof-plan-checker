"use client";

import { useEffect, useRef, useState } from "react";

interface Difference {
  id: number;
  location: string;
  description: string;
  severity: "critical" | "major" | "minor";
  coordinates?: { x: number; y: number };
}

interface MarkedImageProps {
  cadImageUrl: string;
  handdrawnImageUrl: string;
  differences: Difference[];
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

  const magnifierSize = 150;
  const zoomLevel = 2.5;

  // Handle global mouse events for slider dragging
  useEffect(() => {
    if (compareMode !== "slider") return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDraggingSlider) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const newPosition = (x / rect.width) * 100;
      setSliderPosition(Math.max(0, Math.min(100, newPosition)));
    };

    const handleGlobalMouseUp = () => {
      setIsDraggingSlider(false);
    };

    if (isDraggingSlider) {
      window.addEventListener("mousemove", handleGlobalMouseMove);
      window.addEventListener("mouseup", handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDraggingSlider, compareMode]);

  // Load both images
  useEffect(() => {
    const cadImg = new window.Image();
    const handdrawnImg = new window.Image();
    let loadedCount = 0;

    const onLoad = () => {
      loadedCount++;
      if (loadedCount === 2) {
        cadImageRef.current = cadImg;
        handdrawnImageRef.current = handdrawnImg;
        setImagesLoaded(true);
      }
    };

    cadImg.onload = onLoad;
    handdrawnImg.onload = onLoad;
    cadImg.src = cadImageUrl;
    handdrawnImg.src = handdrawnImageUrl;
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
      // Draw handdrawn on left side
      const sliderX = (sliderPosition / 100) * canvas.width;

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

  // Handle magnifier
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const magnifier = magnifierRef.current;
    const cadImg = cadImageRef.current;
    const handdrawnImg = handdrawnImageRef.current;

    if (!canvas || !magnifier || !cadImg || !handdrawnImg) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Handle slider dragging
    if (isDraggingSlider && compareMode === "slider") {
      const newPosition = (x / rect.width) * 100;
      setSliderPosition(Math.max(0, Math.min(100, newPosition)));
      return;
    }

    setMagnifierPos({ x: e.clientX, y: e.clientY });

    // Draw magnified view
    const magnifierCtx = magnifier.getContext("2d");
    if (!magnifierCtx) return;

    magnifier.width = magnifierSize;
    magnifier.height = magnifierSize;

    const scaleX = cadImg.width / canvas.width;
    const scaleY = cadImg.height / canvas.height;

    const sourceX = x * scaleX - (magnifierSize / zoomLevel / 2);
    const sourceY = y * scaleY - (magnifierSize / zoomLevel / 2);
    const sourceWidth = magnifierSize / zoomLevel;
    const sourceHeight = magnifierSize / zoomLevel;

    // Clear and draw circular mask
    magnifierCtx.clearRect(0, 0, magnifierSize, magnifierSize);
    magnifierCtx.save();
    magnifierCtx.beginPath();
    magnifierCtx.arc(magnifierSize / 2, magnifierSize / 2, magnifierSize / 2 - 2, 0, 2 * Math.PI);
    magnifierCtx.clip();

    // Draw the appropriate image in magnifier
    const imgToDraw = compareMode === "handdrawn" ? handdrawnImg : cadImg;
    magnifierCtx.drawImage(
      imgToDraw,
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, magnifierSize, magnifierSize
    );

    magnifierCtx.restore();

    // Draw border
    magnifierCtx.beginPath();
    magnifierCtx.arc(magnifierSize / 2, magnifierSize / 2, magnifierSize / 2 - 2, 0, 2 * Math.PI);
    magnifierCtx.strokeStyle = "#3B82F6";
    magnifierCtx.lineWidth = 3;
    magnifierCtx.stroke();

    // Draw crosshair
    magnifierCtx.beginPath();
    magnifierCtx.moveTo(magnifierSize / 2 - 10, magnifierSize / 2);
    magnifierCtx.lineTo(magnifierSize / 2 + 10, magnifierSize / 2);
    magnifierCtx.moveTo(magnifierSize / 2, magnifierSize / 2 - 10);
    magnifierCtx.lineTo(magnifierSize / 2, magnifierSize / 2 + 10);
    magnifierCtx.strokeStyle = "rgba(59, 130, 246, 0.7)";
    magnifierCtx.lineWidth = 1;
    magnifierCtx.stroke();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (compareMode === "slider") {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;

      // Start dragging and immediately move slider to click position
      setIsDraggingSlider(true);
      const newPosition = (x / rect.width) * 100;
      setSliderPosition(Math.max(0, Math.min(100, newPosition)));
    }
  };

  const handleMouseUp = () => {
    setIsDraggingSlider(false);
  };

  return (
    <div className="w-full space-y-4">
      {/* Compare mode toggle */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCompareMode("cad")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            compareMode === "cad"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          CAD-Plan
        </button>
        <button
          onClick={() => setCompareMode("handdrawn")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            compareMode === "handdrawn"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Handzeichnung
        </button>
        <button
          onClick={() => setCompareMode("slider")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
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
        Bewegen Sie die Maus über das Bild, um die Lupe zu aktivieren.
      </p>

      {/* Canvas container */}
      <div
        ref={containerRef}
        className="w-full relative"
        onMouseLeave={() => {
          setShowMagnifier(false);
          setIsDraggingSlider(false);
        }}
      >
        <canvas
          ref={canvasRef}
          className={`w-full ${compareMode === "slider" ? "cursor-ew-resize" : "cursor-crosshair"}`}
          onMouseEnter={() => setShowMagnifier(true)}
          onMouseLeave={() => setShowMagnifier(false)}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        />

        {/* Magnifier */}
        {showMagnifier && !isDraggingSlider && (
          <canvas
            ref={magnifierRef}
            className="pointer-events-none fixed z-50 rounded-full shadow-lg"
            style={{
              width: magnifierSize,
              height: magnifierSize,
              left: magnifierPos.x + 20,
              top: magnifierPos.y - magnifierSize / 2,
            }}
          />
        )}
      </div>
    </div>
  );
}
