"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import DocumentIcon from "@/components/ui/document-icon";

interface Document {
  id: string;
  image_url: string;
  document_type: string;
  created_at: string;
  original_filename: string;
}

export default function History() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        // Fetch documents from API
        // For now, we'll use mock data
        setTimeout(() => {
          setDocuments([
            {
              id: "doc-1",
              image_url: "https://placehold.co/300x400/333/FFF",
              document_type: "receipt",
              created_at: "2025-10-10T10:30:00Z",
              original_filename: "costco-receipt.jpg"
            },
            {
              id: "doc-2",
              image_url: "https://placehold.co/300x400/333/FFF",
              document_type: "invoice",
              created_at: "2025-10-09T14:20:00Z",
              original_filename: "office-supplies.jpg"
            },
            {
              id: "doc-3",
              image_url: "https://placehold.co/300x400/333/FFF",
              document_type: "contract",
              created_at: "2025-10-08T09:15:00Z",
              original_filename: "rental-agreement.pdf"
            }
          ]);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching documents:', error);
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, []);

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

  // Using our DocumentIcon component instead of inline SVGs
  const getDocumentTypeIcon = (type: string) => {
    return <DocumentIcon documentType={type} size="sm" />;
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Document History</h1>
          <Link href="/" className="btn-primary">
            Upload New Document
          </Link>
        </div>
        
        {isLoading ? (
          <div className="glass-card p-8 flex justify-center items-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="ml-3">Loading documents...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p className="text-xl text-slate-300 mb-4">No documents found</p>
            <p className="text-slate-400">Upload your first document to get started</p>
            <Link href="/" className="mt-6 inline-block btn-primary">
              Upload Document
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <div key={doc.id} className="glass-card overflow-hidden transition-transform hover:scale-[1.02]">
                <div className="relative h-48 w-full bg-slate-800">
                  <Image
                    src={doc.image_url}
                    alt={doc.original_filename}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-slate-300">
                      <span className="text-blue-400">{getDocumentTypeIcon(doc.document_type)}</span>
                      <span className="capitalize">{doc.document_type}</span>
                    </div>
                    <span className="text-xs text-slate-400">{formatDate(doc.created_at)}</span>
                  </div>
                  <h3 className="text-lg font-semibold truncate mb-3">{doc.original_filename}</h3>
                  <div className="flex justify-between">
                    <Link href={`/history/${doc.id}`} className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m15 12-6 7-6-7"/>
                        <path d="M15 5 9 12 3 5"/>
                        <path d="M21 19h-6"/>
                        <path d="M21 5h-6"/>
                        <path d="M21 12h-6"/>
                      </svg>
                      View Details
                    </Link>
                    <button className="text-sm text-slate-400 hover:text-slate-300 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 9-2 2 2 2"/>
                        <path d="m15 9 2 2-2 2"/>
                        <circle cx="12" cy="12" r="10"/>
                      </svg>
                      Verify
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}