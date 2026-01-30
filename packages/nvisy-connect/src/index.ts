// Core
export type { DataInput, DataOutput, ProviderConfig } from "#core/index.js";
export { Resumable } from "#core/index.js";

// Object connectors
export {
	ObjectStorage,
	detectContentType,
	makeObjectLayer,
	normalizePath,
} from "#object/index.js";
export type {
	ObjectContext,
	ObjectError,
	ObjectParams,
	ObjectStore,
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
	DropboxLayer,
	GoogleDriveLayer,
	OneDriveLayer,
	S3Layer,
} from "#object/index.js";

// Relational connectors
export { RelationalDb, makeRelationalLayer } from "#relational/index.js";
export type {
	RelationalDatabase,
	RelationalError,
	RelationalParams,
	RelationalContext,
	KeysetPage,
	MySQLConfig,
	MySQLCredentials,
	PostgresConfig,
	PostgresCredentials,
} from "#relational/index.js";
export { MySQLLayer, PostgresLayer } from "#relational/index.js";

// Vector connectors
export { DistanceMetric, VectorDb, makeVectorLayer } from "#vector/index.js";
export type {
	VectorDatabase,
	VectorError,
	VectorParams,
	MilvusConfig,
	MilvusCredentials,
	PgVectorConfig,
	PgVectorCredentials,
	PineconeConfig,
	PineconeCredentials,
	QdrantConfig,
	QdrantCredentials,
	WeaviateConfig,
	WeaviateCredentials,
} from "#vector/index.js";
export {
	MilvusLayer,
	PgVectorLayer,
	PineconeLayer,
	QdrantLayer,
	WeaviateLayer,
	setupSchema,
} from "#vector/index.js";
