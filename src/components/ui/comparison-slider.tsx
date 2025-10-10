'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface ComparisonSliderProps {
  beforeImage: string; // URL for the original document
  afterImage?: string; // URL for the marked document with bounding boxes (optional)
  boundingBoxes?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    fieldName: string;
    confidence: number;
  }>;
  documentWidth: number;
  documentHeight: number;
}

export default function ComparisonSlider({
  beforeImage,
  afterImage,
  boundingBoxes = [],
  documentWidth,
  documentHeight
}: ComparisonSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && sliderRef.current) {
      const rect = sliderRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(position);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging && sliderRef.current && e.touches[0]) {
      const rect = sliderRef.current.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(position);
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div 
      ref={sliderRef}
      className="relative w-full overflow-hidden rounded-lg shadow-lg"
      style={{ height: `${documentHeight}px`, maxHeight: '80vh' }}
    >
      {/* Before image (original document) */}
      <div className="absolute top-0 left-0 w-full h-full">
        <Image
          src={beforeImage}
          alt="Original document"
          fill
          style={{ objectFit: 'contain' }}
        />
      </div>

      {/* After image (with bounding boxes) */}
      <div 
        className="absolute top-0 left-0 h-full overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        {afterImage ? (
          <Image
            src={afterImage}
            alt="Document with extracted fields"
            fill
            style={{ objectFit: 'contain' }}
          />
        ) : (
          <div className="relative w-full h-full">
            <Image
              src={beforeImage}
              alt="Original document with highlights"
              fill
              style={{ objectFit: 'contain' }}
            />
            {/* Render bounding boxes */}
            {boundingBoxes.map((box, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="absolute border-2 border-blue-500 bg-blue-500/20 flex items-center justify-center"
                style={{
                  left: `${box.x}px`,
                  top: `${box.y}px`,
                  width: `${box.width}px`,
                  height: `${box.height}px`,
                }}
              >
                <div className="absolute -top-7 left-0 bg-blue-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {box.fieldName} ({Math.round(box.confidence * 100)}%)
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Slider control */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-blue-500">
          <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 18L3 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Label */}
      <div className="absolute top-4 left-4 bg-gray-900/80 text-white text-sm px-2 py-1 rounded">
        Slide to compare
      </div>
    </div>
  );
}