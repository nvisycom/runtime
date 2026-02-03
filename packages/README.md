# Packages

[![Build](https://img.shields.io/github/actions/workflow/status/nvisycom/runtime/build.yml?branch=main&label=build%20%26%20test&style=flat-square)](https://github.com/nvisycom/runtime/actions/workflows/build.yml)

The monorepo contains seven packages. The entry points (`nvisy-cli`,
`nvisy-server`) depend on all other packages. `nvisy-core` is the shared
foundation with no internal dependencies.

## nvisy-core

Shared primitives, type system, validation, error taxonomy, and base
interfaces for sources, sinks, and actions. Also houses core observability
utilities (structured logging, metrics, tracing). Every other package depends
on this one.

## nvisy-runtime

Graph definition, JSON parser, DAG compiler, and execution engine. Parses JSON
graph definitions into an immutable `ExecutionPlan`, then executes it —
walking the DAG in topological order, managing concurrency via Effect
semaphores, enforcing per-connector rate limits, retrying failed nodes with
configurable backoff, and emitting runtime metrics and OpenTelemetry traces.

## nvisy-sql

Source and Sink implementations for relational databases. Targets PostgreSQL
and MySQL. Handles connection pooling, query generation, type mapping, and
batch insert/upsert operations.

## nvisy-object

Source and Sink implementations for object stores and file formats. Targets S3,
GCS, Parquet, JSONL, and CSV. Handles multipart uploads, streaming reads,
prefix-based listing, schema inference, and chunked reading.

## nvisy-vector

Source and Sink implementations for vector databases. Targets Pinecone, Qdrant,
Milvus, Weaviate, and pgvector. Handles collection/index management, upsert
with metadata, batch operations, and dimensionality validation.

## nvisy-server

HTTP server built on Hono and Effect. Exposes a REST API for graph CRUD, run
management, connector health checks, and lineage queries. Includes a cron
scheduler, webhook-based event triggers, and server-level observability
(request logging, health endpoints, metric export).

## nvisy-cli

Command-line interface. Provides `init`, `validate`, `run`, `dry-run`,
`connectors list`, `connectors health`, and `serve` commands.
