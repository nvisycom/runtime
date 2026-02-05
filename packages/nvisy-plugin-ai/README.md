# @nvisy/plugin-ai

[![Build](https://img.shields.io/github/actions/workflow/status/nvisycom/runtime/build.yml?branch=main&label=build%20%26%20test&style=flat-square)](https://github.com/nvisycom/runtime/actions/workflows/build.yml)

AI provider plugin for the Nvisy runtime, backed by the [Vercel AI SDK](https://sdk.vercel.ai).

## Features

- **Embedding generation** — batch-embed documents into vectors
- **Chunking** — character, section, page, embedding-similarity, and LLM-contextual strategies
- **Partitioning** — extract text from blobs and documents (auto-detect or regex rules)
- **Enrichment** — metadata extraction, NER, image/table description, and table-to-HTML via LLM

## Overview

Provides LLM and embedding model integrations for AI-powered data pipelines. The plugin exposes:

- **Providers**:
  - `ai/openai-completion` — OpenAI completion (language model)
  - `ai/openai-embedding` — OpenAI embedding
  - `ai/anthropic-completion` — Anthropic completion
  - `ai/gemini-completion` — Gemini completion
  - `ai/gemini-embedding` — Gemini embedding
- **Actions**:
  - `ai/embed` — generate embeddings from documents (batched)
  - `ai/chunk` — split documents by character, section, or page boundaries
  - `ai/chunk_similarity` — split using embedding cosine-similarity thresholds
  - `ai/chunk_contextual` — split using an LLM to find natural boundaries
  - `ai/partition` — extract text from blobs/documents (auto or regex rules)
  - `ai/partition_contextual` — AI-based contextual partitioning (stub, not yet implemented)
  - `ai/enrich` — extract metadata, entities, image/table descriptions, or convert tables to HTML via LLM

## Usage

```ts
import { aiPlugin } from "@nvisy/plugin-ai";

engine.register(aiPlugin);
```

## Changelog

See [CHANGELOG.md](../../CHANGELOG.md) for release notes and version history.

## License

Apache 2.0 License - see [LICENSE.txt](../../LICENSE.txt)

## Support

- **Documentation**: [docs.nvisy.com](https://docs.nvisy.com)
- **Issues**: [GitHub Issues](https://github.com/nvisycom/runtime/issues)
- **Email**: [support@nvisy.com](mailto:support@nvisy.com)
