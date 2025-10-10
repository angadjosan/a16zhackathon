"use client";

interface DocumentIconProps {
  documentType: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function DocumentIcon({ 
  documentType, 
  size = 'md',
  className = '' 
}: DocumentIconProps) {
  // Size classes based on the size prop
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  // Icon background colors based on document type
  const bgColors = {
    receipt: 'bg-blue-100 text-blue-800',
    invoice: 'bg-green-100 text-green-800',
    contract: 'bg-purple-100 text-purple-800',
    default: 'bg-gray-100 text-gray-800',
  };

  // Get document type in lowercase for comparison
  const docType = documentType.toLowerCase();
  
  // Get background color based on document type
  const bgColor = docType === 'receipt' 
    ? bgColors.receipt 
    : docType === 'invoice' 
      ? bgColors.invoice 
      : docType === 'contract' 
        ? bgColors.contract 
        : bgColors.default;

  // Get first letter of document type for icon
  const firstLetter = docType.charAt(0).toUpperCase();

  // Default classes that apply to all icons
  const defaultClasses = `${sizeClasses[size]} ${bgColor} rounded-full flex items-center justify-center font-bold ${className}`;
  
  return (
    <div className={defaultClasses}>
      {firstLetter}
    </div>
  );
}