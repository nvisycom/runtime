# Nvisy Runtime — Architecture

**Technical architecture specification for the Nvisy Runtime ETL platform.**

---

## 1. Overview

Nvisy Runtime is a TypeScript-native, DAG-based ETL platform for AI data workloads. It is structured as a set of composable packages that can be consumed as a library, driven by a CLI, or deployed as a long-lived server.

This document defines the system architecture: package boundaries, data flow, execution model, connector interface, graph compilation, scheduling, error handling, and observability. It is intended as the authoritative reference for implementation.

---

## 2. Package Structure

The system is organized as a monorepo of npm packages under the `@nvisy` scope.

```
packages/
  nvisy-core/           Primitives, type system, validation, errors,
                        base interfaces for sources, sinks, and actions,
                        and core observability (structured logging, metrics, tracing)
  nvisy-sql/            SQL connectors (PostgreSQL, MySQL)
  nvisy-object/         Object store and file format connectors (S3, GCS, Parquet, JSONL, CSV)
  nvisy-vector/         Vector database connectors (Pinecone, Qdrant, Milvus, Weaviate, pgvector)
  nvisy-runtime/        Graph definition, JSON parser, DAG compiler, execution engine,
                        task runner, retry logic, concurrency control,
                        runtime-level observability (run metrics, node tracing)
  nvisy-server/         HTTP server (Hono), REST API, cron scheduler, dashboard backend,
                        server-level observability (request logging, health endpoints)
  nvisy-cli/            Command-line interface
```

### Dependency graph

```
nvisy-cli ──────────┐
nvisy-server ───────┤
                    ▼
              nvisy-runtime
                    │
                    ▼
          nvisy-{sql,object,vector}
                    │
                    ▼
               nvisy-core
```

Every package depends on `nvisy-core`. The three connector packages (`nvisy-sql`, `nvisy-object`, `nvisy-vector`) are siblings — they depend on `nvisy-core` for the base source, sink, and action interfaces, but are independent of each other. Users install only the connector packages relevant to their workload. `nvisy-runtime` is the central package that owns graph definition, compilation, and execution. No circular dependencies are permitted. Packages communicate through typed interfaces, never through implementation details.

### Observability distribution

There is no dedicated observability package. Instead, observability is distributed across three layers:

- **`nvisy-core`** defines the observability primitives: structured log format, metric types, trace span interface, and lineage record structure. It also exports the logging, metrics, and tracing utilities that all other packages use.
- **`nvisy-runtime`** emits runtime observability: graph run duration, node execution times, primitives processed/failed, connector call counts, rate limit wait times. Each graph run produces an OpenTelemetry-compatible trace with nodes as spans.
- **`nvisy-server`** emits server-level observability: HTTP request logging, health check endpoints, and metric export endpoints (Prometheus, OpenTelemetry).

---

## 3. Effect as the Foundation

The entire platform is built on **Effect**, a TypeScript library for typed, composable functional programming. Effect is not an incidental dependency — it is the architectural foundation.

### 3.1 Why Effect

Traditional TypeScript ETL code suffers from scattered try/catch blocks, untyped error propagation, manual resource cleanup, ad-hoc retry logic, and opaque concurrency. Effect solves all of these structurally:

- **Typed errors.** Every operation declares its possible failure modes in the type signature. The compiler enforces that all errors are handled. This replaces the error taxonomy in earlier iterations of this spec with a mechanism that is checked at compile time, not just documented.
- **Resource safety.** Connector lifecycle (connect, use, disconnect) is modeled as Effect scoped resources. Cleanup is guaranteed regardless of success, failure, or interruption.
- **Concurrency.** Effect provides structured concurrency with fibers, semaphores, and queues. The runtime's concurrency control, rate limiting, and backpressure are implemented using these primitives rather than hand-rolled state machines.
- **Dependency injection.** Connectors, configuration, logging, and metrics are modeled as Effect services, injected via layers. This makes every component testable in isolation without mocks or stubs.
- **Composition.** Sources, sinks, actions, and graph nodes compose using Effect's pipe and flatMap combinators. A graph is ultimately a composed Effect program.
- **Retries and scheduling.** Effect provides built-in retry policies with configurable backoff, jitter, and error filtering — replacing custom retry implementations.

### 3.2 Effect in practice

Every Source, Sink, and Action interface returns an `Effect` value rather than a raw `Promise`. Error channels are typed — a connector that can fail with a rate limit error or a connection error declares both in its type. The runtime executes the compiled graph as a single Effect program, gaining automatic resource management, structured concurrency, and typed error propagation without additional plumbing.

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

