export { anthropicCompletion } from "./anthropic.js";
export type {
	ChatMessage,
	CompletionOptions,
	CompletionResult,
	EmbedOptions,
	ProviderConfig,
	ProviderConnection,
} from "./client.js";
export {
	AICompletionClient,
	EmbeddingClient,
	makeProvider,
	VercelCompletionClient,
	VercelEmbeddingClient,
} from "./client.js";
export { geminiCompletion, geminiEmbedding } from "./gemini.js";
export { openaiCompletion, openaiEmbedding } from "./openai.js";
