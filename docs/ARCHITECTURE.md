# Nvisy Runtime — Architecture

**Technical architecture specification for the Nvisy Runtime ETL platform.**

---

## 1. Overview

Nvisy Runtime is a TypeScript-native, DAG-based ETL platform for AI data workloads. It is structured as a set of composable packages that can be consumed as a library or deployed as a long-lived server.

This document defines the system architecture: package boundaries, data flow, execution model, connector interface, graph compilation, scheduling, error handling, and observability. It is intended as the authoritative reference for implementation.

---

## 2. Package Structure

The system is organized as a monorepo of npm packages under the `@nvisy` scope.

```
packages/
  nvisy-core/           Primitives, type system, validation, errors,
                        base interfaces for sources, sinks, and actions,
                        and core observability (structured logging, metrics, tracing)
  nvisy-plugin-sql/     SQL connectors (PostgreSQL, MySQL)
  nvisy-plugin-object/  Object store and file format connectors (S3, GCS, Parquet, JSONL, CSV)
  nvisy-plugin-vector/  Vector database connectors (Pinecone, Qdrant, Milvus, Weaviate, pgvector)
  nvisy-runtime/        Graph definition, JSON parser, DAG compiler, execution engine,
                        task runner, retry logic, concurrency control,
                        runtime-level observability (run metrics, node tracing)
  nvisy-server/         HTTP server (Hono), REST API, cron scheduler, dashboard backend,
                        server-level observability (request logging, health endpoints)
```

### Dependency graph

```
                nvisy-server
                /          \
               ▼            ▼
      nvisy-runtime    nvisy-plugin-{sql,ai,object,vector}
               \            /
                ▼          ▼
                nvisy-core
```

Every package depends on `nvisy-core`. The plugin packages (`nvisy-plugin-sql`, `nvisy-plugin-ai`, `nvisy-plugin-object`, `nvisy-plugin-vector`) are siblings — they depend on `nvisy-core` for the base source, sink, and action interfaces, but are independent of each other and independent of `nvisy-runtime`. The server (or any application) imports both the runtime and the desired plugins, then registers each plugin with the engine at startup. `nvisy-runtime` is the central package that owns graph definition, compilation, and execution — but has no compile-time dependency on any plugin. No circular dependencies are permitted. Packages communicate through typed interfaces, never through implementation details.

### Observability distribution

There is no dedicated observability package. Instead, observability is distributed across three layers:

- **`nvisy-core`** defines the observability primitives: structured log format, metric types, trace span interface, and lineage record structure. It also exports the logging, metrics, and tracing utilities that all other packages use.
- **`nvisy-runtime`** emits runtime observability: graph run duration, node execution times, primitives processed/failed, connector call counts, rate limit wait times. Each graph run produces an OpenTelemetry-compatible trace with nodes as spans.
- **`nvisy-server`** emits server-level observability: HTTP request logging, health check endpoints, and metric export endpoints (Prometheus, OpenTelemetry).

---

## 3. Idiomatic Modern JavaScript with Effection

The platform is built on idiomatic modern JavaScript — `async`/`await`, `AsyncIterable`, native `Promise`, and generator functions — with **Effection** providing structured concurrency for the runtime's DAG executor.

### 3.1 Design philosophy

Traditional TypeScript ETL code suffers from scattered try/catch blocks, manual resource cleanup, ad-hoc retry logic, and opaque concurrency. Nvisy addresses these problems with standard language features and a minimal set of libraries:

- **Typed errors.** A structured error hierarchy with machine-readable tags enables programmatic error handling. TypeScript discriminated unions and Zod schemas enforce correctness at both compile time and runtime.
- **Resource safety.** Connector lifecycle (connect, use, disconnect) is managed with explicit `try`/`finally` blocks in the node executor. Cleanup runs regardless of success, failure, or cancellation.
- **Structured concurrency.** The runtime's DAG executor uses Effection — a structured concurrency library built on generators. Spawned tasks are scoped to their parent, so halting a graph run automatically cancels all in-flight nodes without manual bookkeeping.
- **Streaming.** Data flows between nodes via the native `AsyncIterable` protocol. Plugin interfaces (sources, sinks, actions) accept and return `AsyncIterable` — no special streaming library required.
- **Validation.** Zod schemas provide runtime validation, TypeScript type derivation, and structured parse errors in a single definition.

