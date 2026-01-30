export type ApiCredentials =
	| { provider: "openai"; apiKey: string }
	| { provider: "anthropic"; apiKey: string }
	| { provider: "google"; apiKey: string }
	| { provider: "cohere"; apiKey: string };
