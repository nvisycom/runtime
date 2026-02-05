# @nvisy/runtime

[![Build](https://img.shields.io/github/actions/workflow/status/nvisycom/runtime/build.yml?branch=main&label=build%20%26%20test&style=flat-square)](https://github.com/nvisycom/runtime/actions/workflows/build.yml)

Graph definition, DAG compiler, and execution engine for the Nvisy platform.

## Features

- **Graph schema**: JSON-based pipeline definitions with source, action, and target nodes
- **DAG compiler**: validates graph structure, detects cycles, and produces execution plans
- **Execution engine**: runs pipelines with Effection-based structured concurrency
- **Retry policies**: configurable backoff strategies for transient failures
- **Timeout policies**: per-node execution time limits

## Overview

Parses JSON graph definitions into an immutable execution plan, then runs it — walking the DAG in topological order with Effection-based concurrency, retry policies, and timeout handling.

- **Schema** (`Graph`, `SourceNode`, `ActionNode`, `TargetNode`): Zod schemas for validating pipeline definitions.
- **Compiler** (`compile`): transforms a graph into an execution plan with resolved registry entries.
- **Engine** (`Engine`): validates, compiles, and executes graphs with connection management.

## Usage

### Registering Plugins

```ts
import { Engine } from "@nvisy/runtime";
import { sqlPlugin } from "@nvisy/plugin-sql";

const engine = new Engine().register(sqlPlugin);
```

### Validating a Graph

```ts
const result = engine.validate(graphDefinition, connections);

if (!result.valid) {
  console.error(result.errors);
}
```

### Executing a Graph

```ts
const result = await engine.execute(graphDefinition, connections, {
  signal: abortController.signal,
  onContextUpdate: (nodeId, credId, ctx) => {
    // Persist resumption context
  },
});

console.log(result.status); // "success" | "partial_failure" | "failure"
```

## Changelog

See [CHANGELOG.md](../../CHANGELOG.md) for release notes and version history.

## License

Apache 2.0 License - see [LICENSE.txt](../../LICENSE.txt)

## Support

- **Documentation**: [docs.nvisy.com](https://docs.nvisy.com)
- **Issues**: [GitHub Issues](https://github.com/nvisycom/runtime/issues)
- **Email**: [support@nvisy.com](mailto:support@nvisy.com)
