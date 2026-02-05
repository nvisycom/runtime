# @nvisy/server

[![Build](https://img.shields.io/github/actions/workflow/status/nvisycom/runtime/build.yml?branch=main&label=build%20%26%20test&style=flat-square)](https://github.com/nvisycom/runtime/actions/workflows/build.yml)

HTTP server for the Nvisy Runtime platform, built on Hono.

## Features

- **REST API**: graph lifecycle management, run execution, and monitoring
- **Connector health checks**: verify provider connections before execution
- **Cron scheduling**: time-based pipeline triggers
- **Webhook events**: HTTP-based pipeline triggers

## Overview

Exposes a REST API for graph lifecycle management, run execution and monitoring, connector health checks, and lineage queries. Includes cron-based scheduling and webhook event triggers.

## Usage

```ts
import { createServer } from "@nvisy/server";

const server = createServer({
  engine,
  port: 3000,
});

await server.start();
```

## Changelog

See [CHANGELOG.md](../../CHANGELOG.md) for release notes and version history.

## License

Apache 2.0 License - see [LICENSE.txt](../../LICENSE.txt)

## Support

- **Documentation**: [docs.nvisy.com](https://docs.nvisy.com)
- **Issues**: [GitHub Issues](https://github.com/nvisycom/runtime/issues)
- **Email**: [support@nvisy.com](mailto:support@nvisy.com)
