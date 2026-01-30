export type MessageRole = "system" | "user" | "assistant";

export interface Message {
	role: MessageRole;
	content: string;
}

export interface CompletionOptions {
	temperature?: number;
	maxTokens?: number;
	topP?: number;
	stopSequences?: string[];
	responseFormat?: Record<string, unknown>;
}

export interface CompletionResult {
	content: string;
	finishReason: string;
	usage: {
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
	};
}
