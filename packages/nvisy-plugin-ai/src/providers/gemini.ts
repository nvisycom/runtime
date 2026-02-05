import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { embedMany, generateText } from "ai";
import {
	makeProvider,
	type ProviderConnection,
	VercelCompletionClient,
	VercelEmbeddingClient,
} from "./client.js";

function makeGemini(credentials: ProviderConnection) {
	return createGoogleGenerativeAI({
		apiKey: credentials.apiKey,
		...(credentials.baseUrl != null ? { baseURL: credentials.baseUrl } : {}),
	});
}

/** Gemini completion provider factory backed by the Vercel AI SDK. */
export const geminiCompletion = makeProvider({
	id: "gemini-completion",
	createClient: (credentials) =>
		new VercelCompletionClient({
			languageModel: makeGemini(credentials)(credentials.model),
		}),
	verify: async (credentials) => {
		const provider = makeGemini(credentials);
		await generateText({
			model: provider(credentials.model),
			prompt: "hi",
			maxOutputTokens: 1,
		});
	},
});

/** Gemini embedding provider factory backed by the Vercel AI SDK. */
export const geminiEmbedding = makeProvider({
	id: "gemini-embedding",
	createClient: (credentials) =>
		new VercelEmbeddingClient({
			embeddingModel: makeGemini(credentials).embeddingModel(credentials.model),
		}),
	verify: async (credentials) => {
		const provider = makeGemini(credentials);
		await embedMany({
			model: provider.embeddingModel(credentials.model),
			values: ["test"],
		});
	},
});
