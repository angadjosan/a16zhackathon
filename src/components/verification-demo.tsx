'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { VerificationModal } from '@/components/ui/verification-modal';
import { ExtractionTable, ExtractedField } from '@/components/ui/extraction-table';
import ComparisonSlider from '@/components/ui/comparison-slider';
import DocumentViewer from '@/components/ui/document-viewer';
import ConfidenceBadge from '@/components/ui/confidence-badge';

// Sample data for different document types
const sampleData = {
  'sample-receipt-1': {
    title: 'Grocery Receipt',
    documentImage: 'https://placehold.co/600x900/333/FFF?text=Receipt',
    fields: [
      {
        field: 'Merchant',
        value: 'Whole Foods Market',
        confidence: 0.98,
        verified: true,
        proofHash: '0xf7a5e4d2c1b3a9f8e7d6c5b4a3f2e1d0',
        sourceText: 'Whole Foods Market',
        boundingBox: { x: 250, y: 100, width: 300, height: 40 }
      },
      {
        field: 'Date',
        value: '2025-10-08',
        confidence: 0.95,
        verified: true,
        proofHash: '0xe1d2c3b4a5f6e7d8c9b0a1f2e3d4c5',
        sourceText: 'Date: 10/08/2025',
        boundingBox: { x: 250, y: 150, width: 200, height: 30 }
      },
      {
        field: 'Total',
        value: '$124.87',
        confidence: 0.92,
        verified: false,
        proofHash: '0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5',
        sourceText: 'Total: $124.87',
        boundingBox: { x: 400, y: 500, width: 150, height: 30 }
      },
      {
        field: 'Tax',
        value: '$10.25',
        confidence: 0.94,
        verified: false,
        proofHash: '0xd1e2f3a4b5c6d7e8f9a0b1c2d3e4f5',
        sourceText: 'Tax: $10.25',
        boundingBox: { x: 400, y: 450, width: 150, height: 30 }
      }
    ]
  },
  'sample-invoice-1': {
    title: 'Office Supplies Invoice',
    documentImage: 'https://placehold.co/600x900/333/FFF?text=Invoice',
    fields: [
      {
        field: 'Invoice Number',
        value: 'INV-2025-056',
        confidence: 0.98,
        verified: true,
        proofHash: '0xf7a5e4d2c1b3a9f8e7d6c5b4a3f2e1d0',
        sourceText: 'Invoice #: INV-2025-056',
        boundingBox: { x: 300, y: 100, width: 200, height: 30 }
      },
      {
        field: 'Issue Date',
        value: '2025-10-05',
        confidence: 0.97,
        verified: true,
        proofHash: '0xe1d2c3b4a5f6e7d8c9b0a1f2e3d4c5',
        sourceText: 'Date: 10/05/2025',
        boundingBox: { x: 300, y: 150, width: 200, height: 30 }
      },
      {
        field: 'Due Date',
        value: '2025-11-04',
        confidence: 0.96,
        verified: false,
        proofHash: '0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5',
        sourceText: 'Due Date: 11/04/2025',
        boundingBox: { x: 300, y: 200, width: 200, height: 30 }
      },
      {
        field: 'Total Amount',
        value: '$587.50',
        confidence: 0.89,
        verified: false,
        proofHash: '0xd1e2f3a4b5c6d7e8f9a0b1c2d3e4f5',
        sourceText: 'Total: $587.50',
        boundingBox: { x: 400, y: 500, width: 150, height: 30 }
      },
      {
        field: 'Vendor',
        value: 'Office Supply Co.',
        confidence: 0.95,
        verified: false,
        proofHash: '0xb1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e',
        sourceText: 'Office Supply Co.',
        boundingBox: { x: 100, y: 100, width: 180, height: 40 }
      }
    ]
  },
  'sample-contract-1': {
    title: 'Service Agreement Contract',
    documentImage: 'https://placehold.co/600x900/333/FFF?text=Contract',
    fields: [
      {
        field: 'Contract ID',
        value: 'SA-2025-103',
        confidence: 0.97,
        verified: true,
        proofHash: '0xf7a5e4d2c1b3a9f8e7d6c5b4a3f2e1d0',
        sourceText: 'Contract ID: SA-2025-103',
        boundingBox: { x: 250, y: 100, width: 180, height: 30 }
      },
      {
        field: 'Effective Date',
        value: '2025-10-01',
        confidence: 0.96,
        verified: true,
        proofHash: '0xe1d2c3b4a5f6e7d8c9b0a1f2e3d4c5',
        sourceText: 'Effective Date: October 1, 2025',
        boundingBox: { x: 250, y: 150, width: 250, height: 30 }
      },
      {
        field: 'Party 1',
        value: 'TechSolutions Inc.',
        confidence: 0.94,
        verified: false,
        proofHash: '0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5',
        sourceText: 'TechSolutions Inc. ("Provider")',
        boundingBox: { x: 150, y: 200, width: 300, height: 30 }
      },
      {
        field: 'Party 2',
        value: 'Acme Corporation',
        confidence: 0.95,
        verified: false,
        proofHash: '0xd1e2f3a4b5c6d7e8f9a0b1c2d3e4f5',
        sourceText: 'Acme Corporation ("Client")',
        boundingBox: { x: 150, y: 250, width: 300, height: 30 }
      },
      {
        field: 'Contract Value',
        value: '$25,000.00',
        confidence: 0.82,
        verified: false,
        proofHash: '0xb1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e',
        sourceText: 'Total Contract Value: Twenty-five thousand dollars ($25,000.00)',
        boundingBox: { x: 150, y: 500, width: 450, height: 30 }
      }
    ]
  }
};

