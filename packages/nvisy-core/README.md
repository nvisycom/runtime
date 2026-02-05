# @nvisy/core

[![Build](https://img.shields.io/github/actions/workflow/status/nvisycom/runtime/build.yml?branch=main&label=build%20%26%20test&style=flat-square)](https://github.com/nvisycom/runtime/actions/workflows/build.yml)

Core primitives and abstractions for the Nvisy runtime platform.

## Features

- **Data types**: `Document`, `Embedding`, `Blob`, and `Entry` for pipeline data
- **Module system**: bundle providers, streams, and actions under a namespace
- **Provider abstraction**: connection lifecycle management with credential validation
- **Stream contracts**: resumable sources and sinks for external systems
- **Action contracts**: stream transforms with optional client dependencies
- **Error taxonomy**: `RuntimeError`, `ValidationError`, `ConnectionError`, `CancellationError`

## Overview

This package defines the foundational abstractions that all Nvisy modules implement:

- **Data types** (`Data`, `Document`, `Embedding`, `Blob`, `Entry`): immutable data containers that flow through pipelines.
- **Modules** (`Module.define`): namespace for grouping providers, streams, and actions.
- **Providers** (`Provider.withAuthentication`, `Provider.withoutAuthentication`): external client lifecycle management.
- **Streams** (`Stream.createSource`, `Stream.createTarget`): data I/O layer for reading from and writing to external systems.
- **Actions** (`Action.withClient`, `Action.withoutClient`): stream transforms that process data between sources and targets.

## Usage

### Defining a Provider

```ts
import { Provider } from "@nvisy/core";
import { z } from "zod";

const myProvider = Provider.withAuthentication("my-provider", {
  credentials: z.object({
    apiKey: z.string(),
    endpoint: z.string().url(),
  }),
  connect: async (creds) => {
    const client = await createClient(creds);
    return {
      client,
      disconnect: () => client.close(),
    };
  },
});
```

### Defining a Stream Source

```ts
import { Stream, Entry } from "@nvisy/core";
import { z } from "zod";

const mySource = Stream.createSource("my-source", MyClient, {
  types: [Entry, z.object({ cursor: z.string().optional() }), z.object({ limit: z.number() })],
  reader: async function* (client, ctx, params) {
    for await (const item of client.list({ cursor: ctx.cursor, limit: params.limit })) {
      yield { data: new Entry(item), context: { cursor: item.id } };
    }
  },
});
```

### Defining a Stream Target

```ts
import { Stream, Entry } from "@nvisy/core";
import { z } from "zod";

const myTarget = Stream.createTarget("my-target", MyClient, {
  types: [Entry, z.object({ collection: z.string() })],
  writer: (client, params) => async (item) => {
    await client.insert(params.collection, item.fields);
  },
});
```

### Defining an Action

```ts
import { Action, Entry } from "@nvisy/core";
import { z } from "zod";

const myFilter = Action.withoutClient("my-filter", {
  types: [Entry],
  params: z.object({ minValue: z.number() }),
  transform: async function* (stream, params) {
    for await (const entry of stream) {
      if ((entry.get("value") as number) >= params.minValue) {
        yield entry;
      }
    }
  },
});
```

### Bundling into a Module

```ts
import { Module } from "@nvisy/core";

const myModule = Module.define("my-module")
  .withProviders(myProvider)
  .withStreams(mySource, myTarget)
  .withActions(myFilter);

// Register with the engine
registry.load(myModule);
```

## Changelog

See [CHANGELOG.md](../../CHANGELOG.md) for release notes and version history.

## License

Apache 2.0 License - see [LICENSE.txt](../../LICENSE.txt)

## Support

- **Documentation**: [docs.nvisy.com](https://docs.nvisy.com)
- **Issues**: [GitHub Issues](https://github.com/nvisycom/runtime/issues)
- **Email**: [support@nvisy.com](mailto:support@nvisy.com)
