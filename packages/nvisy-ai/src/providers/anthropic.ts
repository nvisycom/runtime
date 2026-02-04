import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import {
	makeProvider,
	type ProviderConnection,
	VercelCompletionClient,
} from "./client.js";

function makeAnthropic(credentials: ProviderConnection) {
	return createAnthropic({
		apiKey: credentials.apiKey,
		...(credentials.baseUrl != null ? { baseURL: credentials.baseUrl } : {}),
	});
}

/** Anthropic completion provider factory backed by the Vercel AI SDK. */
export const anthropicCompletion = makeProvider({
	id: "anthropic",
	createClient: (credentials) =>
		new VercelCompletionClient({
			languageModel: makeAnthropic(credentials)(credentials.model),
		}),
	verify: async (credentials) => {
		const provider = makeAnthropic(credentials);
		await generateText({
			model: provider(credentials.model),
			prompt: "hi",
			maxOutputTokens: 1,
		});
	},
});
