import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { QueryAnswer } from '../types/domain';

interface QueryResultProps {
  result: QueryAnswer;
}

export default function QueryResult({ result }: QueryResultProps): JSX.Element {
  const [showSql, setShowSql] = useState(false);
  const rows = result.data ?? [];
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Answer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-foreground whitespace-pre-line">{result.answer}</p>

        {result.sql && (
          <div>
            <button
              type="button"
              className="text-sm text-primary underline"
              onClick={() => setShowSql((s) => !s)}
            >
              {showSql ? 'Hide SQL' : 'Show SQL'}
            </button>
            {showSql && (
              <pre className="mt-2 bg-neutral-100 rounded-md p-3 text-xs overflow-x-auto">
                {result.sql}
              </pre>
            )}
          </div>
        )}

        {rows.length > 0 && (
          <div className="overflow-x-auto rounded-md border border-neutral-200">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-600">
                <tr>
                  {columns.map((col) => (
                    <th key={col} className="px-3 py-2 font-medium">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {rows.map((row, idx) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: backend rows have no stable id
                  <tr key={idx}>
                    {columns.map((col) => (
                      <td key={col} className="px-3 py-2">
                        {formatCell(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {result.execution_time_ms !== null && (
          <p className="text-xs text-neutral-500">
            Execution time: {result.execution_time_ms} ms
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
