export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold text-center">
          TrustDocs - Verifiable AI Document Extraction
        </h1>
      </div>

      <div className="relative flex place-items-center">
        <div className="text-center">
          <h2 className="mb-4 text-2xl">Upload paper documents</h2>
          <p className="text-lg text-gray-600">
            Get verifiable AI extractions with cryptographic proofs
          </p>
        </div>
      </div>

      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left">
        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300">
          <h2 className="mb-3 text-2xl font-semibold">
            Upload{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Upload receipts, invoices, and contracts
          </p>
        </div>

        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300">
          <h2 className="mb-3 text-2xl font-semibold">
            Extract{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            AI extracts structured data with confidence scores
          </p>
        </div>

        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300">
          <h2 className="mb-3 text-2xl font-semibold">
            Verify{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Every field has cryptographic proof of origin
          </p>
        </div>

        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300">
          <h2 className="mb-3 text-2xl font-semibold">
            Audit{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Re-verify documents months later
          </p>
        </div>
      </div>
    </main>
  )
}