# Nvisy Runtime — Development

**Technology choices and development roadmap for the Nvisy Runtime platform.**

---

## Technology Choices

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Language | TypeScript | Type safety for the primitive system, broad ecosystem |
| Module system | ESM only | Modern standard, native in Node.js, tree-shakeable |
| Runtime | Node.js | Async I/O suited for connector-heavy workloads, npm ecosystem |
| Structured concurrency | Effection | Generator-based structured concurrency for DAG execution |
| Validation | Zod | Runtime validation, TypeScript type derivation, structured parse errors |
| Graph library | Graphology | DAG construction, cycle detection, topological sort |
| Package manager | npm workspaces | Monorepo management without additional tooling |
| Build | tsup | Fast TypeScript compilation, ESM output, declaration generation |
| Testing | Vitest | Fast, TypeScript-native, ESM-compatible |
| Linting | Biome | Unified formatter and linter, high performance |
| HTTP framework | Hono | Lightweight, edge-compatible, fast routing, middleware composition |
| Cron | croner | Lightweight, timezone-aware scheduling |

---

## Development Roadmap

### Phase 1 — Foundation

Core infrastructure and proof-of-concept connectors.

- **`nvisy-core`**
  - Primitive type system (embedding, completion, structured_output, tool_call_trace, image, audio, fine_tune_sample, raw)
  - Zod-based validation and type derivation
  - Error taxonomy with machine-readable tags and retryable flags
  - Base Source, Sink, and Action interfaces (AsyncIterable-based)
  - Observability primitives (structured logging, metrics, tracing)
  - Utility library (ULID generation, content hashing, serialization)

- **`nvisy-runtime`**
  - Graph JSON schema definition (Zod)
  - JSON parser and graph validator
  - DAG compiler (cycle detection, dependency resolution, execution planning)
  - Execution engine with Effection-based structured concurrency
  - Retry policies (fixed, exponential, jitter backoff)
  - Timeout policies (per-node execution limits)
  - Concurrency control (global and per-node limits)
  - Built-in generic actions (filter, map, batch, deduplicate, validate, convert)
  - Runtime metrics and OpenTelemetry tracing

- **`nvisy-plugin-object`**
  - S3 source and sink (multipart upload, streaming read, prefix listing)
  - JSONL source and sink (line-delimited JSON, schema inference)

- **`nvisy-plugin-vector`**
  - Qdrant source and sink (collection management, upsert with metadata, dimensionality validation)

### Phase 2 — Breadth

Expand connector coverage, add domain-specific actions.

- **`nvisy-plugin-vector`**
  - Pinecone connector
  - Milvus connector
  - Weaviate connector
  - pgvector connector

- **`nvisy-plugin-sql`**
  - PostgreSQL source and sink (connection pooling, query generation, batch upsert)
  - MySQL source and sink
  - MSSQL source and sink

- **`nvisy-plugin-object`**
  - GCS source and sink
  - Parquet source and sink (columnar read/write, schema mapping)
  - CSV source and sink (header detection, type inference, chunked reading)

- **`nvisy-plugin-ai`**
  - Embedding action (multi-provider: OpenAI, Anthropic, Cohere, Gemini)
  - Chunking actions (fixed-size, contextual, similarity-based)
  - Completion action (structured output extraction)
  - Enrichment action (metadata augmentation via LLM)

- **Runtime additions**
  - Dead letter queue support (per-node failure routing)
  - Dry-run mode (compile and validate without executing)
  - Resumable execution (checkpoint and resume from last successful context)

### Phase 3 — Server

HTTP server, scheduling, and operational tooling.

- **`nvisy-server`**
  - REST API (Hono) for graph execution, validation, and run management
  - Cron scheduler (croner) for time-based pipeline triggers
  - Webhook-based event triggers
  - Request logging and structured observability
  - Health and readiness endpoints

- **Storage backends**
  - SQLite for development and single-node deployments
  - PostgreSQL for production deployments

- **Web dashboard**
  - Run monitoring and status visualization
  - Lineage exploration (trace primitives through transformations)
  - Failure inspection and replay

### Phase 4 — Production Hardening

Performance, security, and operational maturity.

- **Performance**
  - Backpressure tuning and memory management
  - Disk spill for materialization nodes (deduplication, sorting over large datasets)
  - Batching optimization (adaptive batch sizing based on connector feedback)
  - Performance benchmarks and profiling

- **Security**
  - Secret provider integrations (AWS Secrets Manager, HashiCorp Vault, Azure Key Vault)
  - TLS termination and certificate management
  - Bearer token authentication and API key management
  - IP allowlisting and CORS configuration

- **Operational**
  - Graceful shutdown and in-flight run draining
  - Configuration hot-reload
  - Structured alerting on pipeline failures

- **Community**
  - Plugin SDK documentation and examples
  - Connector contribution guide
  - Published npm packages with semantic versioning
