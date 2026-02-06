# Packages

[![Build](https://img.shields.io/github/actions/workflow/status/nvisycom/runtime/build.yml?branch=main&label=build%20%26%20test&style=flat-square)](https://github.com/nvisycom/runtime/actions/workflows/build.yml)

## Core infrastructure

The runtime architecture follows a layered separation of concerns. At the
foundation, a shared core library defines the type system, error taxonomy, and
abstract interfaces that all other packages depend on. Above it, the runtime
engine implements a DAG-based execution model: pipeline definitions are parsed
from declarative JSON graphs, compiled into immutable execution plans, and
evaluated in topological order with structured concurrency, per-node retry
policies, and full lineage tracking across every data item. The server package
exposes this engine over HTTP, providing a REST API for pipeline management,
execution, and observability.

| Package | Description |
|---------|-------------|
| [`nvisy-core`](nvisy-core/) | Core data types, errors, and utilities |
| [`nvisy-runtime`](nvisy-runtime/) | Graph definition, DAG compiler, execution engine |
| [`nvisy-server`](nvisy-server/) | HTTP execution worker |

## Provider plugins

Provider plugins supply the I/O boundary of a pipeline. Each plugin implements
one or more _providers_ — authenticated clients to external systems — and
_streams_ — source or target adapters that read from or write to those systems
using the provider's client. This design decouples credential management from
data flow: a single provider connection can back multiple streams within the
same pipeline, and streams are reusable across providers that share a common
client interface. Provider plugins cover the six major categories of external
storage: relational databases, document stores, object stores, vector
databases, message queues, and AI model endpoints.

| Package | Description |
|---------|-------------|
| [`nvisy-plugin-ai`](nvisy-plugin-ai/) | AI provider integrations (OpenAI, Anthropic, Google) |
| [`nvisy-plugin-nosql`](nvisy-plugin-nosql/) | NoSQL database integrations (MongoDB, DynamoDB, Firestore) |
| [`nvisy-plugin-object`](nvisy-plugin-object/) | Object store integrations (S3, GCS, Azure Blob) |
| [`nvisy-plugin-queue`](nvisy-plugin-queue/) | Message queue integrations (Kafka, RabbitMQ, SQS, Redis Streams) |
| [`nvisy-plugin-sql`](nvisy-plugin-sql/) | SQL database integrations (Postgres, MySQL, MSSQL) |
| [`nvisy-plugin-vector`](nvisy-plugin-vector/) | Vector database integrations (Pinecone, Qdrant, Milvus, Weaviate, pgvector) |

## Action plugins

Action plugins operate on data in-flight without requiring external service
credentials. They implement pure transformations: a function from one typed data
item to another, executed locally within the pipeline process. This category
includes format conversion, structured parsing, and content extraction. Because
actions carry no provider dependency, they compose freely between any source and
target and introduce no additional authentication surface. The runtime
guarantees type safety at the graph edges — an action's input and output types
must match the adjacent nodes in the DAG.

| Package | Description |
|---------|-------------|
| [`nvisy-plugin-markup`](nvisy-plugin-markup/) | HTML, XML, JSON, CSV, TSV, and plain text parsing |
| [`nvisy-plugin-tesseract`](nvisy-plugin-tesseract/) | Optical character recognition (Tesseract) |
| [`nvisy-plugin-pandoc`](nvisy-plugin-pandoc/) | Document format conversion (Pandoc) |
