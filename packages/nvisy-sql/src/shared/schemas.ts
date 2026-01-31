import { Schema } from "effect";

/** Connection credentials shared by all SQL providers. */
export const SqlCredentials = Schema.Struct({
	host: Schema.String,
	port: Schema.Number,
	database: Schema.String,
	username: Schema.String,
	password: Schema.String,
});
export type SqlCredentials = typeof SqlCredentials.Type;

/** Per-node parameters that describe what to read/write. */
export const SqlParams = Schema.Struct({
	table: Schema.String,
	columns: Schema.Array(Schema.String),
	idColumn: Schema.String,
	tiebreaker: Schema.String,
	batchSize: Schema.Number,
});
export type SqlParams = typeof SqlParams.Type;

/** Keyset pagination cursor for resumable reads. */
export const SqlCursor = Schema.Struct({
	lastId: Schema.Union(Schema.Number, Schema.String, Schema.Null),
	lastTiebreaker: Schema.Union(Schema.Number, Schema.String, Schema.Null),
});
export type SqlCursor = typeof SqlCursor.Type;
