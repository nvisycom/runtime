# Nvisy Runtime

[![Build](https://img.shields.io/github/actions/workflow/status/nvisycom/runtime/build.yml?branch=main&label=build%20%26%20test&style=flat-square)](https://github.com/nvisycom/runtime/actions/workflows/build.yml)

An open-source ETL platform purpose-built for LLM and AI data pipelines.

Nvisy Runtime treats AI data as a first-class citizen: embeddings, completions,
structured outputs, tool-call traces, images, audio, and fine-tuning datasets
all flow through typed, validated primitives with full lineage tracking.

## Packages

| Package | Description |
|---------|-------------|
| [`nvisy-core`](packages/nvisy-core/) | Primitives, type system, errors, Source/Sink/Action interfaces |
| [`nvisy-runtime`](packages/nvisy-runtime/) | Graph definition, DAG compiler, execution engine |
| [`nvisy-server`](packages/nvisy-server/) | HTTP server (Hono), REST API, cron scheduler |
| `nvisy-sql` | SQL connectors (PostgreSQL, MySQL) |
| `nvisy-object` | Object store connectors (S3, GCS, Parquet, JSONL, CSV) |
| `nvisy-vector` | Vector database connectors (Pinecone, Qdrant, Milvus, Weaviate, pgvector) |
| `nvisy-cli` | Command-line interface |

See [packages/](packages/readme.md) for detailed descriptions.

## Quick Start

```bash
npm install
npm run build
```

## Documentation

- [Product Specification](docs/README.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Contributing](CONTRIBUTING.md)

## License

Apache License 2.0. See [LICENSE.txt](LICENSE.txt).