### 3.2 Effection in the runtime

Effection is used exclusively in `nvisy-runtime` for DAG execution. It provides `spawn` (launch concurrent tasks), `race` (timeout handling), `sleep` (backoff delays), and `call` (bridge async functions into generator-based operations). The runtime wraps graph execution in an Effection task; each node runs as a spawned child operation. Plugin code never touches Effection — sources, sinks, and actions are plain `async` functions and `AsyncIterable` generators.

---

## 4. Core (`nvisy-core`)

The core package serves three purposes: it defines the **primitive type system** (the data model), it provides the **base interfaces** for building sources, sinks, and actions, and it houses the **observability primitives** used by all other packages.

### 4.1 Primitive type hierarchy

All data flowing through a graph is represented as a **Primitive**. Primitives are immutable, serializable, and carry both payload and metadata.

The primitive type discriminant covers the full AI data surface: `embedding`, `completion`, `structured_output`, `tool_call_trace`, `image`, `audio`, `fine_tune_sample`, and `raw` (an escape hatch for untyped data). Each type maps to a specific payload shape — for example, an embedding payload contains the vector, its dimensionality, the producing model, source text, and a content hash.

Primitives are validated at construction time. The factory enforces payload conformance and rejects malformed data with structured errors before it enters the graph.

### 4.2 Metadata envelope

Every primitive carries a standard metadata envelope: creation timestamp, producing source or node identifier, graph ID, run ID, user-defined tags, and an extensible custom fields map. This envelope enables correlation, filtering, and auditing across the entire data lifecycle.

### 4.3 Lineage

Each transformation appends a lineage record to the primitive: the node ID that performed the operation, the operation name, a timestamp, the IDs of input primitives, and the parameters used. This enables full forward and backward tracing — given a vector in a database, trace back to the source document and every transformation it passed through.

### 4.4 Source, Sink, and Action interfaces

`nvisy-core` exports the abstract interfaces that all connectors and actions must implement. This is the extension contract of the platform:

- **Source** — reads primitives from an external system. Declares supported primitive types. Returns an `AsyncIterable` stream of primitives with resumption context.
- **Sink** — writes primitives to an external system. Declares capabilities (batch size, upsert support, rate limits). Returns a write function that accepts individual primitives.
- **Action** — transforms primitives via the `pipe` method: receives an `AsyncIterable` of input primitives and returns an `AsyncIterable` of output primitives. Actions may be stateless (map, filter) or stateful (deduplicate, aggregate).

All three interfaces include lifecycle methods (connect, disconnect) and capability declarations. By housing these interfaces in `nvisy-core`, the connector packages and any community-contributed connectors share a single, versioned contract. All methods use standard `async`/`await` and `AsyncIterable` — no special runtime library is required.

### 4.5 Error taxonomy

The core package defines a structured error hierarchy with machine-readable tags. The hierarchy distinguishes connector errors, validation errors, rate limit errors, timeout errors, graph compilation errors, and node execution errors. Each error class carries a `retryable` flag so the runtime can distinguish transient failures from terminal ones without string matching.

### 4.6 Observability primitives

Core defines the foundational observability types: structured log schema (JSON, with correlation IDs for graph, run, and node), metric types (counters, histograms, gauges), trace span interface (OpenTelemetry-compatible), and lineage record structure. It also exports utility functions for logging, metric emission, and span creation that all packages use uniformly.

### 4.7 Utilities

Common utilities shared across packages live in core: ULID generation, content hashing, primitive serialization/deserialization, and type-safe builder helpers for constructing primitives.

---

## 5. Connector Packages

### 5.1 Package separation rationale

Connectors are split into three domain-specific packages rather than a single monolithic package. This serves two goals:

1. **Install footprint.** Each connector package carries peer dependencies on the relevant client libraries (e.g., `@qdrant/js-client-rest`, `@aws-sdk/client-s3`, `pg`). Users who only need vector database connectors should not be forced to install SQL drivers or S3 SDKs.

2. **Release independence.** A breaking change in a vector database client library should not force a release of the SQL connector package. Domain-specific packages can be versioned and released independently.

