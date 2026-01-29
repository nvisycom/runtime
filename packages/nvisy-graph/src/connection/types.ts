export type AiConnection =
	| { type: "completion"; credentials: { provider: string; apiKey: string } }
	| { type: "embedding"; credentials: { provider: string; apiKey: string } };

export type DalConnection =
	| { type: "postgres"; connectionString: string }
	| {
			type: "mysql";
			host: string;
			port: number;
			user: string;
			password: string;
			database: string;
	  }
	| {
			type: "s3";
			accessKeyId: string;
			secretAccessKey: string;
			region: string;
			endpointUrl?: string;
	  }
	| { type: "qdrant"; url: string; apiKey?: string }
	| { type: "pinecone"; apiKey: string; environment: string }
	| { type: "milvus"; address: string; token?: string }
	| { type: "weaviate"; url: string; apiKey?: string }
	| { type: "pgvector"; connectionString: string }
	| { type: "dropbox"; accessToken: string }
	| { type: "onedrive"; accessToken: string }
	| { type: "google_drive"; accessToken: string };

export type ProviderConnection =
	| { category: "ai"; connection: AiConnection }
	| { category: "dal"; connection: DalConnection };
