import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'TrustDocs - Verifiable AI Document Extraction',
  description: 'Upload documents, extract data with AI, and get cryptographic proofs for each field.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans bg-[#0f172a] text-white`}>
        {children}
      </body>
    </html>
  );
}