- **Source** — reads primitives from an external system. Declares supported primitive types. Returns an Effect-based stream of primitives.
- **Sink** — writes primitives to an external system. Declares capabilities (batch size, upsert support, rate limits). Returns an Effect with a result summary.
- **Action** — transforms primitives. Receives one or more primitives and returns zero or more primitives. Actions may be stateless (map, filter) or stateful (deduplicate, aggregate).

All three interfaces include lifecycle methods (connect, disconnect, health check) and capability declarations. By housing these interfaces in `nvisy-core`, the connector packages and any community-contributed connectors share a single, versioned contract. All methods return Effect values with typed error channels.

### 4.5 Error taxonomy

The core package defines a structured error hierarchy using Effect's tagged error pattern. All errors carry a machine-readable tag, and the type system ensures exhaustive handling. The hierarchy distinguishes connector errors, validation errors, rate limit errors, timeout errors, graph compilation errors, and node execution errors. Because errors are in the Effect type channel, the compiler enforces that callers handle them — there are no uncaught exceptions by design.

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

### 5.2 `nvisy-sql`

Implements the Source and Sink interfaces for relational databases. Initial targets: PostgreSQL and MySQL. Connectors handle connection pooling, query generation, type mapping between SQL types and primitive payloads, and batch insert/upsert operations.

### 5.3 `nvisy-object`

Implements the Source and Sink interfaces for object stores and file formats. Initial targets: S3, GCS, Parquet, JSONL, and CSV. Object store connectors handle multipart uploads, streaming reads, and prefix-based listing. File format connectors handle serialization, deserialization, schema inference, and chunked reading for large files.

### 5.4 `nvisy-vector`

Implements the Source and Sink interfaces for vector databases. Initial targets: Pinecone, Qdrant, Milvus, Weaviate, and pgvector. Vector connectors handle collection/index management, upsert with metadata, batch operations, and dimensionality validation.

### 5.5 Connector registry

Connectors are registered by name in a global registry. The graph compiler resolves connector references at compilation time. Community connectors install as npm packages and self-register via the standard interface exported by `nvisy-core`.

---

## 6. Runtime (`nvisy-runtime`)

The runtime package owns the full lifecycle of a graph: definition, compilation, and execution.

### 6.1 Graph definition and JSON serializability

The central design constraint is that every graph must be representable as a plain JSON document. This means graphs can be stored in a database, versioned in source control, transmitted over an API, diffed, and reconstructed without loss. The programmatic TypeScript API is a convenience layer that produces the same JSON structure.

A graph is a directed acyclic graph of **nodes**. Each node declares its type (source, action, sink, branch, fanout, fanin), its configuration, its upstream dependencies, and optional execution policies (retry, timeout, concurrency). Nodes are connected by edges derived from the dependency declarations.

### 6.2 Node types

**Source** — References a registered connector by name and provides connection and extraction configuration.

**Action** — Applies a transformation to primitives. Two sub-modes are supported. Declarative actions reference a built-in operation by name (chunk, embed, filter, map, deduplicate, validate, convert) with configuration parameters. Code actions reference a TypeScript module and export name, resolved at runtime.

**Sink** — References a registered connector by name and provides connection and load configuration.

**Branch** — Routes each primitive to one of several downstream nodes based on a predicate. A default route handles unmatched primitives.

**FanOut** — Duplicates each primitive to multiple downstream nodes for parallel processing (e.g., embedding the same text with multiple models simultaneously).

**FanIn** — Collects primitives from multiple upstream nodes and merges them into a single stream.

### 6.3 Graph compilation

JSON graph definitions are parsed and validated against a JSON Schema. The parser resolves node references (string IDs to node definitions), connector references (string names to registered connectors), operation references (string names to built-in actions), and the dependency graph (topological sort, cycle detection). If validation fails, structured errors with JSON paths are returned.

The graph compiler transforms a validated graph definition into an executable `ExecutionPlan`. The compilation pipeline resolves all connector and action references, builds the DAG, computes parallelism constraints, aggregates rate limits, and estimates resource requirements. The `ExecutionPlan` is an immutable data structure. Compilation itself is an Effect, producing typed errors on failure.

### 6.4 Execution model

