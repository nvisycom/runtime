import { z } from "zod";

/**
 * Connection credentials shared by all SQL providers.
 *
 * Validated at graph parse time before any connection is attempted.
 */
export const SqlCredentials = z.object({
	/** Database server hostname or IP address. */
	host: z.string(),
	/** Database server port. */
	port: z.number(),
	/** Target database name. */
	database: z.string(),
	/** Authentication username. */
	username: z.string(),
	/** Authentication password. */
	password: z.string(),
});
export type SqlCredentials = z.infer<typeof SqlCredentials>;
