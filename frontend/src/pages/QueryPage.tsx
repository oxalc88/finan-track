import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import QueryResult from '../components/QueryResult';
import { postQuery } from '../lib/api';
import type { QueryAnswer } from '../types/domain';

export default function QueryPage(): JSX.Element {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<QueryAnswer | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;

    setIsPending(true);
    setError(null);
    setResult(null);
    try {
      const answer = await postQuery(trimmed);
      setResult(answer);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-container mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-neutral-900">Ask</h1>
          <p className="text-neutral-600 mt-1">
            Preguntale a tus finanzas en español.
          </p>
        </div>
      </header>

      <main className="max-w-container mx-auto px-6 py-8 space-y-6">
        <form onSubmit={onSubmit} className="space-y-3">
          <label
            htmlFor="query"
            className="block text-sm font-medium text-foreground"
          >
            Pregunta
          </label>
          <textarea
            id="query"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={500}
            rows={3}
            className="w-full rounded-md border border-neutral-300 bg-white p-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="¿Cuánto gasté en restaurantes este mes?"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500">
              {question.length}/500
            </span>
            <Button type="submit" disabled={isPending || !question.trim()}>
              {isPending ? 'Asking…' : 'Ask'}
            </Button>
          </div>
        </form>

        {error && <p className="text-error-600 text-sm">{error}</p>}
        {result && <QueryResult result={result} />}
      </main>
    </div>
  );
}
