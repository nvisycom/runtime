import { createOpenAI } from "@ai-sdk/openai";
import { embedMany, generateText } from "ai";
import {
	makeProvider,
	type ProviderConnection,
	VercelCompletionClient,
	VercelEmbeddingClient,
} from "./client.js";

function makeOpenAI(credentials: ProviderConnection) {
	return createOpenAI({
		apiKey: credentials.apiKey,
		...(credentials.baseUrl != null ? { baseURL: credentials.baseUrl } : {}),
	});
}

/** OpenAI completion provider factory backed by the Vercel AI SDK. */
export const openaiCompletion = makeProvider({
	id: "openai",
	createClient: (credentials) =>
		new VercelCompletionClient({
			languageModel: makeOpenAI(credentials)(credentials.model),
		}),
	verify: async (credentials) => {
		const provider = makeOpenAI(credentials);
		await generateText({
			model: provider(credentials.model),
			prompt: "hi",
			maxOutputTokens: 1,
		});
	},
});

/** OpenAI embedding provider factory backed by the Vercel AI SDK. */
export const openaiEmbedding = makeProvider({
	id: "openai-embedding",
	createClient: (credentials) =>
		new VercelEmbeddingClient({
			embeddingModel: makeOpenAI(credentials).embedding(credentials.model),
		}),
	verify: async (credentials) => {
		const provider = makeOpenAI(credentials);
		await embedMany({
			model: provider.embedding(credentials.model),
			values: ["test"],
		});
	},
});
