# @nvisy/vector

[![Build](https://img.shields.io/github/actions/workflow/status/nvisycom/runtime/build.yml?branch=main&label=build%20%26%20test&style=flat-square)](https://github.com/nvisycom/runtime/actions/workflows/build.yml)

Vector database module for the Nvisy runtime.

## Features

- **Pinecone, Qdrant, Milvus, Weaviate, and pgvector** providers with credential validation and connection lifecycle management
- **Vector upsert streams** for writing embeddings to vector databases
- **Vector search streams** for similarity queries
- **Metadata filtering** actions for vector search results

## Overview

Provides vector database integrations for embedding storage and similarity search. The module exposes:

- **Providers** (`vector/pinecone`, `vector/qdrant`, `vector/milvus`, `vector/weaviate`, `vector/pgvector`): connection lifecycle management with credential validation.
- **Streams** (`vector/upsert`, `vector/search`): vector write and similarity search streams.
- **Actions** (`vector/filter`, `vector/rerank`): post-processing transforms for search results.

## Usage

```ts
import { vectorModule } from "@nvisy/vector";

registry.load(vectorModule);
```

## Changelog

See [CHANGELOG.md](../../CHANGELOG.md) for release notes and version history.

## License

Apache 2.0 License - see [LICENSE.txt](../../LICENSE.txt)

## Support

- **Documentation**: [docs.nvisy.com](https://docs.nvisy.com)
- **Issues**: [GitHub Issues](https://github.com/nvisycom/runtime/issues)
- **Email**: [support@nvisy.com](mailto:support@nvisy.com)
