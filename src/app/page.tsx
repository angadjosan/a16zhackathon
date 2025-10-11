"use client";

import { useState } from "react";
import Link from "next/link";
import UploadZone from "@/components/ui/upload-zone";
import DocumentViewer from "@/components/ui/document-viewer";

export default function Home() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [selectedField, setSelectedField] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setProcessingStage('Uploading document...');
      
      // Create FormData and send to API
      const formData = new FormData();
      formData.append('file', file);
      
      setProcessingStage('Processing with AI...');
      setUploadProgress(20);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setDocumentId(data.data.fileId);
        setExtractedData(data.data);
        setUploadProgress(100);
        setProcessingStage('Complete!');
        
        console.log('Document processed successfully:', data.data.fileId);
        console.log('Full response data:', data.data);
        console.log('Document type:', data.data.documentType);
        console.log('Document hash:', data.data.docHash);
        console.log('Extracted fields:', data.data.extractedFields);
        console.log('OCR data:', data.data.ocrData);
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      setUploadProgress(0);
      setProcessingStage('Error occurred');
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
            
            {processingStage && (
              <div className="mt-4 text-sm text-blue-400">
                {processingStage}
              </div>
            )}
            
            <div className="mt-6 text-sm text-slate-400">
              Supports JPG, PNG, PDF up to 10MB
            </div>
          </div>
        </div>
        
        {/* Document Viewer with Bounding Boxes */}
        {extractedData && (
          <div className="glass-card p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Document Preview</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="h-[600px]">
                  <DocumentViewer
                    imageUrl={extractedData.imageUrl}
                    words={extractedData.ocrData?.words || []}
                    showBoundingBoxes={true}
                    selectedField={selectedField || undefined}
                  />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-4">Extracted Fields</h3>
                {extractedData.extractedFields && extractedData.extractedFields.length > 0 ? (
                  <div className="space-y-2">
                    {extractedData.extractedFields.map((field: any, index: number) => (
                      <div 
                        key={index} 
                        className={`bg-slate-800 p-3 rounded cursor-pointer transition-colors ${
                          selectedField === field.field ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => setSelectedField(selectedField === field.field ? null : field.field)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-blue-400">{field.field}</div>
                            <div className="text-sm text-slate-300">{field.value}</div>
                            <div className="text-xs text-slate-400">Source: "{field.sourceText}"</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-green-400">{(field.confidence * 100).toFixed(1)}%</div>
                            <div className="text-xs text-slate-500">Proof: {field.proofHash.substring(0, 8)}...</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-400 text-sm">
                    No fields extracted yet. Processing...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Extracted Data Display */}
        {extractedData && (
          <div className="glass-card p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Document Info</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Document Details</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Type:</span> {extractedData.documentType}</div>
                  <div><span className="font-medium">Hash:</span> <code className="bg-slate-800 px-2 py-1 rounded text-xs">{extractedData.docHash.substring(0, 16)}...</code></div>
                  <div><span className="font-medium">Processing Time:</span> {extractedData.processingTime}ms</div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">OCR Statistics</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Words Detected:</span> {extractedData.ocrData?.words?.length || 0}</div>
                  <div><span className="font-medium">Fields Extracted:</span> {extractedData.extractedFields?.length || 0}</div>
                  <div><span className="font-medium">OCR Confidence:</span> {extractedData.ocrData?.confidence ? (extractedData.ocrData.confidence * 100).toFixed(1) + '%' : 'N/A'}</div>
                  <div><span className="font-medium">Average Field Confidence:</span> {extractedData.extractedFields?.length > 0 ? 
                    ((extractedData.extractedFields.reduce((sum: number, f: any) => sum + f.confidence, 0) / extractedData.extractedFields.length) * 100).toFixed(1) + '%' : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-between">
          <Link href="/history" className="btn-secondary flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            View History
          </Link>
          
          <div className="flex gap-4">
            <Link href="/verification-demo" className="btn-secondary flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12l2 2 4-4"/>
                <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
                <path d="M12 3c0 1-1 3-3 3s-3-2-3-3 1-3 3-3 3 2 3 3"/>
                <path d="M12 21c0-1 1-3 3-3s3 2 3 3-1 3-3 3-3-2-3-3"/>
              </svg>
              Verify Document
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
      </div>
    </main>
  );
}