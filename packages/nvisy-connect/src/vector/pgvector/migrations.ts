/**
 * Run schema setup / migrations for the pgvector extension and
 * embedding storage table.
 *
 * @param _connectionString - PostgreSQL connection string.
 * @param _table            - Target table name.
 * @param _dimension        - Vector dimensionality.
 */
export async function setupSchema(
	_connectionString: string,
	_table: string,
	_dimension: number,
): Promise<void> {
	throw new Error("Not yet implemented");
}
