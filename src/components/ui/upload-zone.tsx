"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";

interface UploadZoneProps {
  onUpload: (file: File) => void;
  isUploading: boolean;
  progress: number;
}

export default function UploadZone({ onUpload, isUploading, progress }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, []);
  
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, []);
  
  const processFile = useCallback((file: File) => {
    try {
      // Check if file is valid (type, size, etc.)
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!validTypes.includes(file.type)) {
        alert('Invalid file type. Please upload JPG, PNG, or PDF.');
        return;
      }
      
      if (file.size > maxSize) {
        alert('File too large. Maximum size is 10MB.');
        return;
      }
      
      // Create a preview URL for images
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        // For PDFs, we could use a PDF icon or generate a thumbnail
        setPreviewUrl(null);
      }
      
      onUpload(file);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file. Please try again.');
    }
  }, [onUpload]);
  
  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-8 transition-all
        ${isDragging 
          ? 'border-blue-500 bg-blue-500/10' 
          : 'border-slate-600 hover:border-slate-400'
        }
        ${isUploading ? 'cursor-wait' : 'cursor-pointer'}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileInputChange}
        accept=".jpg,.jpeg,.png,.pdf"
        disabled={isUploading}
      />
      
      <div className="flex flex-col items-center justify-center py-4">
        {!isUploading && !previewUrl && (
          <>
            <div className="w-16 h-16 mb-4 text-blue-500">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <p className="text-center text-slate-300">
              Drag & drop your document here<br />
              <span className="text-slate-400 text-sm">or click to browse</span>
            </p>
          </>
        )}
        
        {!isUploading && previewUrl && (
          <div className="relative w-64 h-64 mb-4">
            <Image
              src={previewUrl}
              alt="Document preview"
              fill
              className="object-contain rounded-md"
            />
          </div>
        )}
        
        {isUploading && (
          <div className="w-full">
            <div className="mb-2 text-center text-slate-300">
              {progress < 100 ? 'Uploading...' : 'Processing...'}
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-2 text-center text-slate-400 text-sm">
              {progress}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
}