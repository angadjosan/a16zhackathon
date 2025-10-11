"use client";

import { useState } from "react";
import Link from "next/link";

export default function VerificationDemo() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [documentId, setDocumentId] = useState<string>('');
  const [processingStage, setProcessingStage] = useState<string>('');

  const handleVerification = async (file: File) => {
    try {
      setIsVerifying(true);
      setProcessingStage('Processing document...');
      
      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      
      setProcessingStage('Verifying against stored proof...');
      
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          docId: documentId,
          imageBuffer: base64,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Verification failed');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setVerificationResult(data.data);
        setProcessingStage('Verification complete!');
      } else {
        throw new Error(data.error || 'Verification failed');
      }
    } catch (error) {
      console.error('Error verifying document:', error);
      setProcessingStage('Error occurred');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <main className="min-h-screen p-8 flex flex-col items-center justify-center">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-500 to-blue-600 text-transparent bg-clip-text">
            Document Verification
          </h1>
          <p className="text-xl text-slate-300 mb-6">
            Re-upload a document to verify its integrity against the original proof
          </p>
        </div>
        
        <div className="glass-card p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Step 1: Enter Document ID</h2>
          <div className="mb-6">
            <input
              type="text"
              placeholder="Enter document ID from previous upload..."
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <h2 className="text-2xl font-semibold mb-4">Step 2: Upload Document</h2>
          <p className="text-slate-300 mb-6">
            Upload the same document to verify its integrity
          </p>
          
          <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center">
            <input
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && documentId) {
                  handleVerification(file);
                }
              }}
              disabled={!documentId || isVerifying}
              className="hidden"
              id="verification-upload"
            />
            <label
              htmlFor="verification-upload"
              className={`cursor-pointer ${!documentId || isVerifying ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="text-6xl mb-4">📄</div>
              <div className="text-lg font-medium mb-2">
                {!documentId ? 'Enter Document ID first' : 'Click to upload document'}
              </div>
              <div className="text-sm text-slate-400">
                Supports JPG, PNG, PDF up to 10MB
              </div>
            </label>
          </div>
          
          {processingStage && (
            <div className="mt-4 text-sm text-blue-400">
              {processingStage}
            </div>
          )}
        </div>
        
        {/* Verification Result Display */}
        {verificationResult && (
          <div className="glass-card p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Verification Result</h2>
            
            <div className={`p-4 rounded-lg mb-6 ${
              verificationResult.verified 
                ? 'bg-green-900/20 border border-green-500' 
                : 'bg-red-900/20 border border-red-500'
            }`}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">
                  {verificationResult.verified ? '✅' : '❌'}
                </span>
                <span className="text-lg font-medium">
                  {verificationResult.verified ? 'Document Verified' : 'Verification Failed'}
                </span>
              </div>
              <p className="text-sm text-slate-300">{verificationResult.message}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Hash Comparison</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Original Hash:</span>
                    <code className="bg-slate-800 px-2 py-1 rounded text-xs ml-2">
                      {verificationResult.originalHash.substring(0, 16)}...
                    </code>
                  </div>
                  <div>
                    <span className="font-medium">New Hash:</span>
                    <code className="bg-slate-800 px-2 py-1 rounded text-xs ml-2">
                      {verificationResult.newHash.substring(0, 16)}...
                    </code>
                  </div>
                  <div>
                    <span className="font-medium">Hash Match:</span>
                    <span className={`ml-2 ${verificationResult.hashMatch ? 'text-green-400' : 'text-red-400'}`}>
                      {verificationResult.hashMatch ? '✓ Yes' : '✗ No'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Field Proofs</h3>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">All Fields Valid:</span>
                    <span className={`ml-2 ${verificationResult.fieldProofsValid ? 'text-green-400' : 'text-red-400'}`}>
                      {verificationResult.fieldProofsValid ? '✓ Yes' : '✗ No'}
                    </span>
                  </div>
                  {verificationResult.tamperedFields && verificationResult.tamperedFields.length > 0 && (
                    <div>
                      <span className="font-medium text-red-400">Tampered Fields:</span>
                      <div className="text-sm text-red-300 mt-1">
                        {verificationResult.tamperedFields.join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {verificationResult.fieldVerifications && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Individual Field Verification</h3>
                <div className="space-y-2">
                  {verificationResult.fieldVerifications.map((field: any, index: number) => (
                    <div key={index} className="bg-slate-800 p-3 rounded">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{field.field}</div>
                          <div className="text-sm text-slate-400">{field.reason}</div>
                        </div>
                        <div className={`text-sm ${field.verified ? 'text-green-400' : 'text-red-400'}`}>
                          {field.verified ? '✓ Verified' : '✗ Failed'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="flex justify-between">
          <Link href="/" className="btn-secondary flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Upload
          </Link>
          
          <Link href="/history" className="btn-primary flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            View History
          </Link>
        </div>
      </div>
    </main>
  );
}