export default function VerificationDemo() {
  const [activeTab, setActiveTab] = useState<'details' | 'compare' | 'document'>('details');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<ExtractedField | null>(null);
  const [documentData, setDocumentData] = useState<any>(null);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  const searchParams = useSearchParams();
  const docId = searchParams?.get('docId') || 'sample-receipt-1';
  
  useEffect(() => {
    // Simulate loading data
    setIsLoading(true);
    setTimeout(() => {
      const data = sampleData[docId as keyof typeof sampleData] || sampleData['sample-receipt-1'];
      setDocumentData(data);
      setIsLoading(false);
    }, 1000);
  }, [docId]);
  
  const openModal = (field: ExtractedField) => {
    setSelectedField(field);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
  };
  
  // Simulate OCR words for document viewer
  const generateOCRWords = () => {
    if (!documentData) return [];
    
    return documentData.fields.map((field: ExtractedField) => ({
      text: field.sourceText || String(field.value),
      confidence: field.confidence,
      bounding_box: field.boundingBox
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-[600px] flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading document data...</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold mb-2">{documentData.title}</h1>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            {new Date().toLocaleDateString()}
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
            Verified with SHA-256
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
            {documentData.fields.length} Fields Extracted
          </div>
        </div>
      </motion.div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left side: Tabs and content */}
        <div className="lg:w-3/5">
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
            {/* Tab navigation */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-6 py-3 text-sm font-medium flex items-center ${
                  activeTab === 'details' 
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
                Details
              </button>
              
              <button
                onClick={() => setActiveTab('compare')}
                className={`px-6 py-3 text-sm font-medium flex items-center ${
                  activeTab === 'compare' 
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                </svg>
                Compare
              </button>
              
              <button
                onClick={() => setActiveTab('document')}
                className={`px-6 py-3 text-sm font-medium flex items-center ${
                  activeTab === 'document' 
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Document
              </button>
            </div>
            
            {/* Tab content */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {activeTab === 'details' && (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h2 className="text-lg font-semibold mb-4">Extracted Fields</h2>
                    <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-md">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Field
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Value
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Confidence
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                          {documentData.fields.map((field: ExtractedField, index: number) => (
                            <motion.tr 
                              key={index}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.1 }}
                              className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                              onClick={() => openModal(field)}
                            >
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                {field.field}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {field.value}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                <ConfidenceBadge confidence={field.confidence} />
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {field.verified ? (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                                    Verified
                                  </span>
                                ) : (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                                    Pending
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openModal(field);
                                  }}
                                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                  Verify
                                </button>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
                
                {activeTab === 'compare' && (
                  <motion.div
                    key="compare"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h2 className="text-lg font-semibold mb-4">Before/After Comparison</h2>
                    <ComparisonSlider
                      beforeImage={documentData.documentImage}
                      boundingBoxes={documentData.fields.map((field: ExtractedField) => ({
                        ...field.boundingBox,
                        fieldName: field.field,
                        confidence: field.confidence,
                      }))}
                      documentWidth={600}
                      documentHeight={900}
                    />
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                      Slide the handle to compare the original document with the AI-extracted fields
                    </p>
                  </motion.div>
                )}
                
                {activeTab === 'document' && (
                  <motion.div
                    key="document"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h2 className="text-lg font-semibold mb-4">Document with Bounding Boxes</h2>
                    <div className="relative">
                      <DocumentViewer
                        imageUrl={documentData.documentImage}
                        words={generateOCRWords()}
                        showBoundingBoxes={showBoundingBoxes}
                      />
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                          className="px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-sm flex items-center"
                        >
                          {showBoundingBoxes ? (
                            <>
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                              </svg>
                              Hide Bounding Boxes
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                              </svg>
                              Show Bounding Boxes
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          {/* Document hash info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 bg-gray-50 dark:bg-gray-800 p-5 rounded-lg shadow-sm"
          >
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Document Hash Verification</h3>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center">
                <span className="font-mono text-sm bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded mr-2 text-gray-700 dark:text-gray-300">
                  SHA-256
                </span>
                <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                  0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b
                </span>
              </div>
              <div className="flex items-center">
                <span className="font-mono text-sm bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded mr-2 text-gray-700 dark:text-gray-300">
                  Timestamp
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date().toISOString()}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Right side: Document preview */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:w-2/5"
        >
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden p-6">
            <h2 className="text-lg font-semibold mb-4">Document Preview</h2>
            <div className="relative aspect-[2/3] rounded overflow-hidden">
              <img 
                src={documentData.documentImage} 
                alt="Document Preview"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setActiveTab('compare')}
                className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                </svg>
                View Comparison
              </button>
            </div>
          </div>
          
          {/* Demo instructions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 bg-blue-50 dark:bg-blue-900/20 p-5 rounded-lg"
          >
            <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">How to Use This Demo</h3>
            <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-2">
              <li className="flex items-start">
                <svg className="w-4 h-4 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                Click on any field to verify its details
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                Switch between tabs to see different views
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                Use the comparison slider to see before/after
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                Examine the document hash for verification
              </li>
            </ul>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Verification Modal */}
      {selectedField && (
        <VerificationModal
          isOpen={isModalOpen}
          onClose={closeModal}
          field={selectedField}
          documentId="DOC-2025-001"
          documentImage={documentData.documentImage}
          docHash="0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b"
          timestamp={new Date().toISOString()}
        />
      )}
    </div>
  );
}