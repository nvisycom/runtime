import { NvisyError } from "./base.js";

export class LlmError extends NvisyError {
	readonly code: string = "LLM_ERROR";
	constructor(message: string, cause?: Error) {
		super(message, cause);
	}
}

export class RateLimitError extends LlmError {
	override readonly code = "RATE_LIMIT";
	readonly retryAfterMs?: number;
	constructor(message: string, retryAfterMs?: number, cause?: Error) {
		super(message, cause);
		this.retryAfterMs = retryAfterMs;
	}
}

export class TokenLimitError extends LlmError {
	override readonly code = "TOKEN_LIMIT";
	constructor(message: string, cause?: Error) {
		super(message, cause);
	}
}