### 5.2 `nvisy-plugin-sql`

Implements the Source and Sink interfaces for relational databases. Initial targets: PostgreSQL and MySQL. Connectors handle connection pooling, query generation, type mapping between SQL types and primitive payloads, and batch insert/upsert operations.

### 5.3 `nvisy-plugin-object`

Implements the Source and Sink interfaces for object stores and file formats. Initial targets: S3, GCS, Parquet, JSONL, and CSV. Object store connectors handle multipart uploads, streaming reads, and prefix-based listing. File format connectors handle serialization, deserialization, schema inference, and chunked reading for large files.

### 5.4 `nvisy-plugin-vector`

Implements the Source and Sink interfaces for vector databases. Initial targets: Pinecone, Qdrant, Milvus, Weaviate, and pgvector. Vector connectors handle collection/index management, upsert with metadata, batch operations, and dimensionality validation.

### 5.5 Plugin registration

Plugins are registered with the `Engine` at startup via `engine.register(plugin)`. Each plugin bundles providers, streams, and actions under a namespace (e.g. `"sql"`, `"ai"`). The graph compiler resolves references like `"sql/postgres"` or `"ai/embed"` against the registry at compilation time. Community plugins install as npm packages and export a `PluginInstance` implementing the standard interface from `nvisy-core`.

---

## 6. Runtime (`nvisy-runtime`)

The runtime package owns the full lifecycle of a graph: definition, compilation, and execution. It is the central package — plugin packages register their providers, streams, and actions into the runtime's `Engine`, and the server orchestrates this wiring at startup.

### 6.1 Graph definition and JSON serializability

The central design constraint is that every graph must be representable as a plain JSON document. This means graphs can be stored in a database, versioned in source control, transmitted over an API, diffed, and reconstructed without loss. The programmatic TypeScript API is a convenience layer that produces the same JSON structure.

A graph is a directed acyclic graph of **nodes**. Each node declares its type (source, action, sink, branch, fanout, fanin), its configuration, its upstream dependencies, and optional execution policies (retry, timeout, concurrency). Nodes are connected by edges derived from the dependency declarations.

The graph JSON schema is defined using **Zod**. This provides runtime validation, TypeScript type derivation, and structured parse errors in a single definition.

### 6.2 Node types

**Source** — References a registered source connector by name and provides connection and extraction configuration.

**Action** — Applies a transformation to primitives. Actions are resolved by name from the registry. The runtime provides built-in generic actions (filter, map, batch, deduplicate, validate, convert). Domain-specific actions (embed, chunk, complete) are provided by plugin packages (`nvisy-plugin-ai`, etc.) and registered into the engine by the application at startup.

**Sink** — References a registered sink connector by name and provides connection and load configuration.

**Branch** — Routes each primitive to one of several downstream nodes based on a predicate. A default route handles unmatched primitives.

**FanOut** — Duplicates each primitive to multiple downstream nodes for parallel processing (e.g., embedding the same text with multiple models simultaneously).

**FanIn** — Collects primitives from multiple upstream nodes and merges them into a single stream.

### 6.3 Registries

The runtime uses three registries for resolving node references to implementations:

- **SourceRegistry** — Maps source names to `DataSource` factories. Populated by plugin packages (`nvisy-plugin-sql`, `nvisy-plugin-vector`, etc.) via `engine.register()`.
- **SinkRegistry** — Maps sink names to `DataSink` factories. Same population model.
- **ActionRegistry** — Maps action names to `Action` factories. Pre-loaded with the runtime's built-in generic actions. Extended by plugin packages (`nvisy-plugin-ai`, etc.).

Separation ensures type safety (each registry returns the correct interface without narrowing), independent testability (mock only what you need), and clear error messages ("unknown source: xyz" vs "unknown action: xyz"). Plugin packages export a `PluginInstance` that the application registers with the engine at startup — the runtime itself has no compile-time dependency on any plugin.

### 6.4 Built-in actions

The runtime owns a set of generic, data-plane actions that operate on primitives without external dependencies:

