/**
 * Public Verification Display Page
 * /verify/[proofId]
 * 
 * Publicly accessible page showing verification details
 */

'use client';

import React from 'react';
import { use } from 'react';
import {
  VerificationBadge,
  VerificationBanner,
  VerificationBadgeWithQR,
} from '@/components/VerificationBadge';
import {
  generateShareableURL,
  generateSocialShareURLs,
  generateEmbedCode,
  copyToClipboard,
} from '@/utils/shareableProof';

interface PublicProofInfo {
  proofId: string;
  verified: boolean;
  status: 'verified' | 'pending' | 'failed';
  documentType: string;
  fieldCount: number;
  extractionTimestamp: string;
  verificationTimestamp: string | null;
  model: string;
  platform: string;
  confidenceScore: {
    average: number;
    min: number;
    max: number;
  };
  verificationHistory: {
    totalVerifications: number;
    successfulVerifications: number;
    failedVerifications: number;
    lastVerificationTime: string | null;
  };
  metadata: {
    attestationId: string;
    merkleRoot: string;
  };
}

export default function VerifyProofPage({ params }: { params: Promise<{ proofId: string }> }) {
  const { proofId } = use(params);
  const [proofInfo, setProofInfo] = React.useState<PublicProofInfo | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showEmbedCode, setShowEmbedCode] = React.useState(false);
  const [copiedEmbed, setCopiedEmbed] = React.useState(false);

  React.useEffect(() => {
    async function fetchProofInfo() {
      try {
        const response = await fetch(`/api/verify/public/${proofId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to load verification information');
        }

        setProofInfo(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load proof');
      } finally {
        setLoading(false);
      }
    }

    fetchProofInfo();
  }, [proofId]);

  const handleCopyEmbedCode = async () => {
    const embedCode = generateEmbedCode(proofId);
    const success = await copyToClipboard(embedCode);
    if (success) {
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading verification information...</p>
        </div>
      </div>
    );
  }

  if (error || !proofInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 text-5xl mb-4">✗</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Proof Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The requested verification proof does not exist.'}</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  const shareUrls = generateSocialShareURLs(proofId, proofInfo.documentType);
  const shareableUrl = generateShareableURL(proofId, { includeQR: true });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🔐</div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">TrustDocs</h1>
                <p className="text-sm text-gray-500">Verification Portal</p>
              </div>
            </div>
            <VerificationBadge
              proofId={proofId}
              status={proofInfo.status}
              size="medium"
              clickable={false}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Verification Banner */}
        <VerificationBanner
          proofId={proofId}
          status={proofInfo.status}
          documentType={proofInfo.documentType}
          extractionTimestamp={proofInfo.extractionTimestamp}
          model={proofInfo.model}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Document Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>📄</span>
                <span>Document Information</span>
              </h2>
              <div className="space-y-3">
                <InfoRow label="Document Type" value={proofInfo.documentType} capitalize />
                <InfoRow label="Fields Extracted" value={proofInfo.fieldCount.toString()} />
                <InfoRow
                  label="Extraction Date"
                  value={new Date(proofInfo.extractionTimestamp).toLocaleString()}
                />
                {proofInfo.verificationTimestamp && (
                  <InfoRow
                    label="Last Verified"
                    value={new Date(proofInfo.verificationTimestamp).toLocaleString()}
                  />
                )}
              </div>
            </div>

            {/* Confidence Scores */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>📊</span>
                <span>Confidence Scores</span>
              </h2>
              <div className="space-y-4">
                <ScoreBar
                  label="Average Confidence"
                  score={proofInfo.confidenceScore.average}
                  color="blue"
                />
                <ScoreBar
                  label="Minimum Confidence"
                  score={proofInfo.confidenceScore.min}
                  color="yellow"
                />
                <ScoreBar
                  label="Maximum Confidence"
                  score={proofInfo.confidenceScore.max}
                  color="green"
                />
              </div>
            </div>

            {/* Technical Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>🔧</span>
                <span>Technical Details</span>
              </h2>
              <div className="space-y-3">
                <InfoRow label="AI Model" value={proofInfo.model} />
                <InfoRow label="Platform" value={proofInfo.platform} />
                <InfoRow
                  label="Proof ID"
                  value={proofInfo.proofId}
                  mono
                  truncate
                />
                <InfoRow
                  label="Attestation ID"
                  value={proofInfo.metadata.attestationId}
                  mono
                  truncate
                />
                <InfoRow
                  label="Merkle Root"
                  value={proofInfo.metadata.merkleRoot || 'N/A'}
                  mono
                  truncate
                />
              </div>
            </div>

            {/* Verification History */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>📜</span>
                <span>Verification History</span>
              </h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                <StatBox
                  label="Total Verifications"
                  value={proofInfo.verificationHistory.totalVerifications}
                  color="blue"
                />
                <StatBox
                  label="Successful"
                  value={proofInfo.verificationHistory.successfulVerifications}
                  color="green"
                />
                <StatBox
                  label="Failed"
                  value={proofInfo.verificationHistory.failedVerifications}
                  color="red"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* QR Code */}
            <VerificationBadgeWithQR
              proofId={proofId}
              status={proofInfo.status}
              documentType={proofInfo.documentType}
            />

            {/* Share */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-bold text-gray-900 mb-4">Share Verification</h3>
              <div className="space-y-3">
                <a
                  href={shareUrls.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <span>𝕏</span>
                  <span>Share on Twitter</span>
                </a>
                <a
                  href={shareUrls.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
                >
                  <span>in</span>
                  <span>Share on LinkedIn</span>
                </a>
                <a
                  href={shareUrls.email}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <span>✉</span>
                  <span>Share via Email</span>
                </a>
              </div>
            </div>

            {/* Embed Code */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-bold text-gray-900 mb-4">Embed on Your Site</h3>
              <button
                onClick={() => setShowEmbedCode(!showEmbedCode)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors mb-3"
              >
                {showEmbedCode ? 'Hide' : 'Show'} Embed Code
              </button>
              {showEmbedCode && (
                <div className="space-y-3">
                  <pre className="bg-gray-50 border border-gray-200 rounded p-3 text-xs overflow-x-auto">
                    <code>{generateEmbedCode(proofId)}</code>
                  </pre>
                  <button
                    onClick={handleCopyEmbedCode}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {copiedEmbed ? '✓ Copied!' : 'Copy Code'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-gray-500">
          <p>Powered by TrustDocs - Cryptographically Verified Document Processing</p>
          <p className="mt-1">
            <a href="/" className="text-blue-600 hover:text-blue-700">
              Learn More
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

// Helper Components
function InfoRow({
  label,
  value,
  mono = false,
  truncate = false,
  capitalize = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  truncate?: boolean;
  capitalize?: boolean;
}) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
      <span className="font-medium text-gray-600">{label}:</span>
      <span
        className={`text-gray-900 ${mono ? 'font-mono text-xs' : ''} ${
          truncate ? 'truncate max-w-xs' : ''
        } ${capitalize ? 'capitalize' : ''}`}
        title={truncate ? value : undefined}
      >
        {value}
      </span>
    </div>
  );
}

function ScoreBar({
  label,
  score,
  color,
}: {
  label: string;
  score: number;
  color: 'blue' | 'green' | 'yellow';
}) {
  const percentage = score * 100;
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-900">{percentage.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${colorClasses[color]} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'blue' | 'green' | 'red';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className={`${colorClasses[color]} border-2 rounded-lg p-4`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs opacity-80">{label}</div>
    </div>
  );
}

