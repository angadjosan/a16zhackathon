import React, { useState } from 'react';
import { VerificationModal } from './verification-modal';
import ConfidenceBadge from './confidence-badge';

// Types
export interface ExtractedField {
  field: string;
  value: string | number;
  confidence: number;
  sourceText?: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  proofHash?: string;
  verified?: boolean;
}

export interface ExtractionTableProps {
  data: ExtractedField[];
  documentId: string;
  documentImage?: string;
  onFieldClick?: (field: ExtractedField) => void;
}

/**
 * Component to display extracted document data in a table format
 * Each field is clickable to show additional details and verification information
 */
export const ExtractionTable: React.FC<ExtractionTableProps> = ({
  data,
  documentId,
  documentImage,
  onFieldClick,
}) => {
  const [selectedField, setSelectedField] = useState<ExtractedField | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Sort data by confidence (lowest first to highlight potential issues)
  const sortedData = [...data].sort((a, b) => a.confidence - b.confidence);

  // Function to get confidence level class (for backwards compatibility)
  const getConfidenceClass = (confidence: number): string => {
    if (confidence >= 0.95) return 'bg-green-100 text-green-800'; // High confidence
    if (confidence >= 0.8) return 'bg-yellow-100 text-yellow-800'; // Medium confidence
    return 'bg-red-100 text-red-800'; // Low confidence
  };

  // Function to get verification badge
  const getVerificationBadge = (field: ExtractedField) => {
    if (field.verified) {
      return (
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
      );
    }
    return null;
  };

  // Handle clicking on a field
  const handleFieldClick = (field: ExtractedField) => {
    setSelectedField(field);
    setModalOpen(true);
    if (onFieldClick) {
      onFieldClick(field);
    }
  };

  // Format confidence as percentage
  const formatConfidence = (confidence: number): string => {
    return `${Math.round(confidence * 100)}%`;
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Extracted Data</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Fields are sorted by confidence level (lowest first). Click on any field for details.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Field
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Value
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Confidence
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Verification
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((field, index) => (
              <tr
                key={`${field.field}-${index}`}
                onClick={() => handleFieldClick(field)}
                className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {field.field}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{field.value}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <ConfidenceBadge confidence={field.confidence} size="sm" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getVerificationBadge(field)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Verification Modal */}
      {selectedField && (
        <VerificationModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          field={selectedField}
          documentId={documentId}
          documentImage={documentImage}
        />
      )}
    </div>
  );
};