- **filter** — Drop primitives that don't match a predicate.
- **map** — Transform primitive fields (rename, reshape, project).
- **batch** — Group N primitives into batches before forwarding downstream.
- **deduplicate** — Drop duplicates by content hash or user-defined key.
- **validate** — Assert primitives match a schema; route failures to DLQ.
- **convert** — Cast between primitive types (Row → Document, etc.).

These are pre-registered in the ActionRegistry. Domain-specific actions (embed, chunk, complete, extract) live in their respective packages.

### 6.5 Graph compilation

The compiler pipeline transforms raw JSON into an executable plan in three stages:

1. **Parse** (`compiler/parse.ts`) — Decode the raw JSON against the Zod graph schema. This produces a typed, validated graph structure or structured errors with JSON paths.

2. **Validate** (`compiler/validate.ts`) — Structural DAG validation: cycle detection via topological sort, dangling node references, type compatibility between connected nodes (source output types match downstream action input types), and connector/action name resolution against the registries.

3. **Plan** (`compiler/plan.ts`) — Build the `ExecutionPlan`: resolve all names to concrete implementations via the registries, compute the topological execution order, aggregate concurrency constraints, and wire rate limit policies. The `ExecutionPlan` is an immutable data structure. Compilation throws structured errors on failure.

### 6.6 Execution model

The engine executes an `ExecutionPlan` as an Effection task. It spawns each node as a child operation, with dependency tracking ensuring nodes wait for their upstream inputs before executing. Effection's structured concurrency guarantees that halting the top-level task automatically cancels all in-flight nodes. The executor maintains a **done store** of completed results (both successes and terminal failures) and coordinates data flow via inter-node queues.

### 6.7 Data flow between nodes

Each edge in the DAG is backed by an Effection queue. Producer nodes push primitives into the queue; consumer nodes pull from it. For action nodes that expect an `AsyncIterable` input, the runtime bridges Effection queues into a `ReadableStream` via a `TransformStream`, allowing actions to consume data with standard `for await...of` iteration.

Data flows through the system using the native `AsyncIterable` protocol. Sources yield items, actions pipe one `AsyncIterable` to another, and sinks consume items via a write function. No special streaming library is required — the platform relies entirely on JavaScript's built-in async iteration.

For nodes that require all upstream data before starting (e.g., deduplication across the full dataset), a **materialization barrier** can be configured. The barrier drains the upstream queue into an array before forwarding to the node.

Fan-out nodes push each primitive to multiple downstream queues. Fan-in nodes pull from multiple upstream queues and merge into a single stream.

### 6.8 Retry policy

Each node can define a retry policy specifying maximum retries, backoff strategy (fixed, exponential, or jitter), initial and maximum delay, and an optional allowlist of retryable error codes. The runtime implements retries as a generator-based loop using Effection's `sleep` for backoff delays. It distinguishes between retryable errors (network timeouts, rate limits, transient API failures) and terminal errors (authentication failures, schema violations, invalid configuration). Terminal errors fail the node immediately.

### 6.9 Rate limiting

Rate limits are enforced per-connector. When a node issues a request that would exceed the rate limit, the operation is suspended until tokens are available. Rate limits are declared in connector capabilities and can be overridden in graph configuration.

### 6.10 Concurrency control

Global concurrency is bounded by a configurable limit (default: 10 permits). Per-node concurrency can be set individually. The runtime respects both limits simultaneously. The concurrency pool (`engine/pool.ts`) manages this.

### 6.11 Runtime observability

The runtime emits structured metrics and trace spans for every graph run. Each run is an OpenTelemetry trace; each node execution is a span within that trace. Metrics include run duration, run status (success, partial failure, failure), per-node execution time, primitives processed and failed, connector calls issued, and rate limit wait time.

---

## 7. Server (`nvisy-server`)

### 7.1 Role

The Node.js server is a **stateless execution worker**. It accepts graph JSON, compiles and executes it via the runtime, and reports status of in-flight runs. It does not persist graph definitions, run history, or lineage — that responsibility belongs to a separate persistent server (written in Rust). This package is a thin HTTP interface over the runtime engine.

### 7.2 HTTP layer

The HTTP layer is built on **Hono**, a lightweight, edge-compatible web framework. Hono provides routing, middleware composition, and request validation with minimal overhead. The server entry point is `main.ts`, which starts a Node.js HTTP server via `@hono/node-server`.

