import { generateObject } from "ai";
import type { ProviderConfig } from "./client.js";
import { getAvailableProviders } from "./client.js";

export function isRateLimitError(err: unknown): boolean {
	if (!(err instanceof Error)) return false;
	const msg = err.message.toLowerCase();
	return (
		msg.includes("rate limit") ||
		msg.includes("rate_limit") ||
		msg.includes("quota") ||
		msg.includes("429") ||
		msg.includes("too many requests") ||
		msg.includes("resource_exhausted") ||
		msg.includes("exceeded")
	);
}

export async function generateWithFallback<T>(
	options: Record<string, unknown>
): Promise<{ object: T; provider: string }> {
	const providers = getAvailableProviders();
	if (providers.length === 0) {
		throw new Error("No LLM providers available. Set at least one API key.");
	}

	let lastError: Error | undefined;

	for (let i = 0; i < providers.length; i++) {
		const provider = providers[i];
		try {
			const model = provider.createModel();
			// biome-ignore lint: generateObject overloads make precise typing impractical
			const { object } = await generateObject({
				...options,
				model,
			} as any);
			return { object: object as T, provider: provider.name };
		} catch (err) {
			lastError = err instanceof Error ? err : new Error(String(err));
			const hasMore = i < providers.length - 1;
			if (isRateLimitError(err) && hasMore) {
				console.warn(
					`[fallback] ${provider.name} rate-limited, trying ${providers[i + 1].name}...`
				);
				continue;
			}
			if (hasMore && isRetryableError(err)) {
				console.warn(
					`[fallback] ${provider.name} error: ${lastError.message.slice(0, 80)}, trying ${providers[i + 1].name}...`
				);
				continue;
			}
			throw lastError;
		}
	}

	throw lastError ?? new Error("All LLM providers exhausted");
}

function isRetryableError(err: unknown): boolean {
	if (isRateLimitError(err)) return true;
	if (!(err instanceof Error)) return false;
	const msg = err.message.toLowerCase();
	return (
		msg.includes("503") ||
		msg.includes("502") ||
		msg.includes("500") ||
		msg.includes("service unavailable") ||
		msg.includes("overloaded") ||
		msg.includes("timeout") ||
		msg.includes("econnreset")
	);
}
