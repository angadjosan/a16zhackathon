'use client';

import React, { useState } from 'react';
import { ExtractedField } from './extraction-table';
import ConfidenceBadge from './confidence-badge';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  field: ExtractedField;
  documentId: string;
  documentImage?: string;
}

/**
 * Modal component for displaying verification details and proof information for extracted fields
 */
export const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  field,
  documentId,
  documentImage,
}) => {
  const [showBoundingBox, setShowBoundingBox] = useState(false);

  // No longer needed as we use ConfidenceBadge component  // Format hash for display (truncate with ellipsis)
  const formatHash = (hash?: string): string => {
    if (!hash) return 'Not available';
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  };

  // Toggle showing the bounding box overlay
  const toggleBoundingBox = () => {
    setShowBoundingBox(!showBoundingBox);
  };

  if (!isOpen) return null;

  // We now use the ConfidenceBadge component directly

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Field Verification Details
                </h3>
                
                {/* Field info */}
                <div className="mt-4 border-t border-b border-gray-200 py-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-500">Field</span>
                    <span className="font-bold">{field.field}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-500">Value</span>
                    <span>{field.value}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">Confidence</span>
                    <ConfidenceBadge confidence={field.confidence} size="md" showText={true} />
                  </div>
                </div>
                
                {/* Source text */}
                {field.sourceText && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-500">Source Text</h4>
                    <div className="mt-1 p-2 bg-gray-50 rounded-md text-sm">
                      "{field.sourceText}"
                    </div>
                  </div>
                )}
                
                {/* Verification proof */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-500">Verification Proof</h4>
                  <div className="mt-1 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Document ID</span>
                      <span className="text-xs font-mono">{documentId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Proof Hash</span>
                      <span className="text-xs font-mono">{formatHash(field.proofHash)}</span>
                    </div>
                    {field.verified && (
                      <div className="flex items-center justify-center mt-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Verified
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Show on document button */}
                {field.boundingBox && documentImage && (
                  <div className="mt-4">
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      onClick={toggleBoundingBox}
                    >
                      {showBoundingBox ? 'Hide' : 'Show'} on Document
                    </button>
                    
                    {/* Document preview with bounding box */}
                    {showBoundingBox && (
                      <div className="relative mt-3 border rounded-md overflow-hidden">
                        <img 
                          src={documentImage} 
                          alt="Document" 
                          className="w-full h-auto"
                        />
                        <div 
                          className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20 pointer-events-none"
                          style={{
                            left: `${field.boundingBox.x}px`,
                            top: `${field.boundingBox.y}px`,
                            width: `${field.boundingBox.width}px`,
                            height: `${field.boundingBox.height}px`,
                          }}
                        ></div>
                      </div>
                    )}
                  </div>
                )}

                {/* Re-upload to verify button */}
                <div className="mt-4">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Re-upload to Verify
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};