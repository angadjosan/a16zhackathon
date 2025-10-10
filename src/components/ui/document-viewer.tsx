"use client";

import { useState } from "react";
import Image from "next/image";
import BoundingBoxOverlay from "./bounding-box-overlay";

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface OCRWord {
  text: string;
  confidence: number;
  bounding_box: BoundingBox;
}

interface DocumentViewerProps {
  imageUrl: string;
  words: OCRWord[];
  showBoundingBoxes?: boolean;
  selectedField?: string;
}

export default function DocumentViewer({ 
  imageUrl, 
  words = [],
  showBoundingBoxes = true,
  selectedField
}: DocumentViewerProps) {
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  
  // Handle image load to get dimensions
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight
    });
  };

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden bg-slate-900">
      {/* Document Image */}
      <div className="relative w-full h-full">
        <Image
          src={imageUrl}
          alt="Document"
          className="object-contain"
          fill
          priority
          onLoad={handleImageLoad}
        />
        
        {/* Bounding Box Overlay */}
        {showBoundingBoxes && words.length > 0 && imageDimensions.width > 0 && (
          <BoundingBoxOverlay
            words={words}
            imageWidth={imageDimensions.width}
            imageHeight={imageDimensions.height}
            selectedField={selectedField}
          />
        )}
      </div>
    </div>
  );
}