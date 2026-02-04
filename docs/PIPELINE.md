# Pipeline Architecture

Overview of all providers, streams, and actions across the nvisy platform.

## Modules

### `@nvisy/sql` — Relational databases

| Component | Name | Description |
|-----------|------|-------------|
| Provider | `sql/postgres` | PostgreSQL connection via node-postgres |
| Provider | `sql/mysql` | MySQL connection via mysql2 |
| Provider | `sql/mssql` | MSSQL connection via tedious |
| Stream | `sql/read` | Keyset-paginated source stream |
| Stream | `sql/write` | Batch-insert sink stream |
| Action | `sql/filter` | Entry-level filtering |
| Action | `sql/project` | Column projection |
| Action | `sql/rename` | Column renaming |
| Action | `sql/coerce` | Type coercion |

## Data Flow

```
Source Node          Action Node          Target Node
┌──────────┐        ┌──────────┐        ┌──────────┐
│ provider │──edge──│  action  │──edge──│ provider │
│ + stream │  queue │  .pipe() │  queue │ + stream │
│  .read() │        │          │        │  .write()│
└──────────┘        └──────────┘        └──────────┘
```

1. **Source** connects to a provider, reads via stream `read()`, pushes `Resumable<Data>` items to downstream edge queues.
2. **Action** consumes an `AsyncIterable<Data>` from edge queues, transforms via `pipe()`, pushes results downstream.
3. **Target** connects to a provider, drains edge queues, writes each item via stream `write()`.

## Edge Queues

Edges use Effection `Queue<Data, void>` for inter-node communication.
Action nodes bridge queues to `ReadableStream<Data>` via `edgesToIterable()`,
which exposes a standard `AsyncIterable` while keeping the drain loop inside
Effection structured concurrency.

Target nodes drain queues directly within Effection operations.

## Retry & Cancellation

- Each node can carry a `RetryPolicy` (exponential, fixed, or jitter backoff).
- Errors with `retryable === false` skip retries immediately.
- `execute(plan, { signal })` supports `AbortSignal` — aborting halts all
  spawned node tasks via Effection structured concurrency.

## Stream Resolution

Streams are resolved during plan compilation using the convention
`"${moduleId}/read"` for sources and `"${moduleId}/write"` for targets,
derived from the provider name prefix (e.g. provider `sql/postgres` resolves
streams from module `sql`).
