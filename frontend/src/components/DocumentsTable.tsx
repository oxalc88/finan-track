import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { DocumentoFuente, EstadoDocumento } from '../types/domain';
import { fetchDocumentUrl } from '../lib/api';

interface DocumentsTableProps {
  documents: DocumentoFuente[];
}

const STATE_VARIANT: Record<
  EstadoDocumento,
  'default' | 'secondary' | 'warning' | 'success' | 'error'
> = {
  RECIBIDO: 'secondary',
  PROCESANDO: 'warning',
  NORMALIZADO: 'success',
  ERROR: 'error',
};

async function openDocument(id: string): Promise<void> {
  try {
    const { url } = await fetchDocumentUrl(id);
    window.open(url, '_blank', 'noopener,noreferrer');
  } catch (err) {
    // The caller sees the error in its console; the button goes back to
    // idle so the user can retry.
    console.error('Failed to open document', err);
  }
}

export default function DocumentsTable({
  documents,
}: DocumentsTableProps): JSX.Element {
  if (documents.length === 0) {
    return (
      <p className="text-neutral-600 text-sm">No documents yet.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-neutral-200 bg-white">
      <table className="min-w-full divide-y divide-neutral-200 text-sm">
        <thead className="bg-neutral-50 text-left text-neutral-600">
          <tr>
            <th className="px-4 py-3 font-medium">recibido_en</th>
            <th className="px-4 py-3 font-medium">canal</th>
            <th className="px-4 py-3 font-medium">tipo</th>
            <th className="px-4 py-3 font-medium">entidad</th>
            <th className="px-4 py-3 font-medium">estado</th>
            <th className="px-4 py-3 font-medium text-right">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {documents.map((doc) => (
            <tr key={doc.id}>
              <td className="px-4 py-3 whitespace-nowrap">
                {new Date(doc.recibido_en).toLocaleString('es-PE')}
              </td>
              <td className="px-4 py-3">{doc.canal}</td>
              <td className="px-4 py-3">{doc.tipo}</td>
              <td className="px-4 py-3">
                {doc.entidad_financiera_id ?? '—'}
              </td>
              <td className="px-4 py-3">
                <Badge variant={STATE_VARIANT[doc.estado]}>{doc.estado}</Badge>
              </td>
              <td className="px-4 py-3 text-right">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openDocument(doc.id)}
                >
                  Open
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
