import DocumentsTable from '../components/DocumentsTable';
import MobileHeader from '../components/MobileHeader';
import { useDocuments } from '../hooks/useDocuments';
import { useIsMobile } from '../hooks/useIsMobile';

export default function DocumentsPage(): JSX.Element {
  const { data, isLoading, error } = useDocuments();
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-neutral-50">
      {isMobile ? (
        <MobileHeader title="Documents" />
      ) : (
        <header className="bg-white border-b border-neutral-200 shadow-sm">
          <div className="max-w-container mx-auto px-6 py-6">
            <h1 className="text-3xl font-bold text-neutral-900">Documents</h1>
            <p className="text-neutral-600 mt-1">
              Ingested documents across all channels.
            </p>
          </div>
        </header>
      )}

      <main className="max-w-container mx-auto px-6 py-8">
        {isLoading && <p className="text-neutral-600">Loading documents…</p>}
        {error && (
          <p className="text-error-600">
            Error loading documents: {(error as Error).message}
          </p>
        )}
        {data && <DocumentsTable documents={data} />}
      </main>
    </div>
  );
}
