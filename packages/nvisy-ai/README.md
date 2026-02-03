# @nvisy/ai

[![Build](https://img.shields.io/github/actions/workflow/status/nvisycom/runtime/build.yml?branch=main&label=build%20%26%20test&style=flat-square)](https://github.com/nvisycom/runtime/actions/workflows/build.yml)

AI provider module for the Nvisy runtime.

## Features

- **OpenAI, Anthropic, and other LLM providers** with credential validation and connection lifecycle management
- **Embedding generation** streams for converting text to vectors
- **Completion streams** for LLM inference in pipelines
- **Token counting and cost tracking** actions

## Overview

Provides LLM and embedding model integrations for AI-powered data pipelines. The module exposes:

- **Providers** (`ai/openai`, `ai/anthropic`): connection lifecycle management with credential validation.
- **Streams** (`ai/embed`, `ai/complete`): embedding generation and LLM completion streams.
- **Actions** (`ai/chunk`, `ai/tokenize`): text processing transforms for AI pipelines.

## Usage

```ts
import { aiModule } from "@nvisy/ai";

registry.load(aiModule);
```

## Changelog

See [CHANGELOG.md](../../CHANGELOG.md) for release notes and version history.

## License

Apache 2.0 License - see [LICENSE.txt](../../LICENSE.txt)

## Support

- **Documentation**: [docs.nvisy.com](https://docs.nvisy.com)
- **Issues**: [GitHub Issues](https://github.com/nvisycom/runtime/issues)
- **Email**: [support@nvisy.com](mailto:support@nvisy.com)
