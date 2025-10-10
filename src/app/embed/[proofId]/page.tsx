/**
 * Embeddable Verification Widget
 * /embed/[proofId]
 * 
 * Lightweight iframe-friendly verification widget
 */

'use client';

import React from 'react';
import { use } from 'react';

interface PublicProofInfo {
  proofId: string;
  verified: boolean;
  status: 'verified' | 'pending' | 'failed';
  documentType: string;
  fieldCount: number;
  extractionTimestamp: string;
  model: string;
  confidenceScore: {
    average: number;
  };
}

export default function EmbedProofPage({ params }: { params: Promise<{ proofId: string }> }) {
  const { proofId } = use(params);
  const [proofInfo, setProofInfo] = React.useState<PublicProofInfo | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchProofInfo() {
      try {
        const response = await fetch(`/api/verify/public/${proofId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to load verification');
        }

        setProofInfo(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }

    fetchProofInfo();
  }, [proofId]);

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center bg-white p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !proofInfo) {
    return (
      <div className="min-h-full flex items-center justify-center bg-white p-4">
        <div className="text-center">
          <div className="text-red-500 text-3xl mb-2">✗</div>
          <p className="text-sm text-gray-600">Proof not found</p>
        </div>
      </div>
    );
  }

  const statusConfig = {
    verified: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-500',
      textColor: 'text-green-700',
      icon: '✓',
      label: 'Verified',
    },
    pending: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-500',
      textColor: 'text-yellow-700',
      icon: '⏳',
      label: 'Pending',
    },
    failed: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-500',
      textColor: 'text-red-700',
      icon: '✗',
      label: 'Failed',
    },
  };

  const config = statusConfig[proofInfo.status];
  const confidencePercent = (proofInfo.confidenceScore.average * 100).toFixed(0);

  return (
    <div className={`${config.bgColor} ${config.borderColor} border-l-4 p-4 min-h-full`}>
      <div className="flex items-start gap-3">
        <div className={`${config.textColor} text-2xl flex-shrink-0`}>{config.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className={`${config.textColor} font-bold text-sm`}>
              {config.label} on TrustDocs
            </h3>
          </div>
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <span className="font-medium">Type:</span>
              <span className="capitalize">{proofInfo.documentType}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">Fields:</span>
              <span>{proofInfo.fieldCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">Confidence:</span>
              <span>{confidencePercent}%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">Model:</span>
              <span>{proofInfo.model}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">Date:</span>
              <span>{new Date(proofInfo.extractionTimestamp).toLocaleDateString()}</span>
            </div>
          </div>
          <a
            href={`/verify/${proofId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-3 px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
          >
            View Full Details →
          </a>
        </div>
      </div>
    </div>
  );
}

