import { Schema } from "effect";

/**
 * Connection credentials shared by all SQL providers.
 *
 * Validated at graph parse time before any connection is attempted.
 */
export const SqlCredentials = Schema.Struct({
	/** Database server hostname or IP address. */
	host: Schema.String,
	/** Database server port. */
	port: Schema.Number,
	/** Target database name. */
	database: Schema.String,
	/** Authentication username. */
	username: Schema.String,
	/** Authentication password (stored as plain text in config, wrapped in `Redacted` at connect time). */
	password: Schema.String,
});
export type SqlCredentials = typeof SqlCredentials.Type;
