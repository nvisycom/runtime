/** Configuration parameters for a relational database connector. */
export interface RelationalParams {
	/** Target table name. */
	table: string;
	/** Database schema (e.g. "public"). */
	schema?: string;
	/** Number of rows to read/write per batch. */
	batchSize?: number;
}
