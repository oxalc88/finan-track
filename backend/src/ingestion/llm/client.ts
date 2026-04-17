import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createXai } from "@ai-sdk/xai";
import type { LanguageModel } from "ai";

export interface ProviderConfig {
	readonly name: string;
	readonly envKey: string;
	readonly createModel: () => LanguageModel;
}

const PROVIDERS: ProviderConfig[] = [
	{
		name: "groq",
		envKey: "GROQ_API_KEY",
		createModel: () => {
			const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
			return groq("meta-llama/llama-4-scout-17b-16e-instruct");
		},
	},
	{
		name: "gemini",
		envKey: "GEMINI_API_KEY",
		createModel: () => {
			const google = createGoogleGenerativeAI({
				apiKey: process.env.GEMINI_API_KEY,
			});
			return google("gemini-2.5-flash");
		},
	},
	{
		name: "xai",
		envKey: "XAI_API_KEY",
		createModel: () => {
			const xai = createXai({ apiKey: process.env.XAI_API_KEY });
			return xai("grok-2-vision-1212");
		},
	},
	{
		name: "zhipu",
		envKey: "ZHIPU_API_KEY",
		createModel: () => {
			const zhipu = createOpenAICompatible({
				name: "zhipu",
				apiKey: process.env.ZHIPU_API_KEY!,
				baseURL: "https://open.bigmodel.cn/api/paas/v4",
			});
			return zhipu.languageModel("glm-4.6v-flash");
		},
	},
];

export function getAvailableProviders(): ProviderConfig[] {
	return PROVIDERS.filter((p) => !!process.env[p.envKey]);
}

export function createLlmModel(providerName?: string): LanguageModel {
	if (providerName) {
		const provider = PROVIDERS.find((p) => p.name === providerName);
		if (!provider) {
			throw new Error(
				`Unknown provider: ${providerName}. Available: ${PROVIDERS.map((p) => p.name).join(", ")}`
			);
		}
		if (!process.env[provider.envKey]) {
			throw new Error(
				`${provider.envKey} environment variable is not set for provider '${providerName}'`
			);
		}
		return provider.createModel();
	}

	const available = getAvailableProviders();
	if (available.length === 0) {
		throw new Error(
			`No LLM provider configured. Set at least one: ${PROVIDERS.map((p) => p.envKey).join(", ")}`
		);
	}
	return available[0].createModel();
}
