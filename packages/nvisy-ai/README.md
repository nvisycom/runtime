# @nvisy/ai

[![Build](https://img.shields.io/github/actions/workflow/status/nvisycom/runtime/build.yml?branch=main&label=build%20%26%20test&style=flat-square)](https://github.com/nvisycom/runtime/actions/workflows/build.yml)

AI provider module for the Nvisy runtime.

## Features

- **OpenAI, Anthropic, and Gemini providers** with credential validation and connection lifecycle management
- **Embedding generation** action for converting documents to vectors
- **Chunking** actions (character, section, page, semantic similarity, contextual)
- **Partitioning** actions for extracting text from blobs and documents
- **Enrichment** action for AI-powered metadata extraction, NER, and content description

## Overview

Provides LLM and embedding model integrations for AI-powered data pipelines. The module exposes:

- **Providers** (`ai/openai`, `ai/anthropic`, `ai/gemini`): connection lifecycle management with credential validation.
- **Actions**:
  - `ai/embed`: generate embeddings from documents
  - `ai/chunk`: split documents by character, section, or page boundaries
  - `ai/chunk_semantic`: split documents using embedding similarity or LLM context
  - `ai/partition`: extract text from blobs, split by regex rules
  - `ai/partition_vlm`: VLM-based partitioning (stub)
  - `ai/enrich`: extract metadata, entities, descriptions via LLM

## Usage

```ts
import { aiModule } from "@nvisy/ai";

engine.register(aiModule);
```

## Changelog

See [CHANGELOG.md](../../CHANGELOG.md) for release notes and version history.

## License

Apache 2.0 License - see [LICENSE.txt](../../LICENSE.txt)

## Support

- **Documentation**: [docs.nvisy.com](https://docs.nvisy.com)
- **Issues**: [GitHub Issues](https://github.com/nvisycom/runtime/issues)
- **Email**: [support@nvisy.com](mailto:support@nvisy.com)
