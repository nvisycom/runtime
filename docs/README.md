# Nvisy Runtime

**An open-source ETL platform purpose-built for LLM and AI data pipelines.**

---

## Abstract

The proliferation of large language models and embedding-based retrieval systems has created a new category of data engineering problem. Teams building AI-powered products must continuously move, transform, and validate data across a fragmented ecosystem of vector databases, model APIs, object stores, relational databases, and file formats — each with its own schema conventions, rate limits, and failure modes.

Existing ETL platforms were designed for tabular, row-oriented data. They lack first-class support for the primitives that define AI workloads: high-dimensional embeddings, completion traces, structured outputs, tool-call logs, audio and image payloads, and fine-tuning datasets. Engineers are left stitching together ad-hoc scripts, battling impedance mismatches between systems that were never designed to interoperate.

**Nvisy Runtime** addresses this gap. It is an open-source, TypeScript-native ETL platform that treats AI data as a first-class citizen. It provides a DAG-based execution engine, a typed primitive system for AI workloads, a broad connector ecosystem, and a declarative graph definition language — all designed to make AI data engineering reliable, observable, and composable.

---

## Problem Statement

### 1. AI data is structurally different from traditional data

An embedding is not a row. A completion trace carries metadata (model, temperature, token counts, latency, cost) that has no analog in a traditional ETL schema. Fine-tuning datasets impose strict structural contracts. Tool-call sequences are trees, not tables. Current ETL platforms force these structures into tabular representations, losing semantic information and making transformations error-prone.

### 2. The connector ecosystem is fragmented and immature

Vector databases (Pinecone, Qdrant, Milvus, Weaviate, pgvector) expose incompatible APIs for upsert, query, and metadata filtering. Model provider APIs (OpenAI, Anthropic, Cohere, local inference servers) differ in authentication, rate limiting, batching, and response structure. Object stores, relational databases, and file formats each add their own integration surface. Teams rewrite the same connector logic project after project.

### 3. Pipeline orchestration for AI workloads has unique requirements

AI pipelines are not simple source-to-sink flows. They involve conditional branching (route data based on classification), fan-out (embed the same text with multiple models), rate-limited external calls (respect API quotas), idempotent retries (avoid duplicate embeddings), and cost tracking (monitor spend per pipeline run). General-purpose orchestrators like Airflow or Prefect can model these patterns, but they provide no native abstractions for them.

### 4. Observability is an afterthought

When an embedding pipeline fails at 3 AM, engineers need to know: which records failed, at which stage, with what error, and whether retrying is safe. They need lineage — the ability to trace a vector in a database back to the source document, through every transformation it passed through. Current tooling provides none of this out of the box.

---

## Design Principles

### AI-native type system

Every data object flowing through a Nvisy graph is a typed AI primitive: `Embedding`, `Completion`, `StructuredOutput`, `ToolCallTrace`, `ImagePayload`, `AudioPayload`, `FineTuneSample`, or a user-defined extension. Primitives carry domain-specific metadata and enforce structural contracts at compile time (TypeScript) and runtime (validation).

### DAG-based execution

Graphs are directed acyclic graphs of nodes. The runtime resolves dependencies, manages parallelism, handles retries, and tracks execution state. This model supports conditional branching, fan-out/fan-in patterns, and partial re-execution of failed subgraphs — all essential for production AI workloads.

### Declarative-first, code-escape-hatch

Common operations (extract, map, filter, chunk, embed, deduplicate, load) are expressed declaratively in JSON graph definitions. For operations that require custom logic, users drop into TypeScript functions that receive and return typed primitives. The declarative layer compiles down to the same execution graph as hand-written code. Because graphs are plain JSON, they are trivially serializable, storable, versionable, and transmittable over the wire.

### Effect-driven runtime

The platform is built on Effect, a TypeScript library for typed, composable, and observable functional programming. Effect provides the foundation for error handling, concurrency, dependency injection, retries, scheduling, and resource management. This choice eliminates ad-hoc error propagation, makes side effects explicit and testable, and gives every operation in the system a uniform composition model.

### Broad, pluggable connectors

Connectors are organized into domain-specific packages — SQL, object storage, and vector databases — each installable independently. All connectors implement a standard source/sink interface defined in `nvisy-core`, making community contributions straightforward. Users install only the connector packages they need.

### Library and server modes

Nvisy Runtime can be embedded as an npm package for programmatic use, run as a CLI for scripting and CI/CD, or deployed as a long-lived server with a REST API, scheduler, and dashboard. The same graph definition works in all three modes.

---

## Core Concepts

### Primitives

A **primitive** is the unit of data in a Nvisy graph. Unlike raw JSON blobs, primitives are typed, validated, and carry metadata relevant to their domain. For example, an `Embedding` primitive contains the vector, its dimensionality, the model that produced it, the source text, and a content hash for deduplication.

### Graphs

A **graph** is a DAG of **nodes**. Each node is one of:

- **Source** — reads data from an external system via a connector
- **Action** — applies a transformation or declarative operation to primitives
- **Sink** — writes data to an external system via a connector
- **Branch** — routes primitives to different downstream nodes based on a condition
- **FanOut / FanIn** — duplicates primitives across parallel subgraphs and merges results

Graphs are defined as JSON structures. This makes them inherently serializable — they can be stored in a database, versioned in source control, transmitted over an API, and reconstructed without loss of fidelity. The programmatic TypeScript API produces the same JSON representation.

### Connectors

A **connector** is an adapter that knows how to read from or write to an external system. All connectors implement the source and sink interfaces defined in `nvisy-core`, and declare their capabilities (batch size, rate limits, supported primitive types). Connectors are organized into domain-specific packages: `nvisy-sql` for relational databases, `nvisy-object` for object stores and file formats, and `nvisy-vector` for vector databases.

### Runtime

The **runtime** is responsible for compiling and executing graphs. It parses JSON graph definitions, compiles them into execution plans, resolves node dependencies, manages concurrency limits, enforces rate limits on external calls, retries failed nodes with configurable backoff, and emits execution events for observability.

---

## Deployment Modes

| Mode | Use Case | Entry Point |
|------|----------|-------------|
| **Library** | Embedded in application code | `import { graph } from "@nvisy/runtime"` |
| **CLI** | Scripts, CI/CD, one-off jobs | `nvisy run graph.json` |
| **Server** | Production scheduling, monitoring | `nvisy serve --port 8080` |

The server mode exposes a REST API for graph management, a scheduler for cron and event-triggered execution, and a web dashboard for monitoring runs, inspecting lineage, and debugging failures.

---

## Project Status

Nvisy Runtime is in the specification and design phase. This document serves as the product specification. Implementation will proceed according to the architecture defined in [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## License

Apache License 2.0. See [LICENSE.txt](../LICENSE.txt).

---

## Contributing

Contribution guidelines will be published once the core architecture stabilizes. The project is designed for community-contributed connectors and actions from the outset.
