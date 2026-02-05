import { z } from "zod";

/**
 * API key credentials shared by all AI providers.
 *
 * Validated at graph parse time before any connection is attempted.
 */
export const ProviderConnection = z.object({
	/** API key for authentication. */
	apiKey: z.string(),
	/** Optional custom base URL for the API. */
	baseUrl: z.string().optional(),
	/** Model identifier bound to this connection. */
	model: z.string(),
});
export type ProviderConnection = z.infer<typeof ProviderConnection>;
