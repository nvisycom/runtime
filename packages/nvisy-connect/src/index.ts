// Core
export type {
	DataInput,
	DataOutput,
	Resumable,
} from "#core/index.js";
export { Provider } from "#core/index.js";

// Object connectors
export {
	ObjectStore,
	detectContentType,
	normalizePath,
} from "#object/index.js";
export type {
	ObjectParams,
	ObjectContext,
	DropboxConfig,
	DropboxCredentials,
	GoogleDriveConfig,
	GoogleDriveCredentials,
	OneDriveConfig,
	OneDriveCredentials,
	S3Config,
	S3Credentials,
} from "#object/index.js";
export {
	DropboxConnector,
	GoogleDriveConnector,
	OneDriveConnector,
	S3Connector,
} from "#object/index.js";

// Relational connectors
export { RelationalDatabase } from "#relational/index.js";
export type {
	RelationalParams,
	RelationalContext,
	KeysetPage,
	MySQLConfig,
	MySQLCredentials,
	PostgresConfig,
	PostgresCredentials,
} from "#relational/index.js";
export { MySQLConnector, PostgresConnector } from "#relational/index.js";

// Vector connectors
export { DistanceMetric, VectorDatabase } from "#vector/index.js";
export type {
	VectorParams,
	VectorContext,
	MilvusConfig,
	MilvusCredentials,
	PgVectorConfig,
	PgVectorCredentials,
	PineconeConfig,
	PineconeCredentials,
	QdrantConfig,
	QdrantCredentials,
	ScoredResult,
	SearchOptions,
	SearchResult,
	WeaviateConfig,
	WeaviateCredentials,
} from "#vector/index.js";
export {
	MilvusConnector,
	PgVectorConnector,
	PineconeConnector,
	QdrantConnector,
	semanticSearch,
	setupSchema,
	WeaviateConnector,
} from "#vector/index.js";
