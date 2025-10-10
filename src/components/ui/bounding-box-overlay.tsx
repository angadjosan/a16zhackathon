"use client";

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

interface BoundingBoxOverlayProps {
  words: OCRWord[];
  imageWidth: number;
  imageHeight: number;
  selectedField?: string;
}

export default function BoundingBoxOverlay({ 
  words, 
  imageWidth, 
  imageHeight,
  selectedField 
}: BoundingBoxOverlayProps) {
  // Filter words if a specific field is selected
  const wordsToShow = words;
  
  // Calculate SVG viewBox based on image dimensions
  const viewBox = `0 0 ${imageWidth} ${imageHeight}`;

  // Generate a unique color for each word based on its confidence
  const getColorForConfidence = (confidence: number) => {
    if (confidence >= 0.95) return "rgba(34, 197, 94, 0.5)"; // Green with transparency
    if (confidence >= 0.8) return "rgba(234, 179, 8, 0.5)";  // Yellow with transparency
    return "rgba(239, 68, 68, 0.5)"; // Red with transparency
  };

  return (
    <svg
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
    >
      {wordsToShow.map((word, index) => (
        <rect
          key={index}
          x={word.bounding_box.x}
          y={word.bounding_box.y}
          width={word.bounding_box.width}
          height={word.bounding_box.height}
          fill={getColorForConfidence(word.confidence)}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="2,2"
        />
      ))}
    </svg>
  );
}