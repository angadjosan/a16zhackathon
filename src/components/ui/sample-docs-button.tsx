'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

interface SampleDoc {
  id: string;
  name: string;
  type: 'receipt' | 'invoice' | 'contract';
  thumbnailUrl: string;
  description: string;
}

const sampleDocuments: SampleDoc[] = [
  {
    id: 'sample-receipt-1',
    name: 'Grocery Receipt',
    type: 'receipt',
    thumbnailUrl: 'https://placehold.co/200x280/333/FFF?text=Receipt',
    description: 'A clear grocery store receipt with multiple line items and taxes.'
  },
  {
    id: 'sample-invoice-1',
    name: 'Office Supplies Invoice',
    type: 'invoice',
    thumbnailUrl: 'https://placehold.co/200x280/333/FFF?text=Invoice',
    description: 'A standard office supplies invoice with company details and payment terms.'
  },
  {
    id: 'sample-contract-1',
    name: 'Service Agreement',
    type: 'contract',
    thumbnailUrl: 'https://placehold.co/200x280/333/FFF?text=Contract',
    description: 'A consultant service agreement contract with terms and conditions.'
  }
];

export default function SampleDocsButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 mr-2" 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path 
            fillRule="evenodd" 
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" 
            clipRule="evenodd" 
          />
        </svg>
        Try with Sample Docs
      </motion.button>

      <motion.div 
        className={`absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 overflow-hidden ${!isOpen ? 'hidden' : ''}`}
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: isOpen ? 1 : 0, height: isOpen ? 'auto' : 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">Choose a sample document</h3>
          <div className="space-y-4">
            {sampleDocuments.map((doc) => (
              <Link
                key={doc.id}
                href={`/verification-demo?docId=${doc.id}`}
                className="flex items-start p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <div className="flex-shrink-0 h-14 w-10 relative overflow-hidden rounded-md">
                  <Image
                    src={doc.thumbnailUrl}
                    alt={doc.name}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900 dark:text-white">{doc.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{doc.description}</p>
                  <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-t border-gray-200 dark:border-gray-600">
          <motion.button 
            className="w-full text-center text-sm text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
            onClick={() => setIsOpen(false)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Close
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}