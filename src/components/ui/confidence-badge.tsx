"use client";

interface ConfidenceBadgeProps {
  confidence: number;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Badge component that displays confidence levels with appropriate colors
 */
export default function ConfidenceBadge({ 
  confidence, 
  showText = true, 
  size = 'md' 
}: ConfidenceBadgeProps) {
  // Format confidence as percentage
  const formatConfidence = (confidence: number): string => {
    return `${Math.round(confidence * 100)}%`;
  };
  
  // Get confidence level class and text
  const getConfidenceInfo = (confidence: number): { colorClass: string; text: string } => {
    if (confidence >= 0.95) {
      return {
        colorClass: 'bg-green-100 text-green-800',
        text: 'High',
      };
    }
    if (confidence >= 0.8) {
      return {
        colorClass: 'bg-yellow-100 text-yellow-800',
        text: 'Medium',
      };
    }
    return {
      colorClass: 'bg-red-100 text-red-800',
      text: 'Low',
    };
  };

  const { colorClass, text } = getConfidenceInfo(confidence);
  
  // Determine size classes
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1'
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${colorClass} ${sizeClasses[size as keyof typeof sizeClasses]}`}>
      {formatConfidence(confidence)}
      {showText && <span className="ml-1">({text})</span>}
    </span>
  );
};