The runtime executes an `ExecutionPlan` as a composed Effect program. It walks the DAG in topological order, maintaining four internal structures: a **ready queue** (nodes whose dependencies are all satisfied), a **running pool** (nodes currently executing, bounded by max concurrency via Effect semaphores), a **retry queue** (nodes awaiting retry via Effect's built-in retry policies), and a **done store** (completed results, both successes and terminal failures).

### 6.5 Data flow between nodes

Data flows between nodes through Effect streams. When a node completes a batch of primitives, they are immediately available to downstream nodes. This enables pipeline parallelism — downstream nodes can begin processing before upstream nodes finish.

For nodes that require all upstream data before starting (e.g., deduplication across the full dataset), a **materialization barrier** can be configured, causing the runtime to buffer all upstream output before invoking the node.

### 6.6 Retry policy

Each node can define a retry policy specifying maximum retries, backoff strategy (fixed, exponential, or jitter), initial and maximum delay, and an optional allowlist of retryable error codes. Effect's `Schedule` module provides the implementation. The runtime distinguishes between retryable errors (network timeouts, rate limits, transient API failures) and terminal errors (authentication failures, schema violations, invalid configuration). Terminal errors fail the node immediately.

### 6.7 Rate limiting

Rate limits are enforced per-connector using Effect's `RateLimiter`. When a node issues a request that would exceed the rate limit, the fiber is suspended until tokens are available. Rate limits are declared in connector capabilities and can be overridden in graph configuration.

### 6.8 Concurrency control

Global concurrency is bounded by a configurable Effect semaphore (default: 10 permits). Per-node concurrency can be set individually. The runtime respects both limits simultaneously.

### 6.9 Runtime observability

The runtime emits structured metrics and trace spans for every graph run. Each run is an OpenTelemetry trace; each node execution is a span within that trace. Metrics include run duration, run status (success, partial failure, failure), per-node execution time, primitives processed and failed, connector calls issued, and rate limit wait time.

---

## 7. Server (`nvisy-server`)

### 7.1 Components

The server mode adds three components on top of the runtime:

1. **REST API** — Graph CRUD, run management, connector health checks
2. **Cron Scheduler** — Periodic graph execution on cron expressions with timezone support
3. **Event Triggers** — Webhook-driven graph execution with configurable authentication

The HTTP layer is built on **Hono**, a lightweight, edge-compatible web framework. Hono provides routing, middleware composition, and request validation with minimal overhead.

### 7.2 REST API

The API surface covers graph lifecycle management, run execution and monitoring, connector introspection, and lineage queries. All endpoints accept and return JSON. Since graphs are natively JSON-serializable, the API stores and retrieves them without transformation.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness probe |
| `GET` | `/ready` | Readiness probe |
| `POST` | `/api/graphs` | Create a new graph definition |
| `GET` | `/api/graphs` | List all graphs |
| `GET` | `/api/graphs/:id` | Get a graph by ID |
| `PUT` | `/api/graphs/:id` | Replace a graph definition |
| `DELETE` | `/api/graphs/:id` | Delete a graph |
| `POST` | `/api/graphs/validate` | Validate a graph definition without persisting |
| `POST` | `/api/graphs/:graphId/runs` | Trigger a new run for a graph |
| `GET` | `/api/graphs/:graphId/runs` | List runs for a graph |
| `GET` | `/api/runs/:id` | Get run status and details |
| `POST` | `/api/runs/:id/cancel` | Cancel a running execution |
| `GET` | `/api/connectors` | List all registered connectors |
| `GET` | `/api/connectors/:name` | Get connector details and capabilities |
| `GET` | `/api/connectors/:name/health` | Health check a specific connector |
| `GET` | `/api/lineage/:primitiveId` | Trace the full lineage of a primitive |

### 7.3 Persistence

The server stores graph definitions, run history, and execution state in a pluggable storage backend. The default backend is SQLite for single-node deployments. PostgreSQL is supported for production use.

### 7.4 Scheduling and triggers

Graphs can be scheduled with cron expressions (timezone-aware, with configurable catch-up behavior) or triggered by inbound webhooks (with configurable path, method, and authentication).

### 7.5 Server observability

The server layer emits HTTP request logs (structured JSON with method, path, status, latency), exposes health check and readiness endpoints, and provides metric export endpoints for Prometheus and OpenTelemetry collectors.

---

## 8. CLI (`nvisy-cli`)

The CLI provides commands for development, testing, and operations: initializing a new graph project, validating a graph definition, executing a graph locally, simulating execution without external calls (dry-run), listing available connectors, checking connector health, and starting the server.

---

## 9. Error Handling

### 9.1 Error propagation

Errors propagate through the DAG via Effect's typed error channel. When a node encounters an error, the runtime first checks retryability. If the error is retryable and retries remain, the node is re-queued with backoff. If the error is terminal or retries are exhausted, the node is marked as failed. Downstream nodes that depend on the failed node are marked as skipped. Independent branches of the DAG continue executing. The graph run is marked as `partial_failure` or `failure` depending on whether any terminal sink node succeeded.

Because errors are typed in the Effect channel, the compiler ensures exhaustive handling at every layer — from connector to runtime to server. There are no unhandled promise rejections or silent swallowed errors.

### 9.2 Dead letter queue

Primitives that fail processing can be routed to a dead letter queue (DLQ) instead of failing the entire node. This allows the graph to continue processing valid data while capturing failures for later inspection and replay.

---

## 10. Security

### 10.1 Secret management

Connector credentials are never stored in graph definitions. They are resolved at runtime from environment variables, a pluggable secret provider interface (supporting AWS Secrets Manager, HashiCorp Vault, and similar systems), or `.env` files in development. Secret providers are modeled as Effect services, injected via layers.

### 10.2 Network and access control

In server mode, the REST API supports TLS termination, bearer token authentication, IP allowlisting, and CORS configuration via Hono middleware.

### 10.3 Data handling

Primitives may contain sensitive data (PII in completions, proprietary embeddings). The platform provides configurable data retention policies per graph, primitive redaction hooks for logging, and encryption at rest for server-mode persistence.

---

## 11. Performance Considerations

### 11.1 Memory management

Primitives are processed in streaming fashion wherever possible using Effect streams. Nodes that must materialize full datasets (deduplication, sorting) use configurable memory limits and spill to disk when exceeded.

### 11.2 Embedding vectors

Embedding vectors use `Float32Array` for memory efficiency — a 1536-dimensional embedding occupies 6 KB vs. approximately 24 KB as a JSON number array. For large-scale embedding workloads, this 4x reduction is significant.

### 11.3 Batching

Connectors declare their optimal batch size. The runtime automatically batches primitives to match, reducing round trips to external systems. Batching respects rate limits — a batch that would exceed the rate limit is delayed, not split.

### 11.4 Backpressure

Effect streams provide built-in backpressure. When a downstream node processes slower than its upstream, the connecting stream suspends the upstream fiber until the downstream is ready. This prevents memory exhaustion in unbalanced graphs without manual flow control.

---

## 12. Extension Points

The platform is designed for extension at multiple levels:

| Extension Point | Mechanism | Example |
|----------------|-----------|---------|
| Custom primitive types | Extend the primitive type union and implement a payload interface | Graph embedding type |
| Custom connectors | Implement Source or Sink from `nvisy-core` | Elasticsearch connector |
| Custom actions | Implement Action from `nvisy-core`, or provide an inline function | Custom chunking strategy |
| Custom secret providers | Implement the SecretProvider Effect service | Azure Key Vault integration |
| Custom metric exporters | Implement the MetricExporter Effect service | StatsD exporter |
| Custom storage backends | Implement the StorageBackend Effect service (server mode) | MongoDB storage |

---

## 13. Technology Choices

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Language | TypeScript | Type safety for the primitive system, broad ecosystem |
| Runtime | Node.js | Async I/O suited for connector-heavy workloads, npm ecosystem |
| Foundation | Effect | Typed errors, resource safety, structured concurrency, dependency injection, composition |
| Package manager | npm workspaces | Monorepo management without additional tooling |
| Build | tsup or tsc | Fast TypeScript compilation, ESM + CJS output |
| Testing | Vitest | Fast, TypeScript-native, ESM-compatible |
| Linting | Biome | Unified formatter and linter, high performance |
| HTTP framework | Hono | Lightweight, edge-compatible, fast routing, middleware composition |
| CLI framework | Commander | Lightweight, well-maintained |
| Cron | croner | Lightweight, timezone-aware scheduling |

---

## 14. Development Roadmap

### Phase 1 — Foundation
- `nvisy-core`: Primitive type system, validation, error taxonomy, base Source/Sink/Action interfaces, observability primitives
- `nvisy-object`: S3 and JSONL connectors as initial proof of concept
- `nvisy-vector`: Qdrant connector as initial vector target
- `nvisy-runtime`: Graph definition model, JSON parser, DAG compiler, execution engine with retry and concurrency control, runtime metrics and tracing
- `nvisy-cli`: `init`, `validate`, `run` commands

### Phase 2 — Breadth
- `nvisy-vector`: Pinecone, Milvus, Weaviate, pgvector
- `nvisy-sql`: PostgreSQL, MySQL
- `nvisy-object`: GCS, Parquet, CSV
- Built-in actions: chunk, embed, deduplicate, filter, map, validate, convert
- DLQ support
- Dry-run mode

### Phase 3 — Server
- `nvisy-server`: REST API (Hono), cron scheduler, event triggers, server-level observability
- Storage backends (SQLite, PostgreSQL)
- Web dashboard

### Phase 4 — Production hardening
- Backpressure and memory management
- Disk spill for materialization nodes
- Secret provider integrations
- TLS, auth, and security hardening
- Performance benchmarks and optimization
- Community connector SDK and documentation
