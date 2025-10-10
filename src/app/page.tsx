"use client";

import { useState } from "react";
import Link from "next/link";
import UploadZone from "@/components/ui/upload-zone";

export default function Home() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [documentId, setDocumentId] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          const next = prev + 10;
          if (next >= 90) {
            clearInterval(interval);
            return 90;
          }
          return next;
        });
      }, 300);
      
      // Create FormData and send to API
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      clearInterval(interval);
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      setDocumentId(data.docId);
      setUploadProgress(100);
      
      // Redirect to extraction page after successful upload
      if (data.docId) {
        // For now we'll just set the progress to 100
        // Later we'll redirect to the extraction page
        console.log('Document uploaded successfully', data.docId);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 flex flex-col items-center justify-center">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-transparent bg-clip-text">
            TrustDocs
          </h1>
          <p className="text-xl text-slate-300 mb-6">
            Upload documents, extract data with AI, and get cryptographic proofs for each field
          </p>
        </div>
        
        <div className="flex mb-8">
          <div className="glass-card flex-1 p-6">
            <h2 className="text-2xl font-semibold mb-4">Upload Document</h2>
            <p className="text-slate-300 mb-6">
              Drag and drop your document (receipt, invoice, or contract) or click to browse
            </p>
            
            <UploadZone 
              onUpload={handleUpload} 
              isUploading={isUploading}
              progress={uploadProgress}
            />
            
            <div className="mt-6 text-sm text-slate-400">
              Supports JPG, PNG, PDF up to 10MB
            </div>
          </div>
        </div>
        
        <div className="flex justify-between">
          <Link href="/history" className="btn-secondary flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            View History
          </Link>
          
          <button className="btn-primary flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Try Sample Documents
          </button>
        </div>
      </div>
    </main>
  );
}