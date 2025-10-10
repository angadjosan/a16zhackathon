/**
 * Verification Badge Component
 * Display cryptographic verification status badge
 */

'use client';

import React from 'react';
import { generateShareableURL, copyToClipboard } from '@/utils/shareableProof';

export interface VerificationBadgeProps {
  proofId: string;
  status: 'verified' | 'pending' | 'failed';
  documentType?: string;
  fieldCount?: number;
  confidenceScore?: number;
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
  clickable?: boolean;
  onBadgeClick?: () => void;
}

export function VerificationBadge({
  proofId,
  status,
  documentType = 'document',
  fieldCount,
  confidenceScore,
  size = 'medium',
  showDetails = false,
  clickable = true,
  onBadgeClick,
}: VerificationBadgeProps) {
  const [copied, setCopied] = React.useState(false);

  // Size configurations
  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-2 text-sm',
    large: 'px-4 py-3 text-base',
  };

  // Status configurations
  const statusConfig = {
    verified: {
      icon: '✓',
      text: 'Verified',
      color: 'bg-green-500',
      textColor: 'text-white',
      borderColor: 'border-green-600',
    },
    pending: {
      icon: '⏳',
      text: 'Pending',
      color: 'bg-yellow-500',
      textColor: 'text-white',
      borderColor: 'border-yellow-600',
    },
    failed: {
      icon: '✗',
      text: 'Failed',
      color: 'bg-red-500',
      textColor: 'text-white',
      borderColor: 'border-red-600',
    },
  };

  const config = statusConfig[status];

  const handleClick = () => {
    if (clickable && onBadgeClick) {
      onBadgeClick();
    }
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = generateShareableURL(proofId);
    const success = await copyToClipboard(url.fullUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`inline-flex flex-col ${clickable ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
    >
      <div
        className={`
          ${config.color} 
          ${config.textColor} 
          ${sizeClasses[size]}
          flex items-center gap-2 rounded-lg border-2 ${config.borderColor}
          shadow-sm hover:shadow-md transition-all duration-200
          ${clickable ? 'hover:scale-105' : ''}
        `}
      >
        <span className="font-bold">{config.icon}</span>
        <span className="font-semibold">{config.text}</span>
        <span className="opacity-80">on TrustDocs</span>
      </div>

      {showDetails && (
        <div className="mt-2 text-xs text-gray-600 space-y-1">
          {documentType && (
            <div className="flex items-center gap-1">
              <span className="font-medium">Type:</span>
              <span className="capitalize">{documentType}</span>
            </div>
          )}
          {fieldCount !== undefined && (
            <div className="flex items-center gap-1">
              <span className="font-medium">Fields:</span>
              <span>{fieldCount}</span>
            </div>
          )}
          {confidenceScore !== undefined && (
            <div className="flex items-center gap-1">
              <span className="font-medium">Confidence:</span>
              <span>{(confidenceScore * 100).toFixed(1)}%</span>
            </div>
          )}
          <button
            onClick={handleCopyLink}
            className="text-blue-600 hover:text-blue-700 underline"
          >
            {copied ? '✓ Copied!' : 'Copy verification link'}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Compact inline verification badge
 */
export function InlineVerificationBadge({ proofId, status }: { proofId: string; status: 'verified' | 'pending' | 'failed' }) {
  const icons = {
    verified: '✓',
    pending: '⏳',
    failed: '✗',
  };

  const colors = {
    verified: 'text-green-600',
    pending: 'text-yellow-600',
    failed: 'text-red-600',
  };

  return (
    <span className={`inline-flex items-center gap-1 ${colors[status]} font-medium text-sm`}>
      <span>{icons[status]}</span>
      <span>Verified</span>
    </span>
  );
}

/**
 * Large verification banner
 */
export function VerificationBanner({
  proofId,
  status,
  documentType,
  extractionTimestamp,
  model,
}: {
  proofId: string;
  status: 'verified' | 'pending' | 'failed';
  documentType: string;
  extractionTimestamp: string;
  model: string;
}) {
  const shareableUrl = generateShareableURL(proofId);

  const statusConfig = {
    verified: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      icon: '✓',
      title: 'Cryptographically Verified',
      message: 'This document has been verified and authenticated.',
    },
    pending: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      icon: '⏳',
      title: 'Verification Pending',
      message: 'This document is being processed for verification.',
    },
    failed: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      icon: '✗',
      title: 'Verification Failed',
      message: 'This document could not be verified.',
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`${config.bgColor} ${config.borderColor} border-2 rounded-lg p-6 shadow-lg`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className={`${config.textColor} text-4xl`}>{config.icon}</div>
          <div>
            <h3 className={`${config.textColor} text-xl font-bold mb-1`}>{config.title}</h3>
            <p className={`${config.textColor} mb-3`}>{config.message}</p>
            <div className="space-y-1 text-sm text-gray-600">
              <div>
                <span className="font-medium">Document Type:</span>{' '}
                <span className="capitalize">{documentType}</span>
              </div>
              <div>
                <span className="font-medium">Extracted:</span>{' '}
                <span>{new Date(extractionTimestamp).toLocaleString()}</span>
              </div>
              <div>
                <span className="font-medium">Model:</span> <span>{model}</span>
              </div>
              <div>
                <span className="font-medium">Proof ID:</span>{' '}
                <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{proofId}</code>
              </div>
            </div>
          </div>
        </div>
        <a
          href={shareableUrl.fullUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          View Details →
        </a>
      </div>
    </div>
  );
}

/**
 * Verification badge with QR code
 */
export function VerificationBadgeWithQR({
  proofId,
  status,
  documentType,
}: {
  proofId: string;
  status: 'verified' | 'pending' | 'failed';
  documentType: string;
}) {
  const shareableUrl = generateShareableURL(proofId, { includeQR: true });

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-4 shadow-md max-w-sm">
      <VerificationBadge
        proofId={proofId}
        status={status}
        documentType={documentType}
        clickable={false}
        size="medium"
      />
      
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600 mb-2">Scan to verify:</p>
        {shareableUrl.qrCode && (
          <img
            src={shareableUrl.qrCode}
            alt="Verification QR Code"
            className="mx-auto w-48 h-48 border border-gray-300 rounded"
          />
        )}
        <p className="mt-2 text-xs text-gray-500 break-all">
          {shareableUrl.shortUrl}
        </p>
      </div>
    </div>
  );
}

