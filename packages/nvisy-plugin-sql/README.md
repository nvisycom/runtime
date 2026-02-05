# @nvisy/plugin-sql

[![Build](https://img.shields.io/github/actions/workflow/status/nvisycom/runtime/build.yml?branch=main&label=build%20%26%20test&style=flat-square)](https://github.com/nvisycom/runtime/actions/workflows/build.yml)

SQL provider plugin for the Nvisy runtime.

## Features

- **Postgres, MySQL, and MSSQL** providers with credential validation and connection lifecycle management
- **Keyset-paginated reads** for efficient, resumable streaming over large tables
- **Per-item writes** via Kysely INSERT for batch pipeline sinks
- **Row-level transforms**: filter, project, rename, and coerce columns in the pipeline

## Overview

Provides Postgres, MySQL, and MSSQL integrations through a unified Kysely-based client. The plugin exposes:

- **Providers** (`sql/postgres`, `sql/mysql`, `sql/mssql`): connection lifecycle management with credential validation.
- **Streams** (`sql/read`, `sql/write`): keyset-paginated source and per-item insert sink.
- **Actions** (`sql/filter`, `sql/project`, `sql/rename`, `sql/coerce`): row-level transforms applied in the pipeline.

## Usage

```ts
import { sqlPlugin } from "@nvisy/plugin-sql";

registry.load(sqlPlugin);
```

## Changelog

See [CHANGELOG.md](../../CHANGELOG.md) for release notes and version history.

## License

Apache 2.0 License - see [LICENSE.txt](../../LICENSE.txt)

## Support

- **Documentation**: [docs.nvisy.com](https://docs.nvisy.com)
- **Issues**: [GitHub Issues](https://github.com/nvisycom/runtime/issues)
- **Email**: [support@nvisy.com](mailto:support@nvisy.com)