### 7.3 Middleware

All requests pass through two middleware layers:

- **Request ID** — Assigns a unique `X-Request-Id` header to every request for correlation.
- **Request logger** — Emits structured JSON logs (method, path, status, latency, request ID) for every request.

### 7.4 REST API

The API surface covers health checks, graph execution, validation, and in-flight run management. All endpoints accept and return JSON. Connectors are defined within the graph JSON schema, not managed separately.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness probe |
| `GET` | `/ready` | Readiness probe |
| `POST` | `/api/v1/graphs/execute` | Submit a graph for execution; returns `{ runId }` immediately |
| `POST` | `/api/v1/graphs/validate` | Compile and validate a graph without executing |
| `GET` | `/api/v1/graphs` | List in-flight runs |
| `GET` | `/api/v1/graphs/:runId` | Get detailed status of a single in-flight run |
| `DELETE` | `/api/v1/graphs/:runId` | Cancel a running execution |

### 7.5 Server observability

The server layer emits HTTP request logs (structured JSON with method, path, status, latency, request ID) and exposes health check and readiness endpoints.

---

## 8. Error Handling

### 8.1 Error propagation

When a node encounters an error, the runtime first checks retryability via the error's `retryable` flag. If the error is retryable and retries remain, the node is re-attempted with backoff. If the error is terminal or retries are exhausted, the node is marked as failed. Downstream nodes that depend on the failed node are marked as skipped. Independent branches of the DAG continue executing. The graph run is marked as `partial_failure` or `failure` depending on whether any terminal sink node succeeded.

Errors are caught at the node executor boundary and recorded in the run result. The structured error hierarchy ensures consistent, machine-readable failure information at every layer.

### 8.2 Dead letter queue

Primitives that fail processing can be routed to a dead letter queue (DLQ) instead of failing the entire node. This allows the graph to continue processing valid data while capturing failures for later inspection and replay.

---

## 9. Security

### 9.1 Secret management

Connector credentials are never stored in graph definitions. They are resolved at runtime from environment variables, a pluggable secret provider interface (supporting AWS Secrets Manager, HashiCorp Vault, and similar systems), or `.env` files in development.

### 9.2 Network and access control

In server mode, the REST API supports TLS termination, bearer token authentication, IP allowlisting, and CORS configuration via Hono middleware.

### 9.3 Data handling

Primitives may contain sensitive data (PII in completions, proprietary embeddings). The platform provides configurable data retention policies per graph, primitive redaction hooks for logging, and encryption at rest for server-mode persistence.

---

## 10. Performance Considerations

### 10.1 Memory management

Primitives are processed in streaming fashion wherever possible using `AsyncIterable`. Nodes that must materialize full datasets (deduplication, sorting) use configurable memory limits and spill to disk when exceeded.

### 10.2 Embedding vectors

Embedding vectors use `Float32Array` for memory efficiency — a 1536-dimensional embedding occupies 6 KB vs. approximately 24 KB as a JSON number array. For large-scale embedding workloads, this 4x reduction is significant.

### 10.3 Batching

Connectors declare their optimal batch size. The runtime automatically batches primitives to match, reducing round trips to external systems. Batching respects rate limits — a batch that would exceed the rate limit is delayed, not split.

### 10.4 Backpressure

Effection queues between nodes provide natural backpressure. When a downstream node processes slower than its upstream, the connecting queue suspends the upstream operation until the downstream is ready. This prevents memory exhaustion in unbalanced graphs without manual flow control.

---

## 11. Extension Points

The platform is designed for extension at multiple levels:

| Extension Point | Mechanism | Example |
|----------------|-----------|---------|
| Custom primitive types | Extend the primitive type union and implement a payload interface | Graph embedding type |
| Custom connectors | Implement Source or Sink from `nvisy-core` | Elasticsearch connector |
| Custom actions | Implement Action from `nvisy-core`, or provide an inline function | Custom chunking strategy |
| Custom secret providers | Implement the SecretProvider interface | Azure Key Vault integration |
| Custom metric exporters | Implement the MetricExporter interface | StatsD exporter |
| Custom storage backends | Implement the StorageBackend interface (server mode) | MongoDB storage |
