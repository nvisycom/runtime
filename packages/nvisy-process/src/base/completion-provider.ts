import type { CompletionModel } from "../completion/models.js";
import type {
	CompletionOptions,
	CompletionResult,
	Message,
} from "./message.js";

export interface CompletionProvider {
	readonly model: CompletionModel;
	complete(
		messages: Message[],
		options?: CompletionOptions,
	): Promise<CompletionResult>;
	completeStructured<T>(
		messages: Message[],
		schema: Record<string, unknown>,
	): Promise<T>;
}
