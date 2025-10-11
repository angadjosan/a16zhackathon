"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DocumentViewer from "@/components/ui/document-viewer";
import DocumentIcon from "@/components/ui/document-icon";

interface DocumentDetails {
  id: string;
  image_url: string;
  document_type: string;
  created_at: string;
  original_filename: string;
}

interface OCRWord {
  text: string;
  confidence: number;
  bounding_box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface Extraction {
  field: string;
  value: string;
  confidence: number;
  ocr_words: OCRWord[];
}

interface DocumentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function DocumentPage({ params }: DocumentPageProps) {
  const [id, setId] = useState<string | null>(null);
  const [document, setDocument] = useState<DocumentDetails | null>(null);
  const [extractions, setExtractions] = useState<Extraction[]>([]);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    params.then(({ id }) => setId(id));
  }, [params]);
  
  useEffect(() => {
    if (!id) return;
    // Mock data - in a real app, this would be a fetch call to your API
    setTimeout(() => {
      setDocument({
        id,
        image_url: "https://placehold.co/600x800/333/FFF",
        document_type: "receipt",
        created_at: "2025-10-10T10:30:00Z",
        original_filename: "costco-receipt.jpg"
      });
      
      setExtractions([
        {
          field: "vendor",
          value: "Costco Wholesale",
          confidence: 0.98,
          ocr_words: [
            {
              text: "Costco",
              confidence: 0.98,
              bounding_box: { x: 120, y: 50, width: 150, height: 30 }
            },
            {
              text: "Wholesale",
              confidence: 0.97,
              bounding_box: { x: 275, y: 50, width: 200, height: 30 }
            }
          ]
        },
        {
          field: "total",
          value: "$156.78",
          confidence: 0.95,
          ocr_words: [
            {
              text: "$156.78",
              confidence: 0.95,
              bounding_box: { x: 450, y: 600, width: 100, height: 30 }
            }
          ]
        },
        {
          field: "date",
          value: "2025-10-08",
          confidence: 0.85,
          ocr_words: [
            {
              text: "10/08/2025",
              confidence: 0.85,
              bounding_box: { x: 450, y: 100, width: 100, height: 25 }
            }
          ]
        }
      ]);
      
      setIsLoading(false);
    }, 1000);
  }, [id]);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Get all OCR words for the document or just for the selected field
  const getOCRWords = () => {
    if (!selectedField) {
      return extractions.flatMap(extraction => extraction.ocr_words);
    }
    
    const extraction = extractions.find(e => e.field === selectedField);
    return extraction ? extraction.ocr_words : [];
  };

  if (isLoading) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Document Details</h1>
            <Link href="/history" className="btn-secondary">
              Back to History
            </Link>
          </div>
          
          <div className="glass-card p-8 flex justify-center items-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="ml-3">Loading document...</span>
          </div>
        </div>
      </main>
    );
  }

  if (!document) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Document Details</h1>
            <Link href="/history" className="btn-secondary">
              Back to History
            </Link>
          </div>
          
          <div className="glass-card p-8 text-center">
            <p className="text-xl text-slate-300 mb-4">Document not found</p>
            <Link href="/history" className="btn-primary">
              Back to History
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Document Details</h1>
          <Link href="/history" className="btn-secondary">
            Back to History
          </Link>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Document Viewer */}
          <div className="lg:col-span-2 glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <DocumentIcon documentType={document.document_type} size="md" />
              <div>
                <h3 className="font-semibold text-lg">{document.original_filename}</h3>
                <p className="text-sm text-slate-400">{formatDate(document.created_at)}</p>
              </div>
            </div>
            
            <div className="h-[70vh]">
              <DocumentViewer
                imageUrl={document.image_url}
                words={getOCRWords()}
                showBoundingBoxes={true}
                selectedField={selectedField || undefined}
              />
            </div>
          </div>
          
          {/* Extractions Panel */}
          <div className="glass-card p-6">
            <h3 className="text-xl font-semibold mb-4">Extracted Fields</h3>
            <p className="text-sm text-slate-400 mb-6">
              Select a field to highlight the corresponding text in the document.
            </p>
            
            <ul className="space-y-4">
              {extractions.map((extraction) => (
                <li
                  key={extraction.field}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    selectedField === extraction.field
                      ? 'bg-blue-900/20 border border-blue-500/50'
                      : 'hover:bg-slate-800/50'
                  }`}
                  onClick={() => setSelectedField(
                    selectedField === extraction.field ? null : extraction.field
                  )}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 capitalize">{extraction.field}</span>
                    <span className={`text-sm px-2 py-1 rounded ${
                      extraction.confidence >= 0.95
                        ? 'bg-green-900/20 text-green-300'
                        : extraction.confidence >= 0.8
                        ? 'bg-yellow-900/20 text-yellow-300'
                        : 'bg-red-900/20 text-red-300'
                    }`}>
                      {Math.round(extraction.confidence * 100)}%
                    </span>
                  </div>
                  
                  <div className="mt-2 font-medium text-xl">{extraction.value}</div>
                  
                  <div className="mt-1 text-xs text-slate-400">
                    {extraction.ocr_words.length} OCR